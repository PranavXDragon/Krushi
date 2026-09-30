#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

#if defined(ARDUINO) || defined(ESP32)
#include <Arduino.h>
#include <vector>
#else
class String {
  const char* _s;
public:
  String() : _s("") {}
  String(const char* s) : _s(s ? s : "") {}
  const char* c_str() const { return _s; }
  size_t length() const { return strlen(_s); }
  bool operator==(const String& o) const { return strcmp(_s, o._s) == 0; }
  bool operator!=(const String& o) const { return strcmp(_s, o._s) != 0; }
};

template<typename T, size_t Cap = 64>
class VectorShim {
  T items[Cap];
  size_t count = 0;
public:
  void push_back(const T& item) { if (count < Cap) items[count++] = item; }
  size_t size() const { return count; }
  bool empty() const { return count == 0; }
  void clear() { count = 0; }
  T& operator[](size_t idx) { return items[idx]; }
  const T& operator[](size_t idx) const { return items[idx]; }
};
namespace std {
  template<typename T> using vector = VectorShim<T>;
}
#endif


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
