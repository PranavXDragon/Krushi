#pragma once
#if defined(ARDUINO) || defined(ESP32)
  #include_next <WiFi.h>
#else
  #include "Arduino.h"
#endif
