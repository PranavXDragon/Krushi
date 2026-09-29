# AgriTrace Project Implementation Plan
**Smart India Hackathon 2024 / 2026 — Problem Statement 26232**  
*Ministry of Food Processing Industries (MoFPI) | Hardware & Software Track*

---

## 1. Project Charter & Objectives

### 1.1 Objective
Deliver an affordable (< ₹3,500 BOM), rugged, offline-first IoT sensing and blockchain-enabled farm-to-fork traceability platform that eliminates cold-chain telemetry blind spots, mathematically guarantees data integrity via cryptographic hash chaining, and provides instant provenance verification for agricultural SMEs.

### 1.2 Success Criteria
1. **Zero Data Loss**: 100% telemetry continuity across simulated and real 12-hour connectivity outages using edge flash buffering.
2. **Instant Tamper Detection**: Recomputed SHA-256 hash chains detect any bit-level tampering in database records within < 50ms.
3. **Decentralized Anchoring**: 100% of telemetry batches roll up into verifiable Merkle roots anchored to smart contracts with valid transaction hashes.
4. **Intuitive Operational Dashboard**: Multi-compartment truck visualization, real-time alert dispatch, and consumer QR generation.

---

## 2. Work Breakdown Structure (WBS) & Phased Roadmap

```
+---------------------------------------------------------------------------------------------------------+
|                                    AgriTrace Implementation Roadmap                                     |
+---------------------------------------------------------------------------------------------------------+
  Phase 1: Requirements, System Architecture & Data Standards           [Weeks 1-2]  --> COMPLETED
  Phase 2: Low-Cost Edge Node Hardware & Firmware Simulator Engine      [Weeks 3-4]  --> COMPLETED
  Phase 3: Cryptographic Integrity Engine & Merkle Batch Anchoring       [Weeks 5-6]  --> COMPLETED
  Phase 4: Real-time Telemetry Service, WebSockets & REST APIs           [Weeks 7-8]  --> COMPLETED
  Phase 5: Operations Dashboard, Truck Overlay & Consumer QR View        [Weeks 9-10] --> COMPLETED
  Phase 6: SIH Jury Demonstration Tooling, Testing & Evaluation Defense  [Weeks 11-12]--> COMPLETED / ONGOING
```

---

### Phase 1: Requirements, System Architecture & Data Standards
* **Task 1.1**: Analyze MoFPI Problem Statement 26232 and establish operational constraints.
* **Task 1.2**: Define standard data formats, canonical JSON rules, and MQTT topic architecture (`docs/DATA_FORMAT_SPEC.md`).
* **Task 1.3**: Select low-cost hardware components (ESP32, SHT31, Winsen ethylene gas sensor, SIM7600 4G/GNSS, LiFePO4 cells).

### Phase 2: Edge Firmware & IoT Simulator Engine
* **Task 2.1**: Implement local non-volatile circular queue for offline data persistence.
* **Task 2.2**: Implement strict monotonic sequence counter ($Seq_i = Seq_{i-1} + 1$).
* **Task 2.3**: Build interactive IoT Simulator with realistic GPS routes (Ratnagiri to JNPT, Nashik to Vashi), battery discharge curves, and photovoltaic solar harvesting.
* **Task 2.4**: Add simulation triggers for cellular disconnect, reconnection burst sync, temperature excursions, and gas spikes.

### Phase 3: Cryptographic Integrity Engine & Merkle Batch Anchoring
* **Task 3.1**: Implement canonical JSON serializer with sorted keys and normalized floating-point numbers.
* **Task 3.2**: Develop recursive SHA-256 hash chaining engine ($H_i = \text{SHA256}(\dots, H_{i-1})$).
* **Task 3.3**: Develop fast audit verification algorithm that identifies broken chain links and sequence anomalies.
* **Task 3.4**: Implement binary Merkle Tree builder and automated transaction generation for Polygon zkEVM / AgriChain testnet.

