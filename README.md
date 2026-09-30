# KRUSHI — कृषि (SIH26232)
### **Offline-First IoT & Blockchain-Enabled Farm-to-Fork Traceability**
*Smart India Hackathon 2024 / 2026 — Problem Statement 26232*  
*Ministry of Food Processing Industries (MoFPI) | Hardware & Software Track*

---

## 📌 Executive Summary

**KRUSHI (कृषि)** is an end-to-end, rugged, affordable, and offline-first cold-chain traceability platform engineered specifically for agricultural supply chains in India. Standard cold-chain loggers lose connectivity across remote rural routes, creating critical telemetry blind spots. Furthermore, conventional enterprise solutions are prohibitively expensive for smallholder farmers and agricultural SMEs.

KRUSHI solves this by combining:
1. **Low-Cost Rugged IoT Sensor Nodes** with local cryptographic flash storage and solar energy harvesting.
2. **Offline-First Local Queuing & Monotonic Chaining**, ensuring zero data loss during rural transit blind spots.
3. **SHA-256 Hash Chaining & Instant Tamper Detection**, mathematically guaranteeing data integrity from the physical node.
4. **Decentralized Ledger Anchoring (Merkle Trees)**, aggregating sensor batches onto a Hyperledger Fabric permissioned ledger without public gas costs.
5. **Truck-Centric Multi-Compartment Visualization & Consumer QR Provenance**, providing clear operational views for logistics operators and trustworthy verification for consumers.

---

## 🌟 Key Features

| Capability | Technical Implementation | Value to Supply Chain |
| :--- | :--- | :--- |
| **Offline-First Telemetry** | Local non-volatile circular queue + monotonic sequence counter (Seqᵢ = Seqᵢ₋₁ + 1) | Zero data loss in remote rural areas with intermittent 2G/4G connectivity. |
| **Tamper-Evident Hash Chain** | Canonical JSON + SHA-256 pointer chain (Hᵢ = SHA-256(..., Hᵢ₋₁)) | Prevents driver or database manipulation; detect unauthorized alterations immediately. |
| **Decentralized Ledger Proofs** | Batch Merkle Tree aggregation anchored to Hyperledger Fabric chaincode | Scalable verification with verifiable block numbers and transaction hashes. |
| **Environmental Monitoring** | Temperature, relative humidity, and ethylene gas (C₂H₄) | Detects spoilage, chilling injury, and premature fruit ripening in transit. |
| **Physical Compartment Mapping** | Multi-cell truck overlay UI mapping physical reefer zones | Isolates thermal excursions to specific cargo sections (e.g. forward vs. rear compartment). |
| **Consumer QR Provenance** | Instant mobile-friendly GI-tag and cold-chain compliance certificate | Empowers retailers and buyers to verify freshness and farm origin with 1 scan. |
| **Solar Energy Harvesting** | Dynamic battery monitoring + photovoltaic power circuit simulation | Extends autonomous node lifespan across long-haul multi-state transit routes. |

---

## 📸 Application Screenshots & UI Showcase

<p align="center">
  <img src="screenshots/Screenshot%202026-09-30%20135435.png" alt="KRUSHI Live Cold-Chain Reefer Monitoring" width="100%" />
</p>

### 1. Operations & Monitoring Views
| 🚛 Multi-Compartment Reefer Telemetry | 🌾 Kisan & Supply Chain Overview |
| :---: | :---: |
| <img src="screenshots/Screenshot%202026-09-30%20135435.png" alt="Live Cold-Chain Monitoring" width="100%"/> | <img src="screenshots/Screenshot%202026-09-30%20135352.png" alt="Kisan & Supply Chain Dashboard" width="100%"/> |
| *Real-time temperature, humidity, ripening ethylene (C₂H₄) & truck compartment mapping* | *Active transit corridors, GPS coordinates, blindspot sync health, and active fleets* |

### 2. Cryptographic Provenance & Verification
| 🔗 Tamper-Proof Audit & Blockchain Proofs | 📱 Consumer Transparency QR Certificate |
| :---: | :---: |
| <img src="screenshots/Screenshot%202026-09-30%20135450.png" alt="Farm-to-Fork Provenance" width="100%"/> | <img src="screenshots/Screenshot%202026-09-30%20135505.png" alt="Consumer Transparency QR" width="100%"/> |
| *SHA-256 hash chaining, Merkle tree root rollup, and Hyperledger Fabric chaincode anchor* | *Instant smartphone QR scan for GI-tag compliance and farm-to-fork origin certificate* |

### 3. Excursions & Analytics
| 🚨 Real-Time Spoilage & Excursion Alerts | 📊 Freshness & Quality Compliance Analytics |
| :---: | :---: |
| <img src="screenshots/Screenshot%202026-09-30%20135543.png" alt="Safety & Spoilage Alerts" width="100%"/> | <img src="screenshots/Screenshot%202026-09-30%20135607.png" alt="Freshness & Quality Analytics" width="100%"/> |
| *Critical temperature excursion spikes, ethylene gas alerts, and offline heartbeat tracking* | *Transit compliance scorecards, shipment distribution, and delivery performance metrics* |

