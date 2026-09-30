# KRUSHI Codebase & Agent Architecture Patterns

This guide documents patterns, conventions, and reusable engineering practices established across the KRUSHI cold-chain integrity platform.

## 1. Cryptography & Telemetry Serialization
- **Canonical Serialization**: All hashes and digital signatures must use `CryptoEngine.canonical_json(data)` (RFC 8785-style sorted key ordering and consistent float normalization) to avoid cross-platform divergence between ESP32 C++ firmware and FastAPI Python backend.
- **Asymmetric Device Identity**: IoT nodes utilize ECDSA (SECP256k1) elliptic curve keypairs.
  - Signatures are compact 64-byte hex strings prefixed with `0x`.
  - Edge devices sign the SHA-256 digest of the canonical payload.
  - The backend verifies signatures independently against `device.public_key` stored in the database.
- **Two-Tier Tamper Detection**:
  - Layer 1 (Data integrity): Recalculating canonical SHA-256 detects any bit-level mutations in temperature, humidity, gas, or location values.
  - Layer 2 (Origin authenticity): ECDSA signature validation detects forged packets or impersonated devices.

## 2. Ingestion Gateway Security
- **Authenticated Endpoint**: `/api/v1/telemetry/secure-ingest` strictly validates:
  1. Device identity & revocation status (rejects 401/403).
  2. Monotonic sequence counter and duplicate packet handling (rejects 409 replay attack; returns 200 idempotent for identical re-transmissions).
  3. Canonical SHA-256 digest match (rejects 400).
  4. ECDSA signature verification against device public key (rejects 401).
- **Firmware Security**: ESP32 sketches must use TLS certificate pinning (`WiFiClientSecure.setCACert`) and never embed master server secret keys.

## 3. Database & Path Conventions
- SQLite paths in `models.py` must use absolute paths relative to `__file__` (`DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "agritrace.db"))`) to ensure consistent test and runtime execution regardless of working directory.

## 4. Supabase RLS & Ingestion Access Control
- **No Direct Anon Inserts**: Direct table insertions using public `anon` API keys are revoked in Supabase RLS (`scripts/supabase_hardened_rls.sql`). All telemetry must transit through `/api/v1/telemetry/secure-ingest`.
- **Anti-Impersonation Enforcement**: Devices are tied to `current_shipment_id`. Any cross-shipment submission is rejected with 403 Forbidden to prevent compromised truck nodes from polluting rival shipment logs.
- **Device Credential Tokens**: Ingestion gateway supports dual-mode token delivery (via `X-Device-Token` HTTP header or payload `device_token`).

## 5. Telemetry Lifecycle & Sequence Gap Reconciliation
- **Lifecycle State Machine**: Every telemetry packet progresses strictly through `received` (persistent offline buffer `.offline_edge_queue.json`) -> `verified` (canonical SHA-256 + ECDSA verified in database) -> `anchored` (batched into a Merkle root on Polygon PoS Amoy).
- **Sequence Gap Tracking**: Out-of-order sequence numbers create `SequenceGap(status="OPEN")` records in `sequence_gaps`. Subsequent burst syncs or out-of-order deliveries automatically transition resolved gaps to `FILLED`.

## 6. Binary Merkle Inclusion Proofs & On-Chain Anchoring
- **Audit Paths**: `CryptoEngine.get_merkle_proof` and `CryptoEngine.verify_merkle_proof` normalize `0x` prefixes and generate `O(log N)` sibling inclusion paths verifiable via `/api/v1/shipments/{shipment_id}/merkle-proof/{sequence}` and `/api/v1/merkle/verify-proof`.
- **Smart Contract**: `contracts/AgriChainAnchor.sol` anchors batch Merkle roots on Polygon PoS Amoy Testnet (Chain ID `80002`) with direct PolygonScan transaction links.

