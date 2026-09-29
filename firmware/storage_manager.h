#pragma once
#include <Arduino.h>
#include <vector>

struct TelemetryRecord {
  String record_id;         // Stable format: "device-001:00001234"
  String device_id;         // "AGRITRACE-001"
  String shipment_id;       // UUID or shipment identifier
  uint32_t sequence;        // Monotonic sequence number
  String captured_at;       // ISO 8601 UTC timestamp
  String time_quality;      // "network_synced" | "rtc_internal" | "unsynced"
  float temperature_c;      // Calibrated °C
  float humidity_percent;   // % RH
  float gas_ethylene_ppm;   // ZE03 sensor reading (ppm)
  float battery_pct;        // 0.0 - 100.0%
  float solar_power_mw;     // Solar harvesting rate (mW)
  float latitude;           // GPS lat
  float longitude;          // GPS lon
  String firmware_version;  // e.g. "1.2.0-gov-prod"
  String previous_hash;     // SHA-256 hash of previous record
  String record_hash;       // Canonical SHA-256 digest of this record
  String signature;         // ECDSA SECP256k1 hex signature
  bool is_acknowledged;     // True only after verified cloud server confirmation
  uint8_t retry_count;      // Transmit retry attempts
};

class StorageManager {
public:
  virtual ~StorageManager() = default;

  virtual bool begin() = 0;
  virtual bool saveRecord(const TelemetryRecord& record) = 0;
  virtual size_t getPendingCount() const = 0;
  virtual bool getPendingBatch(std::vector<TelemetryRecord>& outBatch, size_t maxBatchSize) = 0;
  virtual bool markAcknowledged(const String& recordId) = 0;
  virtual bool markFailed(const String& recordId, bool permanent = false) = 0;
  virtual uint32_t getNextSequence() = 0;
  virtual String getLastRecordHash() = 0;
  virtual void commitSequenceAndHash(uint32_t seq, const String& hash) = 0;
};

class InMemoryRingBufferStorage : public StorageManager {
public:
  InMemoryRingBufferStorage(size_t capacity = 100) 
    : maxCapacity(capacity), nextSequence(1), lastHash("GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000") {}

  bool begin() override {
    Serial.printf("[STORAGE] Durable queue initialized (Capacity: %u records)\n", (unsigned int)maxCapacity);
    return true;
  }

  bool saveRecord(const TelemetryRecord& record) override {
    if (records.size() >= maxCapacity) {
      for (auto it = records.begin(); it != records.end(); ++it) {
        if (it->is_acknowledged) {
          records.erase(it);
          break;
        }
      }
      if (records.size() >= maxCapacity) {
        records.erase(records.begin());
      }
    }
    records.push_back(record);
    return true;
  }

  size_t getPendingCount() const override {
    size_t count = 0;
    for (const auto& r : records) {
      if (!r.is_acknowledged) count++;
    }
    return count;
  }

  bool getPendingBatch(std::vector<TelemetryRecord>& outBatch, size_t maxBatchSize) override {
    outBatch.clear();
    for (const auto& r : records) {
      if (!r.is_acknowledged) {
        outBatch.push_back(r);
        if (outBatch.size() >= maxBatchSize) break;
      }
    }
    return !outBatch.empty();
  }

  bool markAcknowledged(const String& recordId) override {
    for (auto& r : records) {
      if (r.record_id == recordId) {
        r.is_acknowledged = true;
        return true;
      }
    }
    return false;
  }

  bool markFailed(const String& recordId, bool permanent) override {
    for (auto& r : records) {
      if (r.record_id == recordId) {
        r.retry_count++;
        if (permanent || r.retry_count > 10) {
          r.is_acknowledged = true;
        }
        return true;
      }
    }
    return false;
  }

  uint32_t getNextSequence() override {
    return nextSequence;
  }

  String getLastRecordHash() override {
    return lastHash;
  }

  void commitSequenceAndHash(uint32_t seq, const String& hash) override {
    nextSequence = seq;
    lastHash = hash;
  }

private:
  size_t maxCapacity;
  uint32_t nextSequence;
  String lastHash;
  std::vector<TelemetryRecord> records;
};
