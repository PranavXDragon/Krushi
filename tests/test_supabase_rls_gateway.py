"""
Automated Security Tests for STORY-008:
Supabase RLS Lockdown & Authenticated Ingestion Gateway
Weakness 02 Remediation Criteria:
- Done when: An unauthenticated request, a revoked device and a device impersonating another truck cannot submit accepted telemetry.
"""

import sys
import os
import pytest

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
def setup_devices():
    """Ensure devices are seeded and active before running tests."""
    from seed_data import seed_database
    db = SessionLocal()
    try:
        dev1 = db.query(Device).filter(Device.id == "AGRITRACE-001").first()
        if not dev1 or not dev1.auth_token:
            seed_database()
        else:
            dev1.status = "online"
            dev1.current_shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
            dev1.auth_token = DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["auth_token"]
            db.commit()
    finally:
        db.close()

def build_valid_packet(device_id: str, shipment_id: str, seq: int, token: str = None):
    priv_key = DEVICE_MASTER_CREDENTIALS[device_id]["private_key"]
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    rec_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id=shipment_id,
        sequence=seq,
        timestamp_str="2026-09-29T14:30:00",
        temperature=4.2,
        humidity=78.0,
        gas_ethylene=13.5,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.5,
        previous_hash=prev_hash
    )
    sig = CryptoEngine.sign_hash(rec_hash, private_key_hex=priv_key)
    return {
        "device_id": device_id,
        "shipment_id": shipment_id,
        "sequence": seq,
        "timestamp": "2026-09-29T14:30:00",
        "temperature": 4.2,
        "humidity": 78.0,
        "gas_ethylene": 13.5,
        "latitude": 19.0760,
        "longitude": 72.9982,
        "battery": 94.5,
        "solar_power_mw": 320.0,
        "previous_hash": prev_hash,
        "record_hash": rec_hash,
        "signature": sig,
        "device_token": token
    }

def test_unauthenticated_request_rejected():
    """
    CRITERIA 1: An unauthenticated request without a valid token must be rejected.
    """
    payload = build_valid_packet(
        device_id="AGRITRACE-001",
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        seq=888001,
        token=None # NO TOKEN
    )
    # Request without token header or payload token
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 401
    assert "missing or invalid credential token" in res.json()["detail"]

def test_invalid_token_rejected():
    """
    CRITERIA 1b: An unauthenticated request with a fraudulent token must be rejected.
    """
    payload = build_valid_packet(
        device_id="AGRITRACE-001",
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        seq=888002,
        token="fraudulent_token_xyz"
    )
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 401
    assert "missing or invalid credential token" in res.json()["detail"]

def test_revoked_device_rejected():
    """
    CRITERIA 2: A revoked device cannot submit accepted telemetry.
    """
    device_id = "AGRITRACE-001"
    token = DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]

    # Revoke device
    client.post(f"/api/v1/devices/{device_id}/revoke")

    payload = build_valid_packet(
        device_id=device_id,
        shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        seq=888003,
        token=token
    )
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 403
    assert "credential has been revoked" in res.json()["detail"]

    # Restore device status
    client.post(f"/api/v1/devices/{device_id}/activate")

def test_device_impersonating_another_truck_rejected():
    """
    CRITERIA 3: A device impersonating another truck cannot submit accepted telemetry.
    AGRITRACE-001 is assigned to '04beaccb-7c55-44ab-aa84-2a3f338dcf1c'.
    Attempting to submit telemetry for another shipment ('SHP-2026-NASHIK-MUMBAI') must be rejected with 403.
    """
    device_id = "AGRITRACE-001"
    token = DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]

    # Attempt to impersonate truck 2's shipment
    foreign_shipment_id = "SHP-2026-NASHIK-MUMBAI"
    payload = build_valid_packet(
        device_id=device_id,
        shipment_id=foreign_shipment_id,
        seq=888004,
        token=token
    )
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 403
    assert "Device impersonation detected" in res.json()["detail"]

def test_authorized_device_telemetry_accepted():
    """
    Valid authorized packet with correct token and assigned shipment is accepted.
    """
    device_id = "AGRITRACE-001"
    shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
    token = DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]

    payload = build_valid_packet(
        device_id=device_id,
        shipment_id=shipment_id,
        seq=888005,
        token=token
    )
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "verified"
    assert data["device_id"] == device_id
    assert data["integrity_status"] == "verified"

def test_header_based_token_accepted():
    """
    Validates token passing via standard X-Device-Token HTTP header.
    """
    device_id = "AGRITRACE-001"
    shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
    token = DEVICE_MASTER_CREDENTIALS[device_id]["auth_token"]

    payload = build_valid_packet(
        device_id=device_id,
        shipment_id=shipment_id,
        seq=888006,
        token=None # Omitted from body
    )
    headers = {"X-Device-Token": token}
    res = client.post("/api/v1/telemetry/secure-ingest", json=payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "verified"
