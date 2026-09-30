# KRUSHI — Security & Implementation Roadmap
**SIH Problem Statement 26232: Offline-First IoT & Blockchain-Enabled Cold-Chain Traceability**

---

## 1. System Vision & Objective
Build a tamper-proof agricultural cold-chain monitoring system that:
1. Collects sensor readings on edge devices (ESP32 with temperature, humidity, gas, GPS).
2. Cryptographically signs readings at origin and enforces monotonic sequencing.
3. Ingests telemetry via an authenticated gateway with deduplication and replay protection.
4. Maintains an immutable hash chain ($H_i = \text{SHA-256}(\text{CanonicalData}_i \parallel H_{i-1})$).
5. Batches verified records into Merkle trees and anchors the root state to **Hyperledger Fabric** (`agrichannel`).
6. Exposes real-time dashboards and verifiable consumer provenance QR portals.

---

## 2. Seven Vulnerabilities Gap Analysis & Remediation Matrix

| # | Vulnerability / Gap | Current Code State | Target Production Fix | Priority | Target Phase |
|---|---------------------|--------------------|------------------------|----------|--------------|
| **01** | **ESP32 Data & Device Identity** | `esp32_supabase_node.ino` sends plain JSON without digital signature; `crypto_engine.py` uses simulated string HMAC. | ECDSA (secp256k1 / Ed25519) signing on ESP32, persistent private key in secure element (ATECC608A / NVS), backend signature verification before accepting record, TLS certificate pinning. | **P0 (Critical)** | **Phase 1** |
| **02** | **Supabase Security & RLS** | Guide specifies `WITH CHECK (true)` anon insert; firmware holds Supabase credentials directly. | Disable anon write to raw tables; implement trusted Ingestion API (FastAPI / Supabase Edge Functions), device JWT/HMAC token authentication, device revocation lists, server-side secret keys. | **P0 (Critical)** | **Phase 1** |
| **03** | **Telemetry Pipeline Reliability** | Memory-only sequence counter in firmware; sequence gaps not explicitly tracked in DB. | Flash-backed ring buffer (SPIFFS / LittleFS / W25Q64), sequence gap detector table (`sequence_gaps`), record lifecycle states (`received` -> `verified` -> `anchored`), idempotent ingestion. | **P0 (Critical)** | **Phase 2** |
| **04** | **Sensor & Alarm Validation** | Firmware simulates readings or uses generic MQ-137 without calibrated ppm transfer function. | Calibrated SHT31/SHT35 (condensation immune), electrochemical ethylene sensor (ZE03-C2H4 / Membrapor), crop-specific threshold profiles (Mangoes, Apples, Berries) with hysteresis and excursion alert recovery. | **P1 (High)** | **Phase 2** |
| **05** | **Hash Chains & Merkle Proofs** | `crypto_engine.py` builds tree root but has no leaf-to-root inclusion proof generator or independent signature check. | Canonical RFC 8785 JSON representation, separate signature verification from hash chaining, binary Merkle tree with audit path generation (`get_proof(leaf_index)` and `verify_proof()`). | **P1 (High)** | **Phase 3** |
| **06** | **Real Fabric Anchoring** | `simulator.py` generates fake hex tx hashes and block numbers (`0x7f48e2b...`). | Deploy `agritrace_anchor.go` chaincode to Hyperledger Fabric `agrichannel`, submit endorsed transactions with Merkle root, verify via Fabric Blockchain Explorer, prevent unauthorized overwrite via endorsement policy. | **P1 (High)** | **Phase 3** |
| **07** | **Database Scale & Resiliency** | Development runs SQLite without connection pooling or automated backup testing; WS reconnect not surfaced on UI. | Centralized PostgreSQL (or Supabase PG), composite indexes (`device_id, sequence`, `shipment_id, timestamp`), WebSocket exponential backoff reconnection with "Stale Data / Offline" UI indicator. | **P2 (Scale)** | **Phase 4** |

---

## 3. Four-Phase Execution Plan

