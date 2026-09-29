"""
AgriTrace - Clean Live Slate Reset
Purges all fake alerts and simulated telemetry records so the dashboard
only shows real incoming live packets from physical/edge IoT devices.
"""

import sys
import os

backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, backend_dir)

from models import SessionLocal, init_db, Device, Shipment, TelemetryRecord, ShipmentEvent, Alert, LedgerAnchor
from datetime import datetime

def reset_to_clean_live():
    init_db()
    db = SessionLocal()
    try:
        # 1. Delete all fake alerts and simulated telemetry
        deleted_alerts = db.query(Alert).delete()
        deleted_telemetry = db.query(TelemetryRecord).delete()
        deleted_anchors = db.query(LedgerAnchor).delete()

        # 2. Reset shipment events to clean initial baseline
        db.query(ShipmentEvent).delete()

        # 3. Ensure shipments exist and are active
        shipments = db.query(Shipment).all()
        for shp in shipments:
            shp.status = "IN_TRANSIT"
            evt = ShipmentEvent(
                shipment_id=shp.id,
                event_type="CREATED",
                title="Shipment Registered & Bound to IoT Node",
                description=f"Active monitoring initialized for {shp.product_name} ({shp.batch_code}). Waiting for live ESP32 telemetry.",
                location_name=shp.origin,
                timestamp=datetime.utcnow(),
                severity="info"
            )
            db.add(evt)

        # 4. Set devices to clean online status ready for live ingest
        devices = db.query(Device).all()
        for dev in devices:
            dev.status = "online"
            dev.last_seen = datetime.utcnow()

        db.commit()
        print(f"Clean Slate Complete:")
        print(f" - Purged {deleted_alerts} fake alerts")
        print(f" - Purged {deleted_telemetry} simulated telemetry records")
        print(f" - Purged {deleted_anchors} anchors")
        print(f" - Reset {len(shipments)} shipments to clean live awaiting state")
        print(f" - Configured {len(devices)} cryptographic devices ready for real ESP32 packets")
    finally:
        db.close()

if __name__ == "__main__":
    reset_to_clean_live()
