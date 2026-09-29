#pragma once
#if defined(ARDUINO) || defined(ESP32)
  #include_next <WiFiClientSecure.h>
#else
  #include "Arduino.h"
  struct WiFiClientSecure {
    void setInsecure() {}
    void setCACert(const char*) {}
  };
  struct WiFiClient {};
#endif
