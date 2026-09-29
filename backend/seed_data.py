"""
AgriTrace Seed Data Generator
Preloads realistic SIH26232 scenario matching reference UI screenshots:
- Shipment ID: 04beaccb-7c55-44ab-aa84-2a3f338dcf1c
- Device: AGRITRACE-001
- Products: Alphonso Mangoes & Strawberries in multi-compartment cold truck
- Historical Telemetry, Hash Chain, Blockchain Anchors, Alerts
"""

from datetime import datetime, timedelta
import random
from models import SessionLocal, init_db, Device, Shipment, TelemetryRecord, ShipmentEvent, Alert, LedgerAnchor
from crypto_engine import CryptoEngine

# Real Highway Coordinates between Ratnagiri Orchards and Mumbai Cold Port
ROUTE_COORDINATES = [
    {"name": "Ratnagiri Orchard Gate #2", "lat": 16.9902, "lon": 73.3120},
    {"name": "NH-66 Sangameshwar Checkpoint", "lat": 17.1895, "lon": 73.5463},
    {"name": "Chiplun Cold Buffer Hub", "lat": 17.5323, "lon": 73.5186},
    {"name": "Khed Mountain Pass (Offline Zone)", "lat": 17.7188, "lon": 73.3912},
    {"name": "Mahad Valley Toll Plaza", "lat": 18.2356, "lon": 73.4219},
    {"name": "Mangaon Transit Hub", "lat": 18.2562, "lon": 73.2871},
    {"name": "Panvel Expressway Inbound", "lat": 18.9894, "lon": 73.1175},
    {"name": "Vashi Cold Storage Terminal", "lat": 19.0760, "lon": 72.9982},
    {"name": "JNPT Reefer Dock 4, Navi Mumbai", "lat": 18.9499, "lon": 72.9515}
]

