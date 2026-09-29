#pragma once
#if defined(ARDUINO) || defined(ESP32)
  #include_next <HTTPClient.h>
#else
  #include "Arduino.h"
  #include "WiFiClientSecure.h"
  struct HTTPClient {
    bool begin(WiFiClientSecure&, const char*) { return true; }
    bool begin(WiFiClient&, const char*) { return true; }
    bool begin(const char*) { return true; }
    void addHeader(const char*, const char*) {}
    void addHeader(const char*, const String&) {}
    int POST(const char*) { return 201; }
    int POST(const String&) { return 201; }
    int GET() { return 200; }
    String getString() { return "{\"status\":\"ok\"}"; }
    void end() {}
  };
#endif
