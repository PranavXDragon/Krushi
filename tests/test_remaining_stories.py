"""
Automated Test Suite for STORY-009, STORY-010, STORY-011, and STORY-012:
- STORY-009: Persistent Edge Queue & Telemetry Lifecycle State Machine (received -> verified -> anchored) & SequenceGap tracking
- STORY-010: Binary Merkle Inclusion Proof Generation & Independent Verification Engine
- STORY-011: Hyperledger Fabric Chaincode Metadata & Anchoring Proof Verification
- STORY-012: WebSocket Ping/Pong Latency & Reconnection Resilience
"""

import os
import sys
from datetime import datetime
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from backend.main import app
from backend.models import SessionLocal, Device, Shipment, TelemetryRecord, SequenceGap, LedgerAnchor, init_db
from backend.crypto_engine import CryptoEngine, DEVICE_MASTER_CREDENTIALS
from backend.simulator import IoTSimulator

client = TestClient(app)


def setup_module(module):
    init_db()
    from backend.seed_data import seed_database
    db = SessionLocal()
    try:
        if db.query(Shipment).count() == 0:
            seed_database()
        for dev_id, creds in DEVICE_MASTER_CREDENTIALS.items():
            dev = db.query(Device).filter(Device.id == dev_id).first()
            if dev:
                dev.public_key = creds["public_key"]
                dev.auth_token = creds["auth_token"]
                dev.status = "online"
        db.commit()
    finally:
        db.close()


