"""
Unit & Integration Tests for KRUSHI P0 Security Remediation:
STORY-007: Device Identity & ECDSA Asymmetric Signature Ingestion
Vulnerability 01 & 02:
- Done when: A modified temperature value and a forged signature are both rejected.
- Done when: An unauthenticated request and a revoked device cannot submit accepted telemetry.
"""

import sys
import os
import pytest
from datetime import datetime

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from main import app
from crypto_engine import CryptoEngine, DEVICE_MASTER_CREDENTIALS
from models import SessionLocal, Device, Shipment, TelemetryRecord

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_sequences():
    db = SessionLocal()
    try:
        db.query(TelemetryRecord).filter(TelemetryRecord.sequence >= 800000).delete()
        db.commit()
    finally:
        db.close()

def test_canonical_json_determinism():
    """Ensures dictionary key ordering and whitespace normalization are strictly deterministic."""
    data1 = {"temperature": 4.2, "device_id": "AGRITRACE-001", "sequence": 1}
    data2 = {"sequence": 1, "temperature": 4.2, "device_id": "AGRITRACE-001"}
    
    canon1 = CryptoEngine.canonical_json(data1)
    canon2 = CryptoEngine.canonical_json(data2)
    assert canon1 == canon2
    assert canon1 == '{"device_id":"AGRITRACE-001","sequence":1,"temperature":4.2}'

def test_ecdsa_secp256k1_sign_and_verify():
    """Validates real elliptic curve signing and verification with device master keypairs."""
    device_id = "AGRITRACE-001"
    priv_key = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]
    pub_key = DEVICE_MASTER_CREDENTIALS[device_id]["public_key"]

    digest = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id="test-shipment-123",
        sequence=101,
        timestamp_str="2026-09-29T12:00:00",
        temperature=4.2,
        humidity=78.0,
        gas_ethylene=13.5,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash="GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    )

    sig = CryptoEngine.sign_hash(digest, private_key_hex=priv_key)
    assert sig.startswith("0x")
    assert len(sig) == 130 # 0x + 128 hex chars (64 bytes)

    # 1. Valid signature passes
    assert CryptoEngine.verify_device_signature(digest, sig, pub_key) is True

    # 2. Forged signature fails
    forged_sig = "0x" + "00" * 64
    assert CryptoEngine.verify_device_signature(digest, forged_sig, pub_key) is False

    # 3. Altered digest fails
    altered_digest = digest[:-4] + "ffff"
    assert CryptoEngine.verify_device_signature(altered_digest, sig, pub_key) is False

def test_secure_ingest_valid_packet():
    """Tests full end-to-end ingestion of an authentic signed telemetry record."""
    device_id = "AGRITRACE-001"
    priv_key = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]

    # Re-activate device just in case
    client.post(f"/api/v1/devices/{device_id}/activate")

    seq = 999901
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    rec_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        sequence=seq,
        timestamp_str="2026-09-29T12:00:00",
        temperature=4.2,
        humidity=78.5,
        gas_ethylene=13.0,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash=prev_hash
    )
    sig = CryptoEngine.sign_hash(rec_hash, private_key_hex=priv_key)

    payload = {
        "device_id": device_id,
        "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        "sequence": seq,
        "timestamp": "2026-09-29T12:00:00",
        "temperature": 4.2,
        "humidity": 78.5,
        "gas_ethylene": 13.0,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 94.5,
        "solar_power_mw": 320.0,
        "previous_hash": prev_hash,
        "record_hash": rec_hash,
        "signature": sig,
        "device_token": DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]
    }

    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "verified"
    assert data["integrity_status"] == "verified"
    assert data["record_hash"] == rec_hash

