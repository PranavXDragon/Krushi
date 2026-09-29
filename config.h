#pragma once
#include "Arduino.h"

// ============================================================================
// KRUSHI (SIH26232) — Cloud & Edge Telematics Configuration
// Cold-Chain Integrity Platform with Supabase & Polygon Verification
// ============================================================================

#define CLOUD_ENABLED 1

// 1. Ingestion Gateway API & Endpoints
// Points to Krushi Secure Gateway or Supabase Edge Ingestion Function
#define GATEWAY_HOST               "api.agritrace.krushi.gov.in"
#define GATEWAY_PORT               443
#define GATEWAY_SECURE_INGEST_URL  "https://api.agritrace.krushi.gov.in/api/v1/telemetry/secure-ingest"
#define GATEWAY_BATCH_INGEST_URL   "https://api.agritrace.krushi.gov.in/api/v1/telemetry/batch-ingest"
#define GATEWAY_HEARTBEAT_URL      "https://api.agritrace.krushi.gov.in/api/v1/health"

// 2. Cryptographic Device Identity & Authentication
#define DEVICE_ID                  "AGRITRACE-001"
#define DEFAULT_SHIPMENT_ID        "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
#define DEVICE_AUTH_TOKEN          "ktok_live_0192837465abcdef"
#define FIRMWARE_VERSION           "1.2.0-gov-prod"

// 3. Queue & Bounded Batch Constraints
#define MAX_BATCH_SIZE             10       // Max records per single HTTPS burst
#define MAX_OFFLINE_QUEUE_CAPACITY 5000     // Up to ~7 days of 1-minute interval data
#define TELEMETRY_INTERVAL_MS      10000    // 10s live transit sampling interval

// 4. Retry & Exponential Backoff Timing
#define INITIAL_BACKOFF_MS         2000     // 2s initial retry delay
#define MAX_BACKOFF_MS             60000    // 60s max exponential cap
#define BACKOFF_MULTIPLIER         2.0f
#define JITTER_MAX_MS              1500     // Randomization to prevent thundering herd

// 5. Root CA Certificate for TLS Pinning (ISRG Root X1 / Supabase Root)
static const char ROOT_CA_CERTIFICATE[] PROGMEM = 
"-----BEGIN CERTIFICATE-----\n"
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oQ6HgCgmguc596lsR\n"
"zTcomDzrhOzepAxUmmGeKPd445LPjNFZZTCmCkB+bim88VNqPtul37tKEKFVU4Or\n"
"y86hSR3ZOGny8XSXA+QzkCD0VeeTW+29XVmzPQL3/AEag9EG6IBt/1CDz282P21f\n"
"n5QV92bG2JuvZJYFwg4PkjDKqP8WwyznpLURAvmrPce76YmV4kqUqVl37wG4Pf8Y\n"
"UZqlSmLi0mPF3OLQifQ80nYGxhWebi62zPwZuhavgqqEl6tWDXVO/U9Hea88AoZo\n"
"r6Nev97Tpcxzq4dQR8vc++WkoVDjcPVuwkcavEDR2BVgmq2Y2wUvyP58T0gRgWDA\n"
"7a36hO3epPzOV/rAFSw50gow/20BS4bqwgkNPxxWOUEj4a6ydcEQ90wCHG7EiPN\n"
"AOCurYxzFJTAG/1QTbHqtb0631R0KScteurs6GhnRMrwfSkLio099xrotRq0BbG+\n"
"x8md2T092SncEPCYS474SOmkrWMUigPX/8Eb8ASU5xWOQcdQT++4SpfZUX23psVP\n"
"vCovTlSWIbVUyZKksEYCgUxcrM7CWnniKE5tin3JZSEDehYGEYX457xmqGFTzChD\n"
"yLfRhUrhsYsISxWcT0vltQqLCgAAuvdbCmaTV0twtEG5EKTTeD950SDIAF6gWFHR\n"
"AyfcPja5QKPEU03KMbxBi6v7AgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAjGi13Lpm2YTjANBgkq\n"
"hkiG9w0BAQsFAAOCAgEAVR9YqbyhurdtUSUxGtPGsjgYO9047FOHvDCNUUCVCTAr\n"
"cxq01aoGw4tfLLvCRjdsocOXJdHKCh82KLtuNVbGYU0PaDw9gBulletbvEm436NF\n"
"hm0qLNQmkFenzvcOoDZKphG43qVOVC2B+4PXsjPD8CDWjvWxjMt8n7GUP+IgAbkW\n"
"bv9uWVRGHu5vn4Wy520fZxlt4965dWDIGr3IHP89Kyd8u5zogU120bzkTUWDVVVR\n"
"Ag5286Y3YvWGI9ST5ufNuYLPeeTUfcqzgvgMEY6HzAPZs5Ks5CXKYNx42qPBniUC\n"
"27Sg5A1GwmtOh2IE0DYcdMAVCnz164hfN0ENDV/LYguOtq4hNjX8nTukTExbvWgK\n"
"lIBPjMtstFNPVNTZtgMr/y89uwPrKWqtV2G02RP51rPqtpP12HUWFUpTW+xRFI2U\n"
"D8PYgkOIDPMgNW8nVDVZgb876K3rf8gHUz1U69CugkCmYcUCPzfZbAXyMBnw67nu\n"
"CPSCAVNYNBuf4O5WD8RTV8Tz36unGhYAgzVOqmZNVR50nKda3EDTHYzHrQUcVyzP\n"
"Vb4PMrPBkzoC522NXNPgy4VNwElv342CMVeUTSP073nYOMHSCdfRKEKWWcLotIwO\n"
"Px6HSrQU72gFLj928f2wCPR64646cnG88nfl8GSvYNa59gwcTQ8Xl00uTWVD1Si=\n"
"-----END CERTIFICATE-----\n";
