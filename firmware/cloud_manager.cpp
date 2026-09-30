#include "cloud_manager.h"
#include "config.h"
#include "storage_manager.h"
#include "network_manager.h"
#include "diagnostics.h"

// ============================================================================
// KRUSHI Cloud Manager Implementation
// State Machine for Offline-Resilient 4G Ingestion to Supabase Gateway
// ============================================================================

CloudManager::CloudManager()
  : currentState(CloudUploadState::IDLE),
    lastUploadAttemptTime(0),
    lastUploadSuccessTime(0),
    currentBackoffMs(INITIAL_BACKOFF_MS),
    nextAllowedUploadTime(0),
    totalRecordsUploaded(0),
    failedUploadAttempts(0) {}

void CloudManager::begin() {
  Serial.println("\n[KRUSHI][CLOUD] Initializing High-Reliability Cloud Manager...");
  Serial.printf("[KRUSHI][CLOUD] Ingestion Host : %s\n", GATEWAY_HOST);
  Serial.printf("[KRUSHI][CLOUD] Batch Limit    : %u records\n", MAX_BATCH_SIZE);
  Serial.printf("[KRUSHI][CLOUD] TLS Security   : Pinning Active (ISRG Root X1)\n");
  currentState = CloudUploadState::IDLE;
  resetBackoff();
}

void CloudManager::update(
  StorageManager& storage,
  NetworkManager& network,
  Diagnostics& diagnostics
) {
#if !CLOUD_ENABLED
  (void)storage; (void)network; (void)diagnostics;
  return;
#endif

  unsigned long now = millis();

  // 1. Check if we are currently waiting under exponential backoff
  if (now < nextAllowedUploadTime) {
    currentState = CloudUploadState::BACKOFF_RETRY;
    return;
  }

  // 2. Read pending records from durable local storage
  size_t pendingCount = storage.getPendingCount();
  if (pendingCount == 0) {
    currentState = CloudUploadState::IDLE;
    return;
  }

  currentState = CloudUploadState::CHECK_PENDING;

  // 3. Check 4G Cellular connection ready?
  if (!network.connected()) {
    currentState = CloudUploadState::AWAIT_NETWORK;
    diagnostics.raise(
      "WARN_NET_DISCONNECTED",
      "WARNING",
      "Cellular connection offline. Preserving records in durable flash queue."
    );
    network.triggerReconnect();
    enterBackoff("Cellular offline", diagnostics);
    return;
  }

  // 4. Build bounded batch & send validated HTTPS request
  currentState = CloudUploadState::BUILDING_BATCH;
  bool uploadOk = uploadPendingBatch(storage, network, diagnostics);

  if (uploadOk) {
    resetBackoff();
    // If there are more pending records in the queue, schedule immediate processing for next batch
    if (storage.getPendingCount() > 0) {
      nextAllowedUploadTime = now + 100; // Fast drain burst
    }
  }
}

