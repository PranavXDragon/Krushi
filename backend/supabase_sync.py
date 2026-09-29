"""
AgriTrace Supabase Ingestion & Synchronization Engine
SIH Problem Statement 26232

Pipeline:
1. ESP32 Node sends telemetry directly to Supabase table `esp32_telemetry`.
2. This service syncs data from Supabase into the local AgriTrace backend / database.
3. Computes canonical SHA-256 hash chains, checks threshold excursions, and logs alerts.
4. Broadcasts updates to the local Dashboard in real time via WebSockets.
"""

import os
import socket
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

# DNS Resolver Fallback for newly registered Supabase subdomains
_orig_getaddrinfo = socket.getaddrinfo
def _custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == "hccppqykmjfcpjmhntks.supabase.co":
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('104.18.38.10', port))]
    return _orig_getaddrinfo(host, port, family, type, proto, flags)
socket.getaddrinfo = _custom_getaddrinfo

from models import SessionLocal, Device, Shipment, TelemetryRecord, Alert
from crypto_engine import CryptoEngine

# Supabase Credentials (configurable via environment variables or .env)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://hccppqykmjfcpjmhntks.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY3BwcXlrbWpmY3BqbWhudGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NjkyODcsImV4cCI6MjEwNjI0NTI4N30.4ATVqARowUNzUk49LZMKkIbeealIlnQCf0Tt6JnsKvQ")

supabase_client = None

def get_supabase_client():
    global supabase_client
    if supabase_client is None and SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"[Supabase] Could not initialize client: {e}")
    return supabase_client

def process_and_save_telemetry(raw_data: Dict[str, Any], db: Session) -> Optional[TelemetryRecord]:
    """
    Takes raw telemetry payload (from ESP32 / Supabase), validates sequence,
    chains SHA-256 cryptographic hashes, checks threshold excursions, and saves locally.
    """
    device_id = raw_data.get("device_id", "AGRITRACE-001")
    shipment_id = raw_data.get("shipment_id")
    
    # Resolve active shipment for this device if not provided
    if not shipment_id:
        active_shipment = db.query(Shipment).filter(
            Shipment.device_id == device_id,
            Shipment.status == "IN_TRANSIT"
        ).first()
        if not active_shipment:
            # Fallback to the latest active shipment
            active_shipment = db.query(Shipment).first()
        if active_shipment:
            shipment_id = active_shipment.id

    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first() if shipment_id else None

    # Retrieve last known sequence and hash for this device
    last_rec = db.query(TelemetryRecord).filter(
        TelemetryRecord.device_id == device_id
    ).order_by(TelemetryRecord.sequence.desc()).first()

    expected_seq = (last_rec.sequence + 1) if last_rec else 1
    previous_hash = last_rec.record_hash if last_rec else "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"

    sequence = raw_data.get("sequence", expected_seq)
    timestamp_str = raw_data.get("timestamp") or datetime.utcnow().isoformat()
    temp = float(raw_data.get("temperature", 4.2))
    hum = float(raw_data.get("humidity", 78.0))
    gas = float(raw_data.get("gas_ethylene", 13.5))
    lat = float(raw_data.get("latitude", 19.0760))
    lon = float(raw_data.get("longitude", 72.9982))
    battery = float(raw_data.get("battery", 94.5))
    solar_power = float(raw_data.get("solar_power_mw", 320.0))
    network_state = raw_data.get("network_state", "online")
    sync_state = raw_data.get("sync_state", "live")

    # Lookup Device
    dev = db.query(Device).filter(Device.id == device_id).first()
    if dev and dev.status == "revoked":
        print(f"[Supabase Sync] Rejected telemetry: device {device_id} is revoked.")
        return None

    # Cryptographic Hash Chaining
    rec_hash = CryptoEngine.compute_record_hash(
        device_id=device_id,
        shipment_id=shipment_id or "default-shipment",
        sequence=sequence,
        timestamp_str=timestamp_str,
        temperature=temp,
        humidity=hum,
        gas_ethylene=gas,
        latitude=lat,
        longitude=lon,
        battery=battery,
        previous_hash=previous_hash
    )
    
    # Verify or generate ECDSA signature
    raw_sig = raw_data.get("signature")
    is_sig_valid = True
    if raw_sig and dev and dev.public_key:
        is_sig_valid = CryptoEngine.verify_device_signature(rec_hash, raw_sig, dev.public_key)
        signature = raw_sig
    else:
        signature = raw_sig or CryptoEngine.sign_hash(rec_hash, device_id=device_id)

    # Monotonic and pointer integrity verification
    is_valid = True
    if last_rec and sequence != last_rec.sequence + 1:
        is_valid = False
    if not is_sig_valid:
        is_valid = False
    
    integrity_status = "verified" if is_valid else "failed"

    record = TelemetryRecord(
        device_id=device_id,
        shipment_id=shipment_id,
        sequence=sequence,
        temperature=temp,
        humidity=hum,
        gas_ethylene=gas,
        latitude=lat,
        longitude=lon,
        battery=battery,
        solar_power_mw=solar_power,
        network_state=network_state,
        sync_state=sync_state,
        previous_hash=previous_hash,
        record_hash=rec_hash,
        signature=signature,
        integrity_status=integrity_status
    )
    db.add(record)

    # Environmental Threshold & Excursion Evaluation
    if shipment:
        thresholds = {
            "min_temp": shipment.min_temp or 2.0,
            "max_temp": shipment.max_temp or 8.0,
            "max_humidity": shipment.max_humidity or 85.0,
            "max_gas": shipment.max_gas_ethylene or 50.0
        }

        # Check Temperature
        if temp > thresholds["max_temp"]:
            alert = Alert(
                shipment_id=shipment.id,
                device_id=device_id,
                alert_type="HIGH_TEMP",
                severity="CRITICAL",
                title=f"High Temperature Excursion ({temp}°C)",
                message=f"Reefer temperature of {temp}°C exceeded maximum safety threshold of {thresholds['max_temp']}°C.",
                observed_value=f"{temp}°C",
                threshold_value=f"{thresholds['max_temp']}°C",
                status="OPEN"
            )
            db.add(alert)
        elif temp < thresholds["min_temp"]:
            alert = Alert(
                shipment_id=shipment.id,
                device_id=device_id,
                alert_type="LOW_TEMP",
                severity="WARNING",
                title=f"Chilling Warning ({temp}°C)",
                message=f"Reefer temperature of {temp}°C dropped below minimum threshold of {thresholds['min_temp']}°C.",
                observed_value=f"{temp}°C",
                threshold_value=f"{thresholds['min_temp']}°C",
                status="OPEN"
            )
            db.add(alert)

        # Check Ethylene Gas
        if gas > thresholds["max_gas"]:
            alert = Alert(
                shipment_id=shipment.id,
                device_id=device_id,
                alert_type="GAS_ALERT",
                severity="CRITICAL",
                title=f"Ethylene Accumulation Spike ({gas} ppm)",
                message=f"Detected high ripening gas concentration ({gas} ppm). Potential premature spoilage detected.",
                observed_value=f"{gas} ppm",
                threshold_value=f"{thresholds['max_gas']} ppm",
                status="OPEN"
            )
            db.add(alert)

    db.commit()
    db.refresh(record)
    return record