---


## 🏛 System Architecture

```mermaid
graph TD
    subgraph IoT_Hardware_Node["IoT Hardware Node (Edge)"]
        SENSORS["Environmental Sensors<br/>(Temp, Humidity, Ethylene Gas, GPS)"]
        MCU["Low-Cost MCU (ESP32 / STM32)<br/>Crypto Core + Power Mgmt"]
        FLASH["Local Cryptographic Flash<br/>Monotonic Sequence Queue"]
        SOLAR["Solar PV Harvester + LiFePO4 Battery"]
        
        SENSORS --> MCU
        MCU --> FLASH
        SOLAR --> MCU
    end

    subgraph Connectivity_Layer["Sync & Messaging Layer"]
        NET_DETECT{"Cellular / Network<br/>Available?"}
        MCU --> NET_DETECT
        NET_DETECT -- No --> FLASH
        NET_DETECT -- Yes (Online) --> MQTT["MQTT / HTTPS Burst Sync<br/>Idempotent Ingestion"]
        FLASH -. Bulk Replay .-> MQTT
    end

    subgraph Backend_Cloud["KRUSHI Backend Platform"]
        FASTAPI["FastAPI REST & WebSocket Server"]
        SQLITE["Relational Telemetry DB (SQLite/PostgreSQL)"]
        CRYPTO_SERVICE["Crypto Engine & Hash Chain Verifier"]
        MERKLE_ENGINE["Merkle Tree Batch Rollup Engine"]
        
        MQTT --> FASTAPI
        FASTAPI --> SQLITE
        FASTAPI --> CRYPTO_SERVICE
        FASTAPI --> MERKLE_ENGINE
    end

    subgraph Blockchain_Layer["Decentralized Ledger"]
        SMART_CONTRACT["KRUSHI Chaincode<br/>(Hyperledger Fabric)"]
        MERKLE_ENGINE -->|Anchors Merkle Root| SMART_CONTRACT
    end

    subgraph Frontend_App["KRUSHI Web Dashboard"]
        DASHBOARD["Operations Dashboard & KPI Center"]
        TRUCK_VIEW["Truck-Centric Compartment Overlay"]
        VERIFIER["Cryptographic Chain Explorer"]
        QR_VIEW["Consumer Verification Certificate"]
        
        FASTAPI <-->|WebSocket & REST| DASHBOARD
        FASTAPI <-->|WebSocket & REST| TRUCK_VIEW
        FASTAPI <-->|WebSocket & REST| VERIFIER
        FASTAPI <-->|WebSocket & REST| QR_VIEW
    end
```

---

## 🔐 Cryptographic Specification

### 1. Canonical Serialization
To guarantee cross-platform deterministic hashing, telemetry payloads are formatted with strictly ordered keys, no superfluous whitespace, and fixed floating-point precision:
```json
{
  "battery": 94.5,
  "device_id": "KRUSHI-NODE-001",
  "gas_ethylene": 13.5,
  "humidity": 78.0,
  "latitude": 19.076,
  "longitude": 72.9982,
  "previous_hash": "0xabc...",
  "sequence": 51,
  "shipment_id": "shp-101",
  "temperature": 4.2,
  "timestamp": "2026-09-29T10:00:00Z"
}
```

### 2. Hash Chaining Formula
Every telemetry reading calculates its cryptographic identity recursively:

```
Hᵢ = SHA-256( Canonical(
    DeviceID, ShipmentID, Seqᵢ, Timestamp,
    Temp, Humidity, Gas, Lat, Lon, Battery, Hᵢ₋₁
) )
```

* **Genesis**: `H₀ = GENESIS_ROOT_0000000000000000000000000000000000000000000000000000`
* **Tamper Detection**: If any historical record is maliciously modified in the database, recomputing the chain immediately flags:
  ```
  SHA-256(Recᵢ) ≠ Hᵢ   OR   Hᵢ ≠ PreviousHash(i+1)
  ```

### 3. Merkle Tree Ledger Anchoring
Instead of recording every single raw sensor reading on-chain, KRUSHI batches sequences into a binary Merkle tree:

```
                 [Merkle Root]  ← Anchored on Hyperledger Fabric
                  /          \
          [Hash(1,2)]    [Hash(3,4)]
           /      \        /      \
        [H₁]    [H₂]   [H₃]    [H₄]
```
The resulting **Merkle Root** is anchored to the Hyperledger Fabric chaincode, providing cryptographic proof for the entire shipment with a single immutable transaction.

---

## 📁 Repository Structure