def test_secure_ingest_rejects_modified_temperature():
    """
    CRITICAL WEAKNESS 01 TEST:
    A modified temperature value must be rejected!
    Payload sends temperature=28.5°C while record_hash was computed for 4.2°C.
    """
    device_id = "AGRITRACE-001"
    priv_key = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]

    seq = 999902
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    
    # Original hash calculated for 4.2°C
    original_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        sequence=seq,
        timestamp_str="2026-09-29T12:00:00",
        temperature=4.2,
        humidity=78.5,
        gas_ethylene=13.0,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash=prev_hash
    )
    sig = CryptoEngine.sign_hash(original_hash, private_key_hex=priv_key)

    # Attacker alters temperature to 28.5 in payload
    tampered_payload = {
        "device_id": device_id,
        "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        "sequence": seq,
        "timestamp": "2026-09-29T12:00:00",
        "temperature": 28.5, # TAMPERED VALUE
        "humidity": 78.5,
        "gas_ethylene": 13.0,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 94.5,
        "previous_hash": prev_hash,
        "record_hash": original_hash, # Mismatch with 28.5
        "signature": sig,
        "device_token": DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]
    }

    res = client.post("/api/v1/telemetry/secure-ingest", json=tampered_payload)
    assert res.status_code == 400
    assert "Sensor data modification detected" in res.json()["detail"]

def test_secure_ingest_rejects_forged_signature():
    """
    CRITICAL WEAKNESS 01 TEST:
    A forged signature must be rejected!
    Payload sends correct hash for 4.2°C, but with a forged/random signature.
    """
    device_id = "AGRITRACE-001"

    seq = 999903
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    
    rec_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        sequence=seq,
        timestamp_str="2026-09-29T12:00:00",
        temperature=4.2,
        humidity=78.5,
        gas_ethylene=13.0,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash=prev_hash
    )
    # Forged signature
    forged_sig = "0x" + "a1" * 64

    payload = {
        "device_id": device_id,
        "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        "sequence": seq,
        "timestamp": "2026-09-29T12:00:00",
        "temperature": 4.2,
        "humidity": 78.5,
        "gas_ethylene": 13.0,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 94.5,
        "previous_hash": prev_hash,
        "record_hash": rec_hash,
        "signature": forged_sig,
        "device_token": DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]
    }

    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 401
    assert "Cryptographic signature verification failed" in res.json()["detail"]

def test_secure_ingest_rejects_revoked_device():
    """
    CRITICAL WEAKNESS 02 TEST:
    A revoked device cannot submit accepted telemetry.
    """
    device_id = "AGRITRACE-001"
    priv_key = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]

    # 1. Revoke the device
    rev_res = client.post(f"/api/v1/devices/{device_id}/revoke")
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "revoked"

    seq = 999904
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    rec_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        sequence=seq,
        timestamp_str="2026-09-29T12:00:00",
        temperature=4.2,
        humidity=78.5,
        gas_ethylene=13.0,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash=prev_hash
    )
    sig = CryptoEngine.sign_hash(rec_hash, private_key_hex=priv_key)

    payload = {
        "device_id": device_id,
        "shipment_id": "04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        "sequence": seq,
        "timestamp": "2026-09-29T12:00:00",
        "temperature": 4.2,
        "humidity": 78.5,
        "gas_ethylene": 13.0,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 94.5,
        "previous_hash": prev_hash,
        "record_hash": rec_hash,
        "signature": sig,
        "device_token": DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]
    }

    # Ingestion must be rejected with 403
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 403
    assert "revoked" in res.json()["detail"]

    # Re-activate device for future tests
    client.post(f"/api/v1/devices/{device_id}/activate")

def test_secure_ingest_rejects_unregistered_device():
    """
    CRITICAL WEAKNESS 02 TEST:
    An unauthenticated / unregistered device cannot submit telemetry.
    """
    payload = {
        "device_id": "ROGUE-NODE-999",
        "sequence": 1,
        "timestamp": "2026-09-29T12:00:00",
        "temperature": 4.2,
        "humidity": 78.5,
        "gas_ethylene": 13.0,
        "record_hash": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "signature": "0x" + "bb" * 64
    }
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 401
    assert "not registered" in res.json()["detail"]