async def sync_from_supabase_table(table_name: str = "esp32_telemetry", batch_size: int = 50) -> int:
    """
    Pulls unsynced records from Supabase table where `synced_to_local = false`,
    processes them, commits to local database, and marks them synced in Supabase.
    """
    client = get_supabase_client()
    if not client:
        return 0

    try:
        # Fetch unsynced rows ordered by sequence or created_at
        res = client.table(table_name).select("*").eq("synced_to_local", False).order("created_at").limit(batch_size).execute()
        rows = res.data or []

        if not rows:
            return 0

        synced_ids = []
        db = SessionLocal()
        try:
            for row in rows:
                process_and_save_telemetry(row, db)
                if "id" in row:
                    synced_ids.append(row["id"])
            
            # Mark processed rows as synced in Supabase
            if synced_ids:
                client.table(table_name).update({"synced_to_local": True}).in_("id", synced_ids).execute()
        finally:
            db.close()

        return len(rows)
    except Exception as e:
        print(f"[Supabase Sync Error]: {e}")
        return 0

def push_telemetry_to_supabase(data: Dict[str, Any], table_name: str = "esp32_telemetry") -> bool:
    """
    Directly uploads a telemetry packet to the live Supabase project table.
    """
    client = get_supabase_client()
    if not client:
        return False
    try:
        payload = {
            "device_id": data.get("device_id", "AGRITRACE-001"),
            "shipment_id": data.get("shipment_id"),
            "sequence": data.get("sequence", 1),
            "temperature": float(data.get("temperature", 4.0)),
            "humidity": float(data.get("humidity", 78.0)),
            "gas_ethylene": float(data.get("gas_ethylene", 12.0)),
            "latitude": float(data.get("latitude", 19.0760)),
            "longitude": float(data.get("longitude", 72.9982)),
            "battery": float(data.get("battery", 95.0)),
            "solar_power_mw": float(data.get("solar_power_mw", 320.0)),
            "network_state": data.get("network_state", "online"),
            "sync_state": data.get("sync_state", "live"),
            "integrity_status": data.get("integrity_status", "verified"),
            "synced_to_local": True
        }
        res = client.table(table_name).insert(payload).execute()
        return bool(res.data)
    except Exception as e:
        print(f"[Supabase Push Error]: {e}")
        return False