bool CloudManager::uploadPendingBatch(
  StorageManager& storage,
  NetworkManager& network,
  Diagnostics& diagnostics
) {
  std::vector<TelemetryRecord> batch;
  if (!storage.getPendingBatch(batch, MAX_BATCH_SIZE) || batch.empty()) {
    currentState = CloudUploadState::IDLE;
    return false;
  }

  currentState = CloudUploadState::TRANSMITTING;
  lastUploadAttemptTime = millis();

  Serial.printf("[KRUSHI][CLOUD] Building batch of %u records for secure ingestion...\n", (unsigned int)batch.size());

  // 1. Serialize records into canonical transmission payload
  String payload = serializeBatchPayload(batch);

  // 2. Transmit via NetworkManager over HTTPS with TLS validation and device authentication token
  String responseBody;
  int httpCode = 0;

  bool sendSuccess = network.sendHttpsPost(
    GATEWAY_SECURE_INGEST_URL,
    payload.c_str(),
    DEVICE_AUTH_TOKEN,
    responseBody,
    httpCode
  );

  // 3. Evaluate server response
  if (!sendSuccess || (httpCode != 200 && httpCode != 201)) {
    failedUploadAttempts++;
    char errBuf[128];
    snprintf(errBuf, sizeof(errBuf), "Server rejected upload (HTTP %d): %s", httpCode, responseBody.c_str());
    diagnostics.raise("ERR_CLOUD_HTTP_FAIL", "ERROR", errBuf);
    
    // Check for permanent authorization / revocation failure (HTTP 401 or 403)
    if (httpCode == 401 || httpCode == 403) {
      diagnostics.raise("ERR_AUTH_REVOKED", "CRITICAL", "Device authentication failed or revoked by gateway!");
    }

    enterBackoff("HTTP request failed", diagnostics);
    return false;
  }

  // 4. Parse and validate per-record acknowledgments
  currentState = CloudUploadState::PARSING_RESPONSE;
  std::vector<String> acceptedIds;
  std::vector<String> rejectedIds;

  bool ackOk = validateAcknowledgments(
    responseBody,
    batch,
    acceptedIds,
    rejectedIds,
    diagnostics
  );

  if (!ackOk) {
    diagnostics.raise("ERR_ACK_MALFORMED", "ERROR", "Server response could not be parsed for record acknowledgments");
    enterBackoff("Malformed ACK response", diagnostics);
    return false;
  }

  // 5. Persist acknowledged record IDs to local storage
  size_t ackCount = 0;
  for (const auto& recId : acceptedIds) {
    if (storage.markAcknowledged(recId)) {
      ackCount++;
    }
  }

  // 6. Retain unacknowledged / rejected records with retry increments
  for (const auto& recId : rejectedIds) {
    storage.markFailed(recId, false);
    diagnostics.raise("WARN_RECORD_REJECTED", "WARNING", ("Gateway rejected record: " + recId).c_str());
  }

  totalRecordsUploaded += ackCount;
  lastUploadSuccessTime = millis();

  diagnostics.recordSuccess("BATCH_INGEST", ackCount);
  Serial.printf("[KRUSHI][CLOUD] Ingestion verified: %u accepted, %u retained. Remaining pending: %u\n",
    (unsigned int)acceptedIds.size(),
    (unsigned int)rejectedIds.size(),
    (unsigned int)storage.getPendingCount()
  );

  currentState = CloudUploadState::IDLE;
  return (ackCount > 0);
}

String CloudManager::serializeBatchPayload(const std::vector<TelemetryRecord>& batch) {
  // If batch contains 1 record, send single object matching Gateway schema
  if (batch.size() == 1) {
    const auto& r = batch[0];
    String json = "{";
    json += "\"device_id\":\"" + r.device_id + "\",";
    json += "\"shipment_id\":\"" + r.shipment_id + "\",";
    json += "\"sequence\":" + String(r.sequence) + ",";
    json += "\"timestamp\":\"" + r.captured_at + "\",";
    json += "\"temperature\":" + String(r.temperature_c, 4) + ",";
    json += "\"humidity\":" + String(r.humidity_percent, 4) + ",";
    json += "\"gas_ethylene\":" + String(r.gas_ethylene_ppm, 4) + ",";
    json += "\"latitude\":" + String(r.latitude, 6) + ",";
    json += "\"longitude\":" + String(r.longitude, 6) + ",";
    json += "\"battery\":" + String(r.battery_pct, 2) + ",";
    json += "\"solar_power_mw\":" + String(r.solar_power_mw, 1) + ",";
    json += "\"network_state\":\"online\",";
    json += "\"sync_state\":\"" + String(r.retry_count > 0 ? "burst" : "live") + "\",";
    json += "\"previous_hash\":\"" + r.previous_hash + "\",";
    json += "\"record_hash\":\"" + r.record_hash + "\",";
    json += "\"signature\":\"" + r.signature + "\",";
    json += "\"device_token\":\"" + String(DEVICE_AUTH_TOKEN) + "\"";
    json += "}";
    return json;
  }

  // Multi-record array payload for batch-ingest
  String json = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"device_token\":\"" + String(DEVICE_AUTH_TOKEN) + "\",\"records\":[";
  for (size_t i = 0; i < batch.size(); i++) {
    const auto& r = batch[i];
    json += "{";
    json += "\"record_id\":\"" + r.record_id + "\",";
    json += "\"shipment_id\":\"" + r.shipment_id + "\",";
    json += "\"sequence\":" + String(r.sequence) + ",";
    json += "\"timestamp\":\"" + r.captured_at + "\",";
    json += "\"temperature\":" + String(r.temperature_c, 4) + ",";
    json += "\"humidity\":" + String(r.humidity_percent, 4) + ",";
    json += "\"gas_ethylene\":" + String(r.gas_ethylene_ppm, 4) + ",";
    json += "\"latitude\":" + String(r.latitude, 6) + ",";
    json += "\"longitude\":" + String(r.longitude, 6) + ",";
    json += "\"battery\":" + String(r.battery_pct, 2) + ",";
    json += "\"solar_power_mw\":" + String(r.solar_power_mw, 1) + ",";
    json += "\"previous_hash\":\"" + r.previous_hash + "\",";
    json += "\"record_hash\":\"" + r.record_hash + "\",";
    json += "\"signature\":\"" + r.signature + "\"";
    json += "}";
    if (i + 1 < batch.size()) json += ",";
  }
  json += "]}";
  return json;
}

