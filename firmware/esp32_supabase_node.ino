/*
 * AgriTrace ESP32 Edge Node Firmware (SIH26232)
 * Hardware Track: ESP32 + SHT31 / DHT22 + MQ-137 + GPS + LiFePO4
 * Transmits telemetry securely to Supabase via HTTPS REST API
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// 1. Wi-Fi Configuration
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// 2. Supabase Configuration
// Format: https://<project-ref>.supabase.co/rest/v1/esp32_telemetry
const char* SUPABASE_REST_URL = "https://your-project.supabase.co/rest/v1/esp32_telemetry";
const char* SUPABASE_API_KEY  = "YOUR_SUPABASE_ANON_KEY";

// 3. Node Identification & State
const char* DEVICE_ID = "AGRITRACE-001";
const char* SHIPMENT_ID = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c";
unsigned long sequenceCounter = 1;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[AgriTrace] Initializing ESP32 Node...");

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    sendTelemetryToSupabase();
  } else {
    Serial.println("[Offline] WiFi lost! In production, queuing packet to local SPI Flash...");
    // Local queueing logic here (W25Q64 SPI Flash)
  }

  // Sample interval (e.g. every 10 seconds for demo)
  delay(10000);
}

void sendTelemetryToSupabase() {
  HTTPClient http;
  http.begin(SUPABASE_REST_URL);

  // Set HTTP Headers for Supabase PostgREST
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_API_KEY);
  http.addHeader("Prefer", "return=minimal");

  // Read Sensors (simulated or real I2C/ADC readings)
  float temp = 4.2 + ((random(-20, 30)) / 100.0);       // SHT31 sensor
  float hum  = 78.0 + ((random(-10, 10)) / 10.0);       // SHT31 sensor
  float gas  = 13.5 + ((random(-5, 15)) / 10.0);        // MQ-137 / ZE03 sensor
  float batt = 94.5;                                    // ADC battery voltage divider
  float solarMw = 320.0;                                // Photovoltaic sensor
  float lat  = 19.0760 + ((random(-10, 10)) / 10000.0); // GPS / GNSS
  float lon  = 72.9982 + ((random(-10, 10)) / 10000.0); // GPS / GNSS

  // Build JSON Payload
  StaticJsonDocument<512> doc;
  doc["device_id"]      = DEVICE_ID;
  doc["shipment_id"]    = SHIPMENT_ID;
  doc["sequence"]       = sequenceCounter++;
  doc["temperature"]    = temp;
  doc["humidity"]       = hum;
  doc["gas_ethylene"]   = gas;
  doc["latitude"]       = lat;
  doc["longitude"]      = lon;
  doc["battery"]        = batt;
  doc["solar_power_mw"] = solarMw;
  doc["network_state"]  = "online";
  doc["synced_to_local"]= false; // Marked false so local backend picks it up

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println("[AgriTrace] Posting to Supabase: " + requestBody);
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode == 201 || httpResponseCode == 200) {
    Serial.println("[Supabase] Success! Telemetry stored in cloud table.");
  } else {
    Serial.print("[Supabase] Error code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println(response);
  }

  http.end();
}