```
SIH232/
├── backend/
│   ├── crypto_engine.py      # SHA-256 hash chaining, ECDSA verification & Merkle tree logic
│   ├── main.py               # FastAPI server, 30+ REST routes, WebSocket broadcaster
│   ├── models.py             # SQLAlchemy models (Device, Shipment, Telemetry, Alert, LedgerAnchor)
│   ├── seed_data.py          # Real-world Indian agricultural routes & telemetry seed
│   ├── simulator.py          # IoT simulator (offline queue, burst sync, tamper injection)
│   └── supabase_sync.py      # Cloud sync to Supabase PostgreSQL
├── blockchain/
│   ├── chaincode/
│   │   └── agritrace_anchor.go  # Hyperledger Fabric chaincode (Go)
│   ├── security/
│   │   ├── supabase_hardened_rls.sql  # Row-Level Security policies
│   │   └── supabase_setup_quickstart.sql
│   └── README.md             # Fabric consortium topology & endorsement policy
├── iot-device/
│   ├── KRUSHI_ESP32_SINGLE.ino  # Primary ESP32 production firmware
│   ├── config.h              # Hardware configuration & TLS certificates
│   ├── cloud_manager.h/.cpp  # HTTPS transmission & retry logic
│   ├── network_manager.h     # WiFi/4G LTE connectivity management
│   ├── storage_manager.h     # Non-volatile flash queue (offline-first)
│   └── diagnostics.h         # System health & battery monitoring
├── frontend/
│   └── src/
│       ├── App.tsx           # Main application shell with WebSocket listener
│       ├── services/api.ts   # REST/WebSocket client
│       ├── types/index.ts    # TypeScript interfaces
│       └── components/       # 14 modular view components
│           ├── DashboardView/     # Fleet overview, KPIs & simulation controls
│           ├── MonitoringView/    # Real-time sensor charts
│           ├── TruckOverlay/      # Reefer compartment visualizer
│           ├── TraceabilityView/  # Blockchain ledger & hash chain explorer
│           ├── ConsumerVerifyView/ # Public QR verification certificate
│           ├── AlertsView/        # Excursion management
│           ├── AnalyticsView/     # Compliance scorecards
│           ├── ShipmentsView/     # Manifest & route tracking
│           └── ...                # + Navbar, Sidebar, AuthModal, etc.
├── docs/                     # Architecture guide, security roadmap, specs
├── tests/                    # Automated pytest suite (17 tests)
├── scripts/                  # Utility scripts (reset, upload)
├── screenshots/              # Dashboard & UI captures
└── README.md
```

---

## 🚀 Quickstart & Running Locally

### Prerequisites
* **Python 3.10+** (with `pip`)
* **Node.js 18+** (with `npm`)
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/PranavXDragon/Krushi.git
cd Krushi
```

### 2. Start the Backend API
```bash
cd backend
python -m pip install fastapi uvicorn sqlalchemy pydantic python-multipart ecdsa supabase
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API: `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger): `http://127.0.0.1:8000/docs`
* WebSocket Telemetry Stream: `ws://localhost:8000/ws/telemetry`

### 3. Start the Frontend Dashboard
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
* Dashboard URL: `http://localhost:5173/`

---

## 🧪 SIH Presentation & Demonstration Guide

KRUSHI includes an **Interactive Simulation Bar** at the top of the dashboard specifically designed to demonstrate all SIH26232 problem statement criteria live to evaluators:

1. **Simulate Offline Rural Transit**:
   * Click **`Go Offline`** in the simulation bar. The node switches to `Disconnected (Queueing)`.
   * Click **`Tick +1 Sample`** multiple times. Notice samples increment their monotonic sequence numbers and are stored safely in the local hardware queue.
2. **Simulate Network Reconnection & Burst Sync**:
   * Click **`Go Online`**.
   * Click **`MQTT Burst Sync`**. All queued records are ingested in an idempotent burst, updating the dashboard instantly without any lost readings.
3. **Simulate Cold-Chain Excursions**:
   * Click **`Inject Temp Spike (33.5°C)`** or **`Inject Gas Spike (64.8 ppm)`**.
   * An instant **CRITICAL** alert is generated, the truck overlay flags the affected compartment in red, and the excursion event is logged to the timeline.
4. **Demonstrate Cryptographic Tamper Detection**:
   * Click **`Corrupt Hash (Tamper)`**. This maliciously modifies a stored database hash to prove integrity detection.
   * Navigate to the **Traceability** tab and click **`Audit Proof Chain`**. The system immediately catches the cryptographic fault, pinpointing the exact corrupted block sequence and showing `Integrity Mismatch`.
5. **Decentralized Ledger Anchoring**:
   * Click **`Anchor to Ledger`**. The system compiles current hash records into a **Merkle Tree**, derives the root, and generates an on-chain transaction anchor on the Hyperledger Fabric ledger (`agrichannel`).
6. **Consumer QR Provenance**:
   * In the **Traceability** tab, click **`Generate Consumer QR`** to view the live transparency certificate with GI-tag details and immutable handover proof.

---

## 👥 Problem Statement Details
* **Problem Statement ID**: SIH26232
* **Ministry**: Ministry of Food Processing Industries (MoFPI)
* **Theme**: Agriculture, FoodTech & Rural Development
* **Hardware Category**: Rugged IoT Node & Cold-Chain Farm-to-Fork Platform

---

## 📜 License
Developed for Smart India Hackathon. Released under the MIT License.