### Phase 4: Backend Telemetry Service & Real-Time Streaming
* **Task 4.1**: Build FastAPI backend with SQLAlchemy relational models (`Device`, `Shipment`, `TelemetryRecord`, `Alert`, `LedgerAnchor`).
* **Task 4.2**: Implement real-time WebSocket broadcaster (`/ws/telemetry`) pushing live data to connected dashboards.
* **Task 4.3**: Implement idempotent MQTT/REST burst ingestion handling offline packet replay.
* **Task 4.4**: Implement dynamic threshold evaluation and automatic alert generation (High Temp, Ethylene Spike, Low Battery).

### Phase 5: Operations Dashboard & Visualization UI
* **Task 5.1**: Build responsive frontend using React 19, TypeScript, and Tailwind CSS.
* **Task 5.2**: Develop **Truck-Centric Compartment Overlay** showing physical sensor placements and compartment conditions.
* **Task 5.3**: Build **Traceability & Chain Explorer** allowing users to inspect individual hash blocks, Merkle roots, and blockchain transactions.
* **Task 5.4**: Create **Consumer Provenance Portal** with dynamic QR code generation for end-user mobile verification.

### Phase 6: Testing, SIH Demonstration & Evaluation Defense
* **Task 6.1**: Implement interactive **Simulation Control Bar** for live judge demonstrations.
* **Task 6.2**: Add malicious hash corruption trigger to demonstrate live cryptographic tamper detection.
* **Task 6.3**: Formulate comprehensive **Architecture & Evaluation Guide** (`docs/ARCHITECTURE_AND_EVALUATION_GUIDE.md`).
* **Task 6.4**: Connect repository to GitHub for automated version control and delivery.

---

## 3. Risk Assessment & Mitigation Plan

| Risk | Severity | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **High cellular data costs in rural areas** | Medium | High | Compress payloads, transmit in compact binary/JSON bursts, and reduce sampling frequency during stable periods. |
| **Blockchain transaction fee volatility** | High | High | Use Merkle Tree aggregation (Rollup model). Only anchor the Merkle root on-chain periodically (e.g. every 50 records or upon delivery). |
| **Tampering with sensor hardware** | High | Low | Enclose hardware in IP67 tamper-evident casing with physical intrusion micro-switch that triggers an immediate tamper flag in the next payload. |
| **Premature battery failure during multi-day transit** | Medium | Medium | Utilize 3.2V LiFePO4 cells with deep sleep MCU cycles (~15µA) coupled with rooftop solar photovoltaic trickle charging. |
| **Driver disputes over cooling fault blame** | Medium | Low | Compartment-specific sensing isolates whether the thermal excursion occurred in the entire truck or a specific compartment. |

---

## 4. Hardware & Prototype Resource Allocation

| Resource | Quantity | Purpose | Status |
| :--- | :--- | :--- | :--- |
| **ESP32 Dev Boards** | 2 | Primary MCU firmware prototyping | Ready / Simulated |
| **SHT31 Temp/Humidity Sensors** | 2 | Cold chain environment monitoring | Ready / Simulated |
| **Winsen ZE03 Ethylene Sensor** | 1 | Spoilage & ripening gas monitoring | Ready / Simulated |
| **SIM7600E 4G LTE/GPS Module** | 1 | Telemetry transmission & geo-location | Ready / Simulated |
| **Solar Panel (5V 2W) + CN3065** | 1 | Photovoltaic energy harvesting test | Ready / Simulated |
| **Local SQLite & Cloud Postgres** | 1 | Telemetry database | Configured |
| **Polygon zkEVM Testnet RPC** | 1 | Decentralized ledger anchor verification | Configured |

---

## 5. Verification & Acceptance Criteria
* [x] **Monotonic Sequence Enforcement**: System rejects or flags any skipped sequence counters.
* [x] **Offline Data Recovery**: 100% of packets generated during network blackout are successfully delivered upon reconnect.
* [x] **Tamper Evidence**: Manually modifying a single character in the telemetry database invalidates the chain and flags the record during audit.
* [x] **Sub-second Response Times**: Dashboard charts and truck overlays render updates in $< 200\text{ms}$.
* [x] **Public Verification**: Consumer QR code resolves to a verifiable provenance certificate displaying GI-tag and cold-chain compliance.