def seed_database():
    init_db()
    db = SessionLocal()

    # Clear existing if any
    db.query(Alert).delete()
    db.query(ShipmentEvent).delete()
    db.query(TelemetryRecord).delete()
    db.query(LedgerAnchor).delete()
    db.query(Shipment).delete()
    db.query(Device).delete()
    db.commit()

    # 1. Create Devices with Authentic SECP256k1 Public Keys
    from crypto_engine import DEVICE_MASTER_CREDENTIALS
    dev1 = Device(
        id="AGRITRACE-001",
        serial_number="NODE-ESP32-S3-88910",
        firmware_version="v2.4.1-sih",
        public_key=DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["public_key"],
        battery_level=94.5,
        solar_harvesting=True,
        charging_state="harvesting_active (320mW)",
        signal_strength=-68,
        status="online",
        last_seen=datetime.utcnow(),
        current_shipment_id="04beaccb-7c55-44ab-aa84-2a3f338dcf1c",
        auth_token=DEVICE_MASTER_CREDENTIALS["AGRITRACE-001"]["auth_token"]
    )

    dev2 = Device(
        id="AGRITRACE-002",
        serial_number="NODE-ESP32-S3-88911",
        firmware_version="v2.4.1-sih",
        public_key=DEVICE_MASTER_CREDENTIALS["AGRITRACE-002"]["public_key"],
        battery_level=88.0,
        solar_harvesting=True,
        charging_state="harvesting_standby",
        signal_strength=-72,
        status="online",
        last_seen=datetime.utcnow() - timedelta(minutes=5),
        current_shipment_id="SHP-2026-NASHIK-MUMBAI",
        auth_token=DEVICE_MASTER_CREDENTIALS["AGRITRACE-002"]["auth_token"]
    )

    dev3 = Device(
        id="AGRITRACE-003",
        serial_number="NODE-ESP32-S3-88912",
        firmware_version="v2.3.9-sih",
        public_key="04d88e2b99a123f4567890bcdea123456789abcdef0123",
        battery_level=42.0,
        solar_harvesting=False,
        charging_state="battery_discharging",
        signal_strength=-95,
        status="offline",
        last_seen=datetime.utcnow() - timedelta(hours=3),
        current_shipment_id=None
    )

    db.add_all([dev1, dev2, dev3])
    db.commit()

    # 2. Create Shipments
    primary_shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
    shp1 = Shipment(
        id=primary_shipment_id,
        shipment_code="SHP-AGRI-04BEACCB",
        product_name="GI-Tagged Ratnagiri Alphonso Mangoes",
        batch_code="AG-2401",
        compartment_label="Compartment A (Main Reefer Chamber)",
        origin="Ratnagiri Agri Cooperative, Maharashtra",
        destination="JNPT Cold Export Terminal, Navi Mumbai",
        carrier="KisanCold Express Logistics",
        truck_plate="MH-04-AZ-8892",
        driver_name="Rajesh Shinde",
        driver_phone="+91 98201 44512",
        status="IN_TRANSIT",
        created_at=datetime.utcnow() - timedelta(hours=6),
        estimated_delivery=datetime.utcnow() + timedelta(hours=2),
        device_id="AGRITRACE-001",
        min_temp=2.0,
        max_temp=8.0,
        max_humidity=85.0,
        max_gas_ethylene=50.0
    )

    shp2 = Shipment(
        id="SHP-2026-NASHIK-MUMBAI",
        shipment_code="SHP-AGRI-NASHIK-GRAPES",
        product_name="Export Table Grapes (Thompson Seedless)",
        batch_code="AG-2402",
        compartment_label="Compartment B (Secondary Cell)",
        origin="Dindori Grape Cluster, Nashik",
        destination="APMC Wholesale Fruit Market, Vashi",
        carrier="MahaCold Reefer Lines",
        truck_plate="MH-15-BT-4040",
        driver_name="Sunil Patil",
        driver_phone="+91 98220 11984",
        status="IN_TRANSIT",
        created_at=datetime.utcnow() - timedelta(hours=4),
        estimated_delivery=datetime.utcnow() + timedelta(hours=1),
        device_id="AGRITRACE-002",
        min_temp=0.5,
        max_temp=4.0,
        max_humidity=90.0,
        max_gas_ethylene=30.0
    )

    shp3 = Shipment(
        id="SHP-2026-PUNE-HYD",
        shipment_code="SHP-AGRI-PUNE-STRAWBERRY",
        product_name="Mahabaleshwar Winter Strawberries",
        batch_code="AG-2398",
        compartment_label="Reefer Unit 1",
        origin="Mahabaleshwar Agro Hub, Pune",
        destination="GMR Hyderabad Cargo Logistics",
        carrier="GreenCold Logistics",
        truck_plate="MH-12-CQ-9912",
        driver_name="Vikas Gaikwad",
        driver_phone="+91 94230 55811",
        status="DELIVERED",
        created_at=datetime.utcnow() - timedelta(days=2),
        actual_delivery=datetime.utcnow() - timedelta(days=1),
        device_id=None,
        min_temp=1.0,
        max_temp=5.0,
        max_humidity=88.0,
        max_gas_ethylene=40.0
    )

    db.add_all([shp1, shp2, shp3])
    db.commit()

    # 3. Create Shipment Events
    events = [
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="CREATED",
            title="Shipment Created & Manifest Sealed",
            description="Lot AG-2401 registered with MoFPI export certificate #EXP-99214.",
            location_name="Ratnagiri Orchard Gate #2",
            latitude=16.9902,
            longitude=73.3120,
            timestamp=datetime.utcnow() - timedelta(hours=6),
            severity="info",
            hash_proof="0x9a8f7c6e5d4b3a2f10e98c7b6a5d4e3f2109876543210abcdef0123456789abc"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="ASSIGNED",
            title="IoT Node AGRITRACE-001 Provisioned",
            description="Cryptographic keypair bound to batch container. Initial health: 98% battery, solar panel active.",
            location_name="Ratnagiri Packhouse",
            latitude=16.9950,
            longitude=73.3150,
            timestamp=datetime.utcnow() - timedelta(hours=5, minutes=45),
            severity="success",
            hash_proof="0x8b7c6d5e4f3a2b1c0e9d8c7b6a5e4d3c2b1a0987654321fedcba098765432101"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="DEPARTURE",
            title="Departed from Origin",
            description="Reefer pre-chilled to 4.2°C. Highway transit commenced on NH-66.",
            location_name="NH-66 Sangameshwar Toll Plaza",
            latitude=17.1895,
            longitude=73.5463,
            timestamp=datetime.utcnow() - timedelta(hours=4, minutes=30),
            severity="info",
            hash_proof="0x7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="OFFLINE_ENTER",
            title="Network Blindspot (Khed Valley Ghats)",
            description="Cellular signal lost. Offline-First durable local storage activated on node. Readings queued securely.",
            location_name="Khed Mountain Pass",
            latitude=17.7188,
            longitude=73.3912,
            timestamp=datetime.utcnow() - timedelta(hours=3),
            severity="warning",
            hash_proof="0x6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="OFFLINE_RESYNC",
            title="Cellular Reconnection & MQTT Batch Sync",
            description="42 queued offline records burst-synced over MQTT/TLS. Monotonic sequence verified with 0 data loss.",
            location_name="Mahad Valley Junction",
            latitude=18.2356,
            longitude=73.4219,
            timestamp=datetime.utcnow() - timedelta(hours=2, minutes=10),
            severity="success",
            hash_proof="0x5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="EXCURSION",
            title="Ethylene Spoilage Spike Detected",
            description="Ethylene level rose to 58.4 ppm (threshold: 50 ppm). Micro-ventilation alert dispatched to driver app.",
            location_name="Mangaon Transit Checkpoint",
            latitude=18.2562,
            longitude=73.2871,
            timestamp=datetime.utcnow() - timedelta(hours=1, minutes=30),
            severity="critical",
            hash_proof="0x4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a"
        ),
        ShipmentEvent(
            shipment_id=primary_shipment_id,
            event_type="CHECKPOINT",
            title="Navi Mumbai Inbound Security Gate",
            description="Geofence entry confirmed. Current temp 4.1°C, humidity 79%, solar battery 94.5%.",
            location_name="Vashi Cold Storage Terminal",
            latitude=19.0760,
            longitude=72.9982,
            timestamp=datetime.utcnow() - timedelta(minutes=20),
            severity="info",
            hash_proof="0x3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b"
        )
    ]
    db.add_all(events)
    db.commit()

    # 4. Generate Telemetry Records with Cryptographic Hash Chaining
    prev_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
    telemetry_list = []
    num_points = 50
    start_time = datetime.utcnow() - timedelta(hours=5)

    for seq in range(1, num_points + 1):
        progress = seq / num_points
        # Interpolate route
        idx = min(int(progress * (len(ROUTE_COORDINATES) - 1)), len(ROUTE_COORDINATES) - 2)
        sub_prog = (progress * (len(ROUTE_COORDINATES) - 1)) - idx
        p1 = ROUTE_COORDINATES[idx]
        p2 = ROUTE_COORDINATES[idx + 1]
        lat = round(p1["lat"] + (p2["lat"] - p1["lat"]) * sub_prog, 4)
        lon = round(p1["lon"] + (p2["lon"] - p1["lon"]) * sub_prog, 4)

        t_point = start_time + timedelta(minutes=seq * 6)
        
        # Environmental dynamics:
        # Offline simulation in seq 22-35
        # Gas spike in seq 36-42
        is_offline_range = 22 <= seq <= 35
        is_gas_spike = 36 <= seq <= 42

        if is_gas_spike:
            temp = round(4.8 + random.uniform(-0.3, 0.4), 2)
            hum = round(83.0 + random.uniform(-2.0, 3.0), 1)
            gas = round(56.5 + random.uniform(0.0, 8.0), 1) # Spike above 50
        elif is_offline_range:
            temp = round(4.1 + random.uniform(-0.2, 0.3), 2)
            hum = round(78.5 + random.uniform(-1.0, 1.5), 1)
            gas = round(14.0 + random.uniform(-1.0, 2.0), 1)
        else:
            temp = round(4.2 + random.uniform(-0.4, 0.5), 2)
            hum = round(77.0 + random.uniform(-2.0, 2.0), 1)
            gas = round(12.5 + random.uniform(-1.5, 1.5), 1)

        batt = round(96.0 - (seq * 0.03) + (0.5 if seq % 4 == 0 else 0), 1)

        # Sync states
        if is_offline_range:
            sync_state = "synced" # synced after recovery
            net_state = "offline"
        elif seq >= 48:
            sync_state = "live"
            net_state = "online"
        else:
            sync_state = "synced"
            net_state = "online"

        rec_hash = CryptoEngine.compute_record_hash(
            device_id="AGRITRACE-001",
            shipment_id=primary_shipment_id,
            sequence=seq,
            timestamp_str=t_point.isoformat(),
            temperature=temp,
            humidity=hum,
            gas_ethylene=gas,
            latitude=lat,
            longitude=lon,
            battery=batt,
            previous_hash=prev_hash
        )

        sig = CryptoEngine.sign_hash(rec_hash)

        telem = TelemetryRecord(
            device_id="AGRITRACE-001",
            shipment_id=primary_shipment_id,
            sequence=seq,
            timestamp=t_point,
            temperature=temp,
            humidity=hum,
            gas_ethylene=gas,
            latitude=lat,
            longitude=lon,
            battery=batt,
            solar_power_mw=320.0 if net_state == "online" else 0.0,
            network_state=net_state,
            sync_state=sync_state,
            previous_hash=prev_hash,
            record_hash=rec_hash,
            signature=sig,
            integrity_status="verified"
        )
        telemetry_list.append(telem)
        prev_hash = rec_hash

    db.add_all(telemetry_list)
    db.commit()

    # 5. Populate Alerts matching reference UI screenshot
    alerts_data = [
        Alert(
            shipment_id=primary_shipment_id,
            device_id="AGRITRACE-001",
            alert_type="DEVICE_OFFLINE",
            severity="WARNING",
            title="DEVICE_OFFLINE",
            message="Device AGRITRACE-001 temporarily disconnected during transit in mountain zone.",
            observed_value="Offline (0 bars)",
            threshold_value="heartbeat > 120s",
            status="RESOLVED",
            created_at=datetime.utcnow() - timedelta(hours=3),
            resolved_at=datetime.utcnow() - timedelta(hours=2, minutes=10)
        ),
        Alert(
            shipment_id=primary_shipment_id,
            device_id="AGRITRACE-001",
            alert_type="GAS_ALERT",
            severity="CRITICAL",
            title="GAS_ALERT",
            message="Device: AGRITRACE-001 · Shipment: 04beaccb-7c55-44ab-aa84-2a3f338dcf1c · Value: 58.4 ppm · Threshold: gasLevel > 50",
            observed_value="58.4 ppm",
            threshold_value="gasLevel > 50",
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=30),
            resolved_at=None
        ),
        Alert(
            shipment_id=primary_shipment_id,
            device_id="AGRITRACE-001",
            alert_type="HIGH_TEMP",
            severity="CRITICAL",
            title="HIGH_TEMP",
            message="Device: AGRITRACE-001 · Shipment: 04beaccb-7c55-44ab-aa84-2a3f338dcf1c · Value: 33.5 · Threshold: temperature > 28",
            observed_value="33.5 °C",
            threshold_value="temperature > 28",
            status="OPEN",
            created_at=datetime.utcnow() - timedelta(hours=1, minutes=15),
            resolved_at=None
        ),
        Alert(
            shipment_id=None,
            device_id="AGRITRACE-001",
            alert_type="DEVICE_OFFLINE",
            severity="WARNING",
            title="DEVICE_OFFLINE",
            message="Device: AGRITRACE-001 · No shipment active during overnight depot docking.",
            observed_value="Offline",
            threshold_value="idle_disconnect",
            status="RESOLVED",
            created_at=datetime.utcnow() - timedelta(days=2),
            resolved_at=datetime.utcnow() - timedelta(days=2, hours=-2)
        )
    ]
    db.add_all(alerts_data)
    db.commit()

    # 6. Populate Ledger Anchors (Decentralized Proofs)
    leaf_hashes = [t.record_hash for t in telemetry_list[:40]]
    merkle_root, _ = CryptoEngine.build_merkle_tree(leaf_hashes)

    anchor1 = LedgerAnchor(
        shipment_id=primary_shipment_id,
        batch_code="AG-2401",
        merkle_root=merkle_root,
        tx_hash="0x7f48e2b34a1c9056d38e2170ba69145290eafc63109a87d0c75460e1d8894bf2",
        block_number=18492014,
        network="Polygon zkEVM / AgriChain Trust Network",
        records_count=40,
        start_sequence=1,
        end_sequence=40,
        anchored_at=datetime.utcnow() - timedelta(minutes=45),
        verification_status="ANCHORED_VALID"
    )
    db.add(anchor1)
    db.commit()
    db.close()
    print("Database successfully initialized and seeded with SIH26232 scenario!")

if __name__ == "__main__":
    seed_database()