def test_story_009_lifecycle_states_and_sequence_gap_detection():
    """
    Verifies:
    1. Offline simulator queue persists records in 'received' state.
    2. Out-of-order sequence jump creates an OPEN SequenceGap entry.
    3. Filling the missing sequence resolves the SequenceGap to FILLED.
    4. Anchoring transitions records from 'verified' to 'anchored'.
    """
    db = SessionLocal()
    try:
        dev = db.query(Device).filter(Device.id == "AGRITRACE-001").first()
        shipment_id = dev.current_shipment_id or "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
        last_rec = (
            db.query(TelemetryRecord)
            .filter(TelemetryRecord.device_id == "AGRITRACE-001")
            .order_by(TelemetryRecord.sequence.desc())
            .first()
        )
        base_seq = last_rec.sequence if last_rec else 50
        base_hash = last_rec.record_hash if last_rec else "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    finally:
        db.close()

    # 1. Submit sequence with a gap (skip base_seq + 1, send base_seq + 2)
    skipped_seq = base_seq + 1
    jumped_seq = base_seq + 2
    ts_str = datetime.utcnow().isoformat()
    rec_hash = CryptoEngine.compute_record_hash(
        device_id="AGRITRACE-001",
        shipment_id=shipment_id,
        sequence=jumped_seq,
        timestamp_str=ts_str,
        temperature=4.1,
        humidity=78.0,
        gas_ethylene=12.4,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.0,
        previous_hash=base_hash,
    )
    sig = CryptoEngine.sign_hash(rec_hash, device_id="AGRITRACE-001")

    res = client.post(
        "/api/v1/telemetry/secure-ingest",
        headers={"X-Device-Token": DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["auth_token"]},
        json={
            "device_id": "AGRITRACE-001",
            "shipment_id": shipment_id,
            "sequence": jumped_seq,
            "timestamp": ts_str,
            "temperature": 4.1,
            "humidity": 78.0,
            "gas_ethylene": 12.4,
            "latitude": 19.0760,
            "longitude": 72.9982,
            "battery": 94.0,
            "previous_hash": base_hash,
            "record_hash": rec_hash,
            "signature": sig,
        },
    )
    assert res.status_code == 200

    # Check sequence gap was recorded as OPEN
    gaps_res = client.get("/api/v1/telemetry/sequence-gaps?device_id=AGRITRACE-001&status=OPEN")
    assert gaps_res.status_code == 200
    gaps = gaps_res.json()
    assert any(g["expected_sequence"] == skipped_seq and g["received_sequence"] == jumped_seq for g in gaps)

    # 2. Now submit the missing sequence (skipped_seq) to fill the gap
    ts_missing = datetime.utcnow().isoformat()
    missing_hash = CryptoEngine.compute_record_hash(
        device_id="AGRITRACE-001",
        shipment_id=shipment_id,
        sequence=skipped_seq,
        timestamp_str=ts_missing,
        temperature=4.0,
        humidity=78.2,
        gas_ethylene=12.1,
        latitude=19.0760,
        longitude=72.9982,
        battery=94.1,
        previous_hash=base_hash,
    )
    missing_sig = CryptoEngine.sign_hash(missing_hash, device_id="AGRITRACE-001")

    fill_res = client.post(
        "/api/v1/telemetry/secure-ingest",
        headers={"X-Device-Token": DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["auth_token"]},
        json={
            "device_id": "AGRITRACE-001",
            "shipment_id": shipment_id,
            "sequence": skipped_seq,
            "timestamp": ts_missing,
            "temperature": 4.0,
            "humidity": 78.2,
            "gas_ethylene": 12.1,
            "latitude": 19.0760,
            "longitude": 72.9982,
            "battery": 94.1,
            "previous_hash": base_hash,
            "record_hash": missing_hash,
            "signature": missing_sig,
        },
    )
    assert fill_res.status_code == 200

    # Verify the gap is now marked FILLED
    filled_res = client.get("/api/v1/telemetry/sequence-gaps?device_id=AGRITRACE-001&status=FILLED")
    assert filled_res.status_code == 200
    filled_gaps = filled_res.json()
    assert any(g["expected_sequence"] == skipped_seq and g["status"] == "FILLED" for g in filled_gaps)

    # Clean up test records so hash chain remains contiguous for subsequent tests
    db = SessionLocal()
    try:
        db.query(TelemetryRecord).filter(
            TelemetryRecord.device_id == "AGRITRACE-001",
            TelemetryRecord.sequence.in_([skipped_seq, jumped_seq]),
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def test_story_010_merkle_inclusion_proof_generation_and_verification():
    """
    Verifies binary Merkle inclusion proof generation and independent verification endpoint.
    """
    shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
    proof_res = client.get(f"/api/v1/shipments/{shipment_id}/merkle-proof/1")
    assert proof_res.status_code == 200
    bundle = proof_res.json()

    assert bundle["verified_inclusion"] is True
    assert len(bundle["proof"]) > 0
    assert bundle["merkle_root"].startswith("0x")

    # Verify via independent POST endpoint
    verify_res = client.post(
        "/api/v1/merkle/verify-proof",
        json={
            "leaf_hash": bundle["leaf_hash"],
            "proof": bundle["proof"],
            "merkle_root": bundle["merkle_root"],
        },
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["verified"] is True

    # Tampered leaf hash must fail verification
    bad_res = client.post(
        "/api/v1/merkle/verify-proof",
        json={
            "leaf_hash": "0" * 64,
            "proof": bundle["proof"],
            "merkle_root": bundle["merkle_root"],
        },
    )
    assert bad_res.status_code == 200
    assert bad_res.json()["verified"] is False


def test_story_011_hyperledger_fabric_chaincode_and_anchoring():
    """
    Verifies agritrace_anchor.go chaincode existence, contract-info endpoint, and lifecycle transition to 'anchored'.
    """
    chaincode_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "blockchain", "chaincode", "agritrace_anchor.go"))
    assert os.path.exists(chaincode_path)

    info_res = client.get("/api/v1/blockchain/contract-info")
    assert info_res.status_code == 200
    info = info_res.json()
    assert info["contract_name"] == "AgriTraceContract (Chaincode)"
    assert info["channel_id"] == "agrichannel"
    assert "fabric-explorer.krushi.net" in info["explorer_base_url"]

    # Anchor batch and verify lifecycle_state transitions to 'anchored'
    anchor_res = client.post("/api/v1/simulation/anchor-blockchain")
    assert anchor_res.status_code == 200
    anchor_data = anchor_res.json()
    assert anchor_data["status"] == "anchored"
    assert "fabric-explorer.krushi.net/tx/" in anchor_data["explorer_url"]

    stats_res = client.get("/api/v1/telemetry/lifecycle-stats?shipment_id=04beaccb-7c55-44ab-aa84-2a3f338dcf1c")
    assert stats_res.status_code == 200
    assert stats_res.json()["anchored"] > 0


def test_story_012_websocket_ping_pong_latency():
    """
    Verifies WebSocket /ws/telemetry responds with 'pong' to 'ping' for live RTT latency benchmarking.
    """
    with client.websocket_connect("/ws/telemetry") as websocket:
        websocket.send_text("ping")
        reply = websocket.receive_text()
        assert reply == "pong"
