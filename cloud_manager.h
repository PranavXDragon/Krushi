#pragma once
#include <Arduino.h>
#include <vector>

// Forward declarations
class StorageManager;
class NetworkManager;
class Diagnostics;
struct TelemetryRecord;

// ============================================================================
// KRUSHI Cloud Manager — High-Reliability 4G Telematics Ingestion Engine
// Implements bounded batching, per-record acknowledgments, and backoff retries
// ============================================================================

enum class CloudUploadState {
  IDLE,
  CHECK_PENDING,
  AWAIT_NETWORK,
  BUILDING_BATCH,
  TRANSMITTING,
  PARSING_RESPONSE,
  BACKOFF_RETRY
};

class CloudManager {
public:
  CloudManager();

  // Lifecycle initialization
  void begin();

  // Core cyclic update step called from main task loop
  void update(
    StorageManager& storage,
    NetworkManager& network,
    Diagnostics& diagnostics
  );

  // Health and status accessors
  CloudUploadState getState() const { return currentState; }
  unsigned long getLastSuccessfulUploadTime() const { return lastUploadSuccessTime; }
  uint32_t getTotalRecordsUploaded() const { return totalRecordsUploaded; }
  uint32_t getFailedUploadAttempts() const { return failedUploadAttempts; }

private:
  // Upload state machine operations
  bool uploadPendingBatch(
    StorageManager& storage,
    NetworkManager& network,
    Diagnostics& diagnostics
  );

  // Formats JSON payload containing bounded telemetry records and signatures
  String serializeBatchPayload(const std::vector<TelemetryRecord>& batch);

  // Parses server response and extracts per-record acceptance IDs
  bool validateAcknowledgments(
    const String& responseJson,
    const std::vector<TelemetryRecord>& sentBatch,
    std::vector<String>& outAcceptedIds,
    std::vector<String>& outRejectedIds,
    Diagnostics& diagnostics
  );

  // Exponential backoff and retry scheduling
  void enterBackoff(const char* reason, Diagnostics& diagnostics);
  void resetBackoff();

  // State variables
  CloudUploadState currentState;
  unsigned long lastUploadAttemptTime;
  unsigned long lastUploadSuccessTime;
  unsigned long currentBackoffMs;
  unsigned long nextAllowedUploadTime;
  uint32_t totalRecordsUploaded;
  uint32_t failedUploadAttempts;
};
