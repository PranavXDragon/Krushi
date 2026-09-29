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
