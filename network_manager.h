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
// KRUSHI Network Manager & Transport Interface
// Provides modem-agnostic cellular / secure HTTPS connectivity abstraction
// ============================================================================

enum class NetworkStatus {
  DISCONNECTED,
  MODEM_INIT,
  SIM_READY,
  CELLULAR_REGISTERED,
  CONNECTED_ONLINE,
  RECONNECTING,
  FAULT
};

class NetworkManager {
public:
  virtual ~NetworkManager() = default;

  virtual bool begin() = 0;
  virtual void update() = 0;
  virtual bool connected() const = 0;
  virtual NetworkStatus getStatus() const = 0;
  virtual int getSignalStrengthDbm() const = 0;
  virtual String getImsi() const = 0;
  
  // Scoped HTTPS POST with TLS certificate validation and device authentication token
  virtual bool sendHttpsPost(
    const char* url,
    const char* jsonPayload,
    const char* deviceToken,
    String& outResponse,
    int& outHttpCode
  ) = 0;

  virtual void triggerReconnect() = 0;
};

// Mock / Standard Transport implementation for development and testing
class SimulatedNetworkTransport : public NetworkManager {
public:
  SimulatedNetworkTransport() : isOnline(true), status(NetworkStatus::CONNECTED_ONLINE) {}

  bool begin() override {
    Serial.println("[NET] 4G Cellular Modem Transport interface initialized.");
    status = NetworkStatus::CONNECTED_ONLINE;
    isOnline = true;
    return true;
  }

  void update() override {}

  bool connected() const override {
    return isOnline;
  }

  NetworkStatus getStatus() const override {
    return status;
  }

  int getSignalStrengthDbm() const override {
    return -75; // -75 dBm nominal 4G LTE signal
  }

  String getImsi() const override {
    return "404450123456789";
  }

  bool sendHttpsPost(
    const char* url,
    const char* jsonPayload,
    const char* deviceToken,
    String& outResponse,
    int& outHttpCode
  ) override {
    (void)deviceToken;
    if (!isOnline) {
      outHttpCode = 0;
      outResponse = "{\"error\": \"Modem offline\"}";
      return false;
    }

    // Default mock response: accepts incoming payload
    outHttpCode = 200;
    outResponse = "{\"status\":\"verified_ingested\",\"message\":\"Batch accepted and verified\",\"accepted_records\":[]}";
    return true;
  }

  void triggerReconnect() override {
    Serial.println("[NET] Reconnecting cellular bearer...");
    status = NetworkStatus::CONNECTED_ONLINE;
    isOnline = true;
  }

  void setOnline(bool online) {
    isOnline = online;
    status = online ? NetworkStatus::CONNECTED_ONLINE : NetworkStatus::DISCONNECTED;
  }

private:
  bool isOnline;
  NetworkStatus status;
};
