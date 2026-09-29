#pragma once
#include <Arduino.h>
#include <vector>

class StorageManager;
class NetworkManager;
class Diagnostics;
struct TelemetryRecord;

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

  void begin();

  void update(
    StorageManager& storage,
    NetworkManager& network,
    Diagnostics& diagnostics
  );

  CloudUploadState getState() const { return currentState; }
  unsigned long getLastSuccessfulUploadTime() const { return lastUploadSuccessTime; }
  uint32_t getTotalRecordsUploaded() const { return totalRecordsUploaded; }
  uint32_t getFailedUploadAttempts() const { return failedUploadAttempts; }

private:
  bool uploadPendingBatch(
    StorageManager& storage,
    NetworkManager& network,
    Diagnostics& diagnostics
  );

  String serializeBatchPayload(const std::vector<TelemetryRecord>& batch);

  bool validateAcknowledgments(
    const String& responseJson,
    const std::vector<TelemetryRecord>& sentBatch,
    std::vector<String>& outAcceptedIds,
    std::vector<String>& outRejectedIds,
    Diagnostics& diagnostics
  );

  void enterBackoff(const char* reason, Diagnostics& diagnostics);
  void resetBackoff();

  CloudUploadState currentState;
  unsigned long lastUploadAttemptTime;
  unsigned long lastUploadSuccessTime;
  unsigned long currentBackoffMs;
  unsigned long nextAllowedUploadTime;
  uint32_t totalRecordsUploaded;
  uint32_t failedUploadAttempts;
};
