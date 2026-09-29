#pragma once
#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdio.h>
#include <string.h>

#if defined(ARDUINO) || defined(ESP32)
#include <Arduino.h>
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

struct SerialFallback {
  void print(const char* s) { printf("%s", s); }
  void println(const char* s = "") { printf("%s\n", s); }
  template<typename... Args> void printf(const char* fmt, Args... args) { ::printf(fmt, args...); }
};
static SerialFallback Serial;
#endif

// ============================================================================
// KRUSHI Diagnostics & Health Monitor
// Rate-limited telemetry error tracking and audit event recorder
// ============================================================================

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
    // Rate limit duplicate log floods (minimum 1 second between non-critical logs)
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
