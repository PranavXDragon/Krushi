# AgriTrace (SIH26232)
### **Offline-First IoT & Blockchain-Enabled Farm-to-Fork Traceability**
*Smart India Hackathon 2024 / 2026 — Problem Statement 26232*  
*Ministry of Food Processing Industries (MoFPI) | Hardware & Software Track*

---

## 📌 Executive Summary

**AgriTrace** is an end-to-end, rugged, affordable, and offline-first cold-chain traceability platform engineered specifically for agricultural supply chains in India. Standard cold-chain loggers lose connectivity across remote rural routes, creating critical telemetry blind spots. Furthermore, conventional enterprise solutions are prohibitively expensive for smallholder farmers and agricultural SMEs.

AgriTrace solves this by combining:
1. **Low-Cost Rugged IoT Sensor Nodes** with local cryptographic flash storage and solar energy harvesting.
2. **Offline-First Local Queuing & Monotonic Chaining**, ensuring zero data loss during rural transit blind spots.
3. **SHA-256 Hash Chaining & Instant Tamper Detection**, mathematically guaranteeing data integrity from the physical node.
4. **Decentralized Ledger Anchoring (Merkle Trees)**, aggregating sensor batches onto Polygon zkEVM / AgriChain testnet without prohibitive gas costs.
5. **Truck-Centric Multi-Compartment Visualization & Consumer QR Provenance**, providing clear operational views for logistics operators and trustworthy verification for consumers.

---

## 🌟 Key Features

| Capability | Technical Implementation | Value to Supply Chain |
| :--- | :--- | :--- |
| **Offline-First Telemetry** | Local non-volatile circular queue + monotonic sequence counter ($Seq_i = Seq_{i-1} + 1$) | Zero data loss in remote rural areas with intermittent 2G/4G connectivity. |
| **Tamper-Evident Hash Chain** | Canonical JSON + SHA-256 pointer chain ($H_i = \text{SHA256}(\dots, H_{i-1})$) | Prevents driver or database manipulation; detect unauthorized alterations immediately. |
| **Decentralized Ledger Proofs** | Batch Merkle Tree aggregation anchored to smart contracts | Scalable verification with verifiable block numbers and transaction hashes. |
| **Environmental Monitoring** | Temperature, relative humidity, and ethylene gas ($C_2H_4$) | Detects spoilage, chilling injury, and premature fruit ripening in transit. |
| **Physical Compartment Mapping** | Multi-cell truck overlay UI mapping physical reefer zones | Isolates thermal excursions to specific cargo sections (e.g. forward vs. rear compartment). |
| **Consumer QR Provenance** | Instant mobile-friendly GI-tag and cold-chain compliance certificate | Empowers retailers and buyers to verify freshness and farm origin with 1 scan. |
| **Solar Energy Harvesting** | Dynamic battery monitoring + photovoltaic power circuit simulation | Extends autonomous node lifespan across long-haul multi-state transit routes. |

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

    subgraph Backend_Cloud["AgriTrace Backend Platform"]
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
        SMART_CONTRACT["AgriChain Anchor Contract<br/>(Polygon zkEVM / EVM)"]
        MERKLE_ENGINE -->|Anchors Merkle Root| SMART_CONTRACT
    end

    subgraph Frontend_App["AgriTrace Web Dashboard"]
        DASHBOARD["Operations Dashboard & KPI Center"]
        TRUCK_VIEW["Truck-Centric Compartment Overlay"]
        VERIFIER["Cryptographic Chain Explorer"]
        QR_VIEW["Consumer Verification Certificate"]
        
        FASTAPI <-->|WebSocket & REST| Frontend_App
    end
