#pragma once
#if defined(ARDUINO) || defined(ESP32)
#include <Arduino.h>
#elif defined(__cplusplus)
#include <string>
#include <cstdint>
#include <iostream>
#include <cstdio>
using String = std::string;
struct SerialFallback {
  template<typename T> void println(const T& msg) { std::cout << msg << std::endl; }
  void println() { std::cout << std::endl; }
  template<typename... Args> void printf(const char* fmt, Args... args) { ::printf(fmt, args...); }
};
static SerialFallback Serial;
#endif

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
  
  virtual bool sendHttpsPost(
    const char* url,
    const char* jsonPayload,
    const char* deviceToken,
    String& outResponse,
    int& outHttpCode
  ) = 0;

  virtual void triggerReconnect() = 0;
};

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
    return -75;
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
