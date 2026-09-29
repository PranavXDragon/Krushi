#pragma once
/**
 * KRUSHI - IDE IntelliSense & Arduino Compatibility Shim
 * Prevents desktop clang / editor IntelliSense red squiggles and errors
 * When compiled inside Arduino IDE / PlatformIO, the real Arduino core is used.
 */

#if defined(ARDUINO) || defined(ESP32)
  #include_next <Arduino.h>
#else
  #include <string>
  #include <iostream>
  #include <cstdint>
  #include <cstdio>
  #include <cstdlib>

  typedef std::string String;
  typedef uint8_t byte;

  struct SerialShim {
    template<typename T> void print(const T& val) { std::cout << val; }
    template<typename T> void println(const T& val) { std::cout << val << std::endl; }
    void println() { std::cout << std::endl; }
    template<typename... Args> void printf(const char* fmt, Args... args) { ::printf(fmt, args...); }
    void begin(unsigned long) {}
  };
  static SerialShim Serial;

  inline void delay(unsigned long) {}
  inline unsigned long millis() { return 0; }
  inline long random(long min, long max) { return min; }

  #define WL_CONNECTED 3
  #define WIFI_STA 1
  struct WiFiShim {
    int status() { return WL_CONNECTED; }
    void mode(int) {}
    void begin(const char*, const char*) {}
    void reconnect() {}
    int RSSI() { return -65; }
    struct IPShim { 
      String toString() const { return "192.168.1.100"; } 
    };
    IPShim localIP() const { return IPShim(); }
  };
  static WiFiShim WiFi;
#endif
