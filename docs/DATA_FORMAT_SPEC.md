# AgriTrace Data & Output Format Specification
**Standardized Payload, Protocol & Data Exchange Formats**  
*SIH Problem Statement 26232 | Ministry of Food Processing Industries (MoFPI)*

---

## 1. Overview
This document specifies the exact data schemas, output formats, encoding standards, and payload contracts across all layers of the AgriTrace platform:
1. **Edge IoT Node Transmission Format** (MQTT / REST)
2. **Canonical Deterministic Serialization Format** (for SHA-256 Hashing)
3. **Database Schema & Model Representation**
4. **WebSocket Real-Time Event Payloads**
5. **REST API Request & Response Formats**
6. **Merkle Tree & Blockchain Anchor Data Format**
7. **Consumer Provenance QR Code Format**

---

## 2. Edge IoT Node Telemetry Format (Wire Payload)

Sent by the IoT hardware node over MQTT topic `agritrace/nodes/{device_id}/telemetry` or via REST `POST /api/v1/telemetry`:

```json
{
  "device_id": "AGRITRACE-001",
  "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
  "sequence": 51,
  "timestamp": "2026-09-29T10:15:30.000Z",
  "temperature": 4.25,
  "humidity": 78.4,
  "gas_ethylene": 13.8,
  "latitude": 19.0760,
  "longitude": 72.9982,
  "battery": 94.5,
  "solar_power_mw": 320.0,
  "network_state": "online",
  "previous_hash": "b5d63f25c78a0d9e8f12a34bc67de89f0123456789abcdef0123456789abcdef",
  "record_hash": "3a8e91f0d4b2c1e87a9563f412d09e8b7c6a54321fedcba0987654321fedcba0",
  "signature": "0x4f8a1239c0de987654321fedcba0987654321fedcba0987654321fedcba04f8a"
}
```

### Field Definitions

| Field | Type | Unit / Constraints | Description |
| :--- | :--- | :--- | :--- |
| `device_id` | String | `AGRITRACE-XXX` | Unique hardware identifier embedded in MCU secure element |
| `shipment_id` | String | UUID or Slug | Current manifest tracking identifier |
| `sequence` | Integer | Monotonic ($Seq_i = Seq_{i-1} + 1$) | Hardware incremented packet counter |
| `timestamp` | String | ISO 8601 UTC (`YYYY-MM-DDTHH:MM:SS.sssZ`) | GNSS/NTP synchronized time |
| `temperature` | Float | Celsius ($^\circ\text{C}$), precision 0.01 | Sensirion SHT31 sensor reading |
| `humidity` | Float | Relative Humidity (% RH), precision 0.1 | Sensirion SHT31 sensor reading |
| `gas_ethylene` | Float | Parts per Million (ppm), precision 0.1 | Winsen ZE03 electrochemical sensor |
| `latitude` | Float | Decimal degrees ($\pm 90.0000$) | GNSS positioning |
| `longitude` | Float | Decimal degrees ($\pm 180.0000$) | GNSS positioning |
| `battery` | Float | Percentage ($0.0 - 100.0\%$) | LiFePO4 battery capacity remaining |
| `solar_power_mw` | Float | Milliwatts ($\text{mW}$) | Instantaneous photovoltaic harvest rate |
| `network_state` | String | `online` \| `offline` | Cellular connection status at capture time |
| `previous_hash` | String | 64-char Hexadecimal | SHA-256 hash of preceding sequence $i-1$ |
| `record_hash` | String | 64-char Hexadecimal | SHA-256 digest of this canonical payload |
| `signature` | String | Hex string | Device private key digital signature |

---

## 3. Canonical Deterministic Serialization Format

To eliminate ambiguity across different programming languages (Python, C/C++, TypeScript) during cryptographic hashing, payloads are canonicalized using strict rules:
1. **Alphabetical key ordering** (`battery` $\to$ `device_id` $\to \dots \to$ `timestamp`).
2. **No extraneous whitespace** (separators: `','` and `':'`).
3. **Floating-point rounding**: Floats are fixed to 4 decimal places before serialization.

### Example Canonical String:
```
{"battery":94.5,"device_id":"AGRITRACE-001","gas_ethylene":13.8,"humidity":78.4,"latitude":19.076,"longitude":72.9982,"previous_hash":"b5d6...","sequence":51,"shipment_id":"04be...","temperature":4.25,"timestamp":"2026-09-29T10:15:30.000Z"}
```

### Hash Derivation:
$$\text{Record Hash} = \text{SHA256}(\text{Canonical String})$$

---

## 4. WebSocket Real-Time Event Formats

Streaming at `ws://localhost:8000/ws/telemetry`.

