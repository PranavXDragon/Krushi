# AgriTrace System Requirements Specification (SRS)
**Software & Hardware Requirements Baseline**  
*SIH Problem Statement 26232 | Ministry of Food Processing Industries (MoFPI)*

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software and hardware requirements for **AgriTrace**, an offline-first IoT sensing and blockchain-enabled farm-to-fork traceability platform engineered for agricultural cold-chains in India.

### 1.2 Scope
The system encompasses:
- An ultra-low-cost, rugged IoT edge sensing node.
- Edge firmware capable of local non-volatile queuing, monotonic sequencing, and canonical cryptographic hashing.
- Cloud/server ingestion supporting MQTT burst transmission and idempotent processing.
- A cryptographic verification engine for SHA-256 hash chains and Merkle tree rollups.
- An interactive web application featuring real-time monitoring, multi-compartment truck visualization, and consumer QR verification.

---

## 2. Functional Requirements (FR)

### Module 1: Edge Sensing & Local Persistence
* **FR-01: Multi-Parameter Sensing**  
  The edge node shall sample ambient temperature (range: $-20^\circ\text{C}$ to $+60^\circ\text{C}$, accuracy $\pm 0.3^\circ\text{C}$), relative humidity ($0-100\% \text{ RH}$), and ethylene gas ($0-100\text{ ppm}$) at configurable sampling intervals (default: 60s).
* **FR-02: Offline Queue Persistence**  
  When cellular connectivity is unavailable, the node shall write telemetry records to non-volatile SPI flash memory. The queue must accommodate a minimum of 50,000 records without overwriting un-synced data.
* **FR-03: Monotonic Sequence Numbering**  
  Every telemetry record shall be assigned a strictly increasing integer sequence number ($Seq_i = Seq_{i-1} + 1$). The sequence counter shall persist across device reboots.
* **FR-04: Energy Harvesting & Battery Management**  
  The system shall monitor battery voltage and solar harvesting power ($\text{mW}$). When solar power is detected, the battery shall charge via MPPT/trickle circuitry.

### Module 2: Cryptographic Hash Chaining & Proofs
* **FR-05: Canonical Serialization**  
  The node and backend shall serialize telemetry payloads into a deterministic JSON string with alphabetically sorted keys and standard floating-point precision before hashing.
* **FR-06: Recursive SHA-256 Hash Chaining**  
  Each record $i$ shall calculate $H_i = \text{SHA256}(\text{Canonical}(Payload_i, H_{i-1}))$. The initial record shall use a standardized genesis root.
* **FR-07: Tamper Detection & Audit**  
  The backend verification service shall recompute hashes sequentially. Any discrepancy between recomputed hash and stored hash, or broken predecessor pointers, shall be flagged as an integrity failure.
* **FR-08: Merkle Tree Ledger Anchoring**  
  The backend shall batch $N$ consecutive record hashes into a binary Merkle tree, derive the Merkle root, and publish the root to a chaincode on the blockchain (Hyperledger Fabric permissioned ledger) with an immutable transaction ID.

### Module 3: Communications & Ingestion
* **FR-09: Idempotent Burst Synchronization**  
  Upon cellular reacquisition, the node shall transmit queued records in a burst via MQTT/HTTPS. The server must handle duplicate transmissions idempotently using the tuple `(device_id, sequence)`.
* **FR-10: Real-Time Event Dispatch**  
  The backend shall broadcast newly ingested records, network state changes, and blockchain anchors to connected clients via WebSockets (`/ws/telemetry`) with latency $< 200\text{ms}$.

### Module 4: Operations & Consumer Experience
* **FR-11: Truck Compartment Overlay**  
  The dashboard shall display a physical visual layout of the cargo vehicle, associating specific sensor streams and threshold alarms with designated compartments (e.g., Compartment A vs. Compartment B).
* **FR-12: Consumer Provenance QR Verification**  
  The platform shall generate verifiable QR codes linking to a public provenance page displaying origin farm details, GI-tag credentials, transit duration, cold-chain compliance score, and ledger transaction hash.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Performance & Latency
* **NFR-01 (Sample Frequency)**: Edge node shall support sampling intervals between 10 seconds and 15 minutes.
* **NFR-02 (Ingestion Throughput)**: Backend shall process a burst of 1,000 queued records in $< 3.0$ seconds.
* **NFR-03 (Audit Verification Speed)**: Cryptographic verification of 10,000 chained records shall execute in $< 500\text{ms}$.

### 3.2 Reliability & Fault Tolerance
* **NFR-04 (Zero Data Loss)**: No records shall be dropped during network transitions from offline to online.
* **NFR-05 (Flash Endurance)**: Edge SPI flash memory shall endure at least 100,000 write/erase cycles.

### 3.3 Security & Integrity
* **NFR-06 (Collision Resistance)**: All hash pointers must use standard SHA-256 cryptographic digests.
* **NFR-07 (Transport Security)**: All remote client-server communications shall use TLS 1.3 / WSS.

### 3.4 Hardware Cost & Environmental Ruggedness
* **NFR-08 (Target BOM)**: Production hardware BOM shall not exceed ₹3,500 ($42 USD) to facilitate smallholder SME adoption.
* **NFR-09 (Ingress Protection)**: Node enclosure shall comply with IP67 water and dust ingress standards.