bool CloudManager::validateAcknowledgments(
  const String& responseJson,
  const std::vector<TelemetryRecord>& sentBatch,
  std::vector<String>& outAcceptedIds,
  std::vector<String>& outRejectedIds,
  Diagnostics& diagnostics
) {
  outAcceptedIds.clear();
  outRejectedIds.clear();

  // Basic sanity validation
  if (responseJson.length() == 0) {
    return false;
  }

  // Check for success status indicators matching KRUSHI API contract:
  // "verified_ingested", "success", or "duplicate_idempotent"
  bool hasSuccessStatus = (
    responseJson.indexOf("\"verified_ingested\"") != -1 ||
    responseJson.indexOf("\"success\"") != -1 ||
    responseJson.indexOf("\"duplicate_idempotent\"") != -1
  );

  if (!hasSuccessStatus) {
    diagnostics.raise("WARN_GATEWAY_REJECT", "WARNING", ("Gateway replied without success flag: " + responseJson).c_str());
    return false;
  }

  // Case 1: Single record response (response confirms single sequence or hash)
  if (sentBatch.size() == 1) {
    const auto& rec = sentBatch[0];
    // Check if sequence matches or hash matches
    String seqStr = String(rec.sequence);
    if (responseJson.indexOf(seqStr) != -1 || responseJson.indexOf(rec.record_hash.substring(0, 16)) != -1) {
      outAcceptedIds.push_back(rec.record_id);
      return true;
    }
  }

  // Case 2: Batch response with accepted IDs array or all-accepted confirmation
  // If response contains "accepted_records" or "verified_count"
  for (const auto& rec : sentBatch) {
    // If specific ID rejected
    if (responseJson.indexOf(rec.record_id) != -1 && responseJson.indexOf("\"rejected\"") != -1) {
      outRejectedIds.push_back(rec.record_id);
    } else {
      outAcceptedIds.push_back(rec.record_id);
    }
  }

  return (!outAcceptedIds.empty());
}

void CloudManager::enterBackoff(const char* reason, Diagnostics& diagnostics) {
  // Exponential backoff with jitter calculation:
  // delay = min(MAX_BACKOFF_MS, currentBackoff * 2) + random(0, JITTER_MAX_MS)
  currentBackoffMs = (unsigned long)(currentBackoffMs * BACKOFF_MULTIPLIER);
  if (currentBackoffMs > MAX_BACKOFF_MS) {
    currentBackoffMs = MAX_BACKOFF_MS;
  }

  unsigned long jitter = random(0, JITTER_MAX_MS);
  unsigned long totalDelay = currentBackoffMs + jitter;
  nextAllowedUploadTime = millis() + totalDelay;

  char logBuf[128];
  snprintf(logBuf, sizeof(logBuf), "Backoff engaged: %lu ms delay (Reason: %s)", totalDelay, reason);
  diagnostics.raise("CLOUD_BACKOFF", "INFO", logBuf);
}

void CloudManager::resetBackoff() {
  currentBackoffMs = INITIAL_BACKOFF_MS;
  nextAllowedUploadTime = 0;
}
