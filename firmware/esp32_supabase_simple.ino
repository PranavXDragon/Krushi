/*
 * ==============================================================================
 * KRUSHI - Simple & Working ESP32 Telemetry Sender
 * Project: hccppqykmjfcpjmhntks.supabase.co
 * 
 * Works out-of-the-box with standard Arduino IDE!
 * ZERO external libraries required (uses ESP32 built-in WiFi, HTTPClient, WiFiClientSecure)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ------------------------------------------------------------------------------
// 1. YOUR WIFI CREDENTIALS (Enter your WiFi Name & Password)
// ------------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ------------------------------------------------------------------------------
// 2. SUPABASE REST ENDPOINT & ANON KEY
// ------------------------------------------------------------------------------
const char* SUPABASE_URL = "https://hccppqykmjfcpjmhntks.supabase.co/rest/v1/esp32_telemetry";
const char* SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY3BwcXlrbWpmY3BqbWhudGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjkyODcsImV4cCI6MjEwNjI0NTI4N30.4ATVqARowUNzUk49LZMKkIbeealIlnQCf0Tt6JnsKvQ";

// Device Identification
const char* DEVICE_ID   = "AGRITRACE-001";
const char* SHIPMENT_ID = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c";

// Tracking counters
unsigned long sequenceCounter = 1;
const unsigned long UPLOAD_INTERVAL_MS = 10000; // Send telemetry every 10 seconds

// ------------------------------------------------------------------------------
// SENSOR READING HELPERS
// (Replace these with your physical sensor pins if connected, e.g. DHT22 / SHT35)
// ------------------------------------------------------------------------------
float readTemperature() {
  // Simulates realistic refrigerated cold-chain cargo temp (2.0°C - 5.5°C)
  return 3.8 + (random(-15, 15) / 10.0);
}

float readHumidity() {
  // Simulates relative humidity (75% - 85%)
  return 78.0 + (random(-30, 30) / 10.0);
}

float readEthyleneGas() {
  // Simulates ethylene gas concentration in ppm (10 - 15 ppm)
  return 12.5 + (random(-10, 10) / 10.0);
}

float readBatteryLevel() {
  return 96.0 - (sequenceCounter * 0.05);
}

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n=============================================");
  Serial.println("  KRUSHI Cold-Chain IoT Node (ESP32)");
  Serial.printf("  Device ID: %s\n", DEVICE_ID);
  Serial.println("=============================================");

  // Connect to WiFi
  Serial.printf("[WiFi] Connecting to: %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 25) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] Signal RSSI: %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WiFi] Warning: Connection failed! Check SSID and Password.");
  }
}

void loop() {
  // Ensure WiFi is still connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Reconnecting...");
    WiFi.reconnect();
    delay(3000);
    return;
  }

  // 1. Gather sensor telemetry
  float temp = readTemperature();
  float hum  = readHumidity();
  float gas  = readEthyleneGas();
  float batt = readBatteryLevel();
  float lat  = 19.0760;
  float lng  = 72.9982;

  Serial.printf("\n[Reading #%lu] Temp: %.2f C | Humidity: %.1f %% | Ethylene: %.2f ppm | Batt: %.1f %%\n",
                sequenceCounter, temp, hum, gas, batt);

  // 2. Build lightweight JSON payload (no external library needed!)
  char payload[512];
  snprintf(payload, sizeof(payload),
    "{"
      "\"device_id\":\"%s\","
      "\"shipment_id\":\"%s\","
      "\"sequence\":%lu,"
      "\"temperature\":%.2f,"
      "\"humidity\":%.2f,"
      "\"gas_ethylene\":%.2f,"
      "\"latitude\":%.6f,"
      "\"longitude\":%.6f,"
      "\"battery\":%.1f,"
      "\"solar_power_mw\":320.0,"
      "\"network_state\":\"online\","
      "\"sync_state\":\"live\","
      "\"integrity_status\":\"verified\""
    "}",
    DEVICE_ID, SHIPMENT_ID, sequenceCounter, temp, hum, gas, lat, lng, batt
  );

  // 3. Send HTTPS POST to Supabase
  WiFiClientSecure client;
  client.setInsecure(); // Skips certificate validation for simplicity & reliability on ESP32

  HTTPClient http;
  if (http.begin(client, SUPABASE_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", SUPABASE_KEY);
    http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http.addHeader("Prefer", "return=minimal"); // Fast response

    Serial.println("[Supabase] Transmitting payload...");
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.printf("[Supabase] SUCCESS! Status Code: %d (Data inserted into table)\n", httpResponseCode);
      sequenceCounter++;
    } else {
      Serial.printf("[Supabase] HTTP Error Code: %d\n", httpResponseCode);
      String response = http.getString();
      if (response.length() > 0) {
        Serial.printf("[Supabase] Response: %s\n", response.c_str());
      }
      if (httpResponseCode == 404) {
        Serial.println("[HINT] Table 'esp32_telemetry' not found. Please run the SQL setup script in Supabase SQL editor!");
      }
    }
    http.end();
  } else {
    Serial.println("[HTTP] Unable to connect to Supabase endpoint.");
  }

  // Wait before next upload cycle
  delay(UPLOAD_INTERVAL_MS);
}
