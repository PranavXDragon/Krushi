#pragma once
#if defined(ARDUINO) || defined(ESP32)
  #include_next <ArduinoJson.h>
#else
  #include <string>
  struct JsonDocument {
    template<typename T> void operator[](const char*) {}
  };
  template<size_t N> struct StaticJsonDocument : public JsonDocument {};
  template<typename Doc> inline size_t serializeJson(const Doc&, std::string&) { return 0; }
#endif
