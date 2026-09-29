#pragma once
#include <Arduino.h>

enum class DiagSeverity {
  INFO,
  WARNING,
  ERROR,
  CRITICAL
};

class Diagnostics {
public:
  Diagnostics() : lastLogTime(0), suppressedCount(0) {}

  void begin() {
    Serial.println("[DIAG] Diagnostics subsystem initialized.");
  }

  void raise(const char* code, const char* severity, const char* message) {
    unsigned long now = millis();
    if (strcmp(severity, "CRITICAL") != 0 && (now - lastLogTime < 1000) && lastCode == code) {
      suppressedCount++;
      return;
    }

    lastLogTime = now;
    lastCode = code;

    Serial.printf("[DIAG][%s] Code: %s | Msg: %s", severity, code, message);
    if (suppressedCount > 0) {
      Serial.printf(" (+%lu identical events suppressed)", suppressedCount);
      suppressedCount = 0;
    }
    Serial.println();
  }

  void recordSuccess(const char* operation, size_t count = 1) {
    Serial.printf("[DIAG][INFO] Op '%s' successful (%u units processed)\n", operation, (unsigned int)count);
  }

  void getStatusSummary(String& outSummary) {
    outSummary = "Uptime: " + String(millis() / 1000) + "s | Last Error: " + (lastCode.length() > 0 ? lastCode : "NONE");
  }

private:
  unsigned long lastLogTime;
  unsigned long suppressedCount;
  String lastCode;
};