```

---

## 🔐 Cryptographic Specification

### 1. Canonical Serialization
To guarantee cross-platform deterministic hashing, telemetry payloads are formatted with strictly ordered keys, no superfluous whitespace, and fixed floating-point precision:
```json
{"battery":94.5,"device_id":"AGRITRACE-001","gas_ethylene":13.5,"humidity":78.0,"latitude":19.076,"longitude":72.9982,"previous_hash":"0xabc...","sequence":51,"shipment_id":"shp-101","temperature":4.2,"timestamp":"2026-09-29T10:00:00Z"}
```

### 2. Hash Chaining Formula
Every telemetry reading calculates its cryptographic identity recursively:
$$H_i = \text{SHA-256}\Big(\text{Canonical}\big(DeviceID, ShipmentID, Seq_i, Timestamp, T, H, G, Lat, Lon, Batt, H_{i-1}\big)\Big)$$

* Where $H_0 = \text{GENESIS\_ROOT\_000000000000000000000000000000000000000000000000000000000000}$
* If any historical record is maliciously modified in the database, recomputing the chain immediately flags:
  $$\text{SHA-256}(Rec_i) \neq H_i \quad \text{or} \quad H_i \neq PreviousHash_{i+1}$$

### 3. Merkle Tree Ledger Anchoring
Instead of incurring high transaction fees by recording every single raw sensor reading on-chain, AgriTrace batches sequences into a binary Merkle tree:
$$\text{Merkle Root} = \text{Hash}\Big(\dots \text{Hash}\big(\text{Hash}(H_1, H_2), \text{Hash}(H_3, H_4)\big) \dots\Big)$$
The resulting **Merkle Root** is anchored to the smart contract, providing cryptographic proof for the entire shipment with a single immutable transaction.

---

## 📁 Repository Structure

```
SIH232/
├── backend/
│   ├── agritrace.db          # Embedded SQLite database with sample seed data
│   ├── crypto_engine.py      # SHA-256 hash chaining, verification & Merkle tree logic
│   ├── main.py               # FastAPI server, REST routes, WebSocket broadcaster
│   ├── models.py             # SQLAlchemy models (Device, Shipment, Telemetry, Alert, Anchor)
│   ├── seed_data.py          # Real-world Indian agricultural routes & telemetry seed
│   └── simulator.py          # IoT simulator (offline queue, burst sync, tamper injection)
├── frontend/
│   ├── index.html            # Vite HTML entry point
│   ├── package.json          # Node dependencies (React 19, Recharts, Lucide, QRCode)
│   ├── tailwind.config.js    # Tailwind styling config
│   ├── vite.config.ts        # Vite configuration
│   └── src/
│       ├── App.tsx           # Main application shell with WebSocket listener
│       ├── types/            # TypeScript interfaces
│       ├── services/api.ts   # REST client connecting to backend
│       └── components/
│           ├── SimulationBar.tsx      # Quick controls for SIH judge demonstrations
│           ├── MonitoringView.tsx     # Real-time metrics & temperature/humidity charts
│           ├── TruckOverlay.tsx       # Physical reefer compartment visualizer
│           ├── TraceabilityView.tsx   # Blockchain ledger & hash chain explorer
│           ├── DashboardView.tsx      # High-level fleet overview & stats
│           ├── AlertsView.tsx         # Excursion management (acknowledge/resolve)
│           ├── AnalyticsView.tsx      # Cold-chain compliance & quality scorecards
│           ├── ShipmentsView.tsx      # Manifest & route tracking
│           └── ConsumerVerifyView.tsx # Public verification certificate for QR scan
├── docs/
│   └── ARCHITECTURE_AND_EVALUATION_GUIDE.md  # Detailed SIH judging & technical manual
├── PRD_EXTRACTED.md          # Full Product Requirements Document extracted from MoFPI spec
└── README.md                 # Primary project documentation
```

---

## 🚀 Quickstart & Running Locally

### Prerequisites
* **Python 3.10+** (with `pip`)
* **Node.js 18+** (with `npm`)
* **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/PranavXDragon/SIHP2.git
cd SIHP2
```

### 2. Start the Backend API
```bash
cd backend
python -m pip install fastapi uvicorn sqlalchemy pydantic
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

AgriTrace includes an **Interactive Simulation Bar** at the top of the dashboard specifically designed to demonstrate all SIH26232 problem statement criteria live to evaluators:

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
   * Click **`Anchor to Ledger`**. The system compiles current hash records into a **Merkle Tree**, derives the root, and generates an on-chain transaction hash on the AgriChain testnet.
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