### 4.1 New Telemetry Sample Event
```json
{
  "type": "NEW_TELEMETRY",
  "data": {
    "id": 142,
    "device_id": "AGRITRACE-001",
    "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
    "sequence": 52,
    "timestamp": "2026-09-29T10:16:00.000000",
    "temperature": 4.18,
    "humidity": 78.1,
    "gas_ethylene": 13.6,
    "latitude": 19.0762,
    "longitude": 72.9985,
    "battery": 94.5,
    "solar_power_mw": 320.0,
    "network_state": "online",
    "sync_state": "live",
    "record_hash": "9c12...",
    "previous_hash": "3a8e...",
    "signature": "0x4f...",
    "integrity_status": "verified"
  }
}
```

### 4.2 Network State Change Event
```json
{
  "type": "NETWORK_STATE_CHANGED",
  "is_online": false,
  "message": "IoT Node entering offline rural mode. Queuing packets locally."
}
```

### 4.3 Blockchain Anchor Event
```json
{
  "type": "BLOCKCHAIN_ANCHORED",
  "anchor": {
    "id": 4,
    "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
    "batch_code": "AG-2401",
    "merkle_root": "0x8fa12c9b4e3d7a10f65c92841b83d09a7e6b5c4d3e2f1a09b8c7d6e5f4a3b2c1",
    "tx_hash": "0x7f4b821908471209384710293847102938471029384710293847102938471029",
    "block_number": 18920441,
    "network": "Hyperledger Fabric (Channel: agrichannel)",
    "records_count": 50,
    "start_sequence": 1,
    "end_sequence": 50,
    "verification_status": "ANCHORED_VALID"
  }
}
```

---

## 5. REST API Specifications

### 5.1 GET `/api/v1/shipments`
Returns array of active shipments with latest telemetry summary and open alert count:
```json
[
  {
    "id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
    "shipment_code": "SHP-AGRI-04BEACCB",
    "product_name": "GI-Tagged Ratnagiri Alphonso Mangoes",
    "batch_code": "AG-2401",
    "compartment_label": "Compartment A (Main Reefer Chamber)",
    "origin": "Ratnagiri Agri Cooperative, Maharashtra",
    "destination": "JNPT Cold Export Terminal, Navi Mumbai",
    "carrier": "KisanCold Express Logistics",
    "truck_plate": "MH-04-AZ-8892",
    "driver_name": "Rajesh Shinde",
    "driver_phone": "+91 98201 44512",
    "status": "IN_TRANSIT",
    "created_at": "2026-09-28T05:43:24.888842",
    "device_id": "AGRITRACE-001",
    "thresholds": {
      "min_temp": 2.0,
      "max_temp": 8.0,
      "max_humidity": 85.0,
      "max_gas_ethylene": 50.0
    },
    "latest_telemetry": {
      "temperature": 4.14,
      "humidity": 77.7,
      "gas_ethylene": 13.8,
      "battery": 94.5,
      "latitude": 18.9568,
      "longitude": 72.9522,
      "sync_state": "live",
      "integrity_status": "verified",
      "timestamp": "2026-09-29T10:15:00"
    },
    "open_alerts_count": 0
  }
]
```

### 5.2 GET `/api/v1/traceability/verify/{shipment_id}`
Returns complete cryptographic verification report:
```json
{
  "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
  "is_chain_valid": true,
  "records_evaluated": 52,
  "reason": "Chain perfectly intact and verified",
  "latest_anchor": {
    "merkle_root": "0x8fa12c9b4e3d7a...",
    "tx_hash": "0x7f4b8219...",
    "block_number": 18920441,
    "network": "Hyperledger Fabric (Channel: agrichannel)",
    "records_count": 50,
    "anchored_at": "2026-09-29T09:30:00"
  },
  "chain_details": [
    {
      "sequence": 1,
      "recalculated_hash": "3a8e91...",
      "stored_hash": "3a8e91...",
      "previous_hash": "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000",
      "expected_previous": "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000",
      "is_valid": true
    }
  ]
}
```

---

## 6. Consumer Provenance QR Code Data Format

Generated for downstream retailers, export auditors, and consumers:

### 6.1 QR Encoded URI Format
```
https://agritrace.gov.in/verify/04beaccb-7c55-44ab-aa84-2a3f338dcf1c
```

### 6.2 Embedded JSON Payload
```json
{
  "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
  "product": "GI-Tagged Ratnagiri Alphonso Mangoes",
  "batch": "AG-2401",
  "origin": "Ratnagiri Agri Cooperative, Maharashtra",
  "destination": "JNPT Cold Export Terminal, Navi Mumbai",
  "departure_time": "2026-09-28T05:43:24Z",
  "delivery_time": "2026-09-29T14:30:00Z",
  "cold_chain_compliance_score": 99.4,
  "excursions_count": 0,
  "ledger_tx_hash": "0x7f4b821908471209384710293847102938471029384710293847102938471029",
  "blockchain_network": "Hyperledger Fabric (Channel: agrichannel)",
  "merkle_root": "0x8fa12c9b4e3d7a10f65c92841b83d09a7e6b5c4d3e2f1a09b8c7d6e5f4a3b2c1",
  "verification_url": "https://agritrace.gov.in/verify/04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
}
```