### Phase 1: Secure the Data Path (P0)
- [ ] **Canonical Telemetry Serialization**: Define canonical JSON schema across firmware (C/C++) and backend (Python/FastAPI).
- [ ] **Asymmetric Device Signing**: Generate device keypairs (secp256k1 or Ed25519). ESP32 signs hash of canonical record; backend validates with device public key.
- [ ] **Authenticated Ingestion Gateway**: ESP32 posts to `/api/v1/telemetry/secure-ingest` with `X-Device-ID`, `X-Timestamp`, and `X-Device-Signature`.
- [ ] **Supabase RLS Lockdown**: Revoke public anon write permissions on database tables; keep service-role key restricted strictly to backend service.

### Phase 2: Reliability and Verification (P0 - P1)
- [ ] **Flash-Backed Edge Queue**: Implement persistent NVS/LittleFS queue on ESP32 preserving sequence across sudden reboots and brownouts.
- [ ] **Sequence and Replay Validation**: Reject records where $\text{sequence} \le \text{last\_verified\_sequence}$; record missing ranges into sequence gap tracking.
- [ ] **Explicit Lifecycle States**: Tag telemetry with status transitions: `received` $\to$ `verified` $\to$ `anchored`.
- [ ] **Calibrated Sensor & Alert Rules**: Crop-specific dynamic threshold enforcement (temperature excursion, ethylene accumulation, rapid battery drain).

### Phase 3: Real Blockchain Proof (P1)
- [ ] **Merkle Inclusion Proofs**: Implement `generate_merkle_proof(leaf_index)` and audit validation endpoint `/api/v1/ledger/verify-record/{id}`.
- [ ] **Go Chaincode Contract**: Write and compile `agritrace_anchor.go` with `AnchorBatch(shipmentID, batchCode, merkleRoot, startSeq, endSeq, count)`.
- [ ] **Hyperledger Fabric Deployment**: Deploy chaincode to `agrichannel` with endorsement policy `AND('ApedaGovMSP.peer', OR('FarmerCoopMSP.peer', 'LogisticsMSP.peer'))`.
- [ ] **Explorer Verification & On-Ledger Audit**: Submit endorsed transactions; link direct Fabric Explorer URLs in the dashboard for judges.

### Phase 4: Production Hardening (P2)
- [ ] **PostgreSQL Production Configuration**: Optimize indexes, setup retention policies, and verify automated backup/restore scripts.
- [ ] **Frontend Network Indicators**: Display real-time gateway status, latency counter (ms), and stale data banner if WebSocket drops.
- [ ] **End-to-End Stress & Tamper Demonstration**: Automated script simulating offline bursts, duplicate injection, bit-flip tamper detection, and verification failure demo.

---

## 4. Prototype vs. Production Claims (Judge Presentation Guide)

> **Core Judge Pitch:**
> *"KRUSHI protects cold-chain telemetry using multiple independent security layers. Each device identifies and signs its records, the ingestion service validates their authenticity and sequence, and the backend maintains a cryptographic hash chain. We batch verified records into Merkle trees and anchor their roots on Hyperledger Fabric, enabling independent verification of the committed history. Sensor alerts and operational dashboards are handled separately from the integrity-verification pipeline."*

| Feature | Hackathon Prototype Status | Production Requirement |
|---------|---------------------------|------------------------|
| **Device Identity** | Software-held ECC private key on ESP32 flash | Hardware Secure Element (ATECC608A / OPTIGA Trust X) |
| **Ingestion Security** | Gateway validates digital signatures over TLS | Mutual TLS (mTLS) with device X.509 certificates |
| **Hash Chaining** | In-memory & SQLite/Supabase SHA-256 recursive chain | Continuous distributed audit ledger with automated gap reconciler |
| **Blockchain Proof** | Hyperledger Fabric permissioned ledger anchoring with on-chain Merkle roots | Multi-org endorsement with HSM-backed peer identities and automated chaincode lifecycle |
| **Gas Sensing** | Calibrated gas sensor benchmarked against ethylene threshold curves | Pre-calibrated electrochemical NDIR / photoionization detectors |
