"""
AgriTrace IoT Node Simulator & Demo Execution Engine
Supports interactive SIH26232 presentation features:
- Live streaming telemetry over MQTT/REST
- Network Disconnect -> Offline Local Queuing (sequence monotonicity preserved)
- Network Reconnect -> MQTT Batch Burst Sync & Idempotent Ingestion
- Tamper & Excursion Injections (Gas spike, Temp spike, Enclosure Open, Hash Mutation)
- Decentralized Ledger Merkle Root Anchoring
"""

import asyncio
import json
import os
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models import SessionLocal, Device, Shipment, TelemetryRecord, ShipmentEvent, Alert, LedgerAnchor, SequenceGap
from crypto_engine import CryptoEngine

OFFLINE_QUEUE_PATH = os.environ.get(
    "OFFLINE_QUEUE_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), ".offline_edge_queue.json")
)

class IoTSimulator:
    def __init__(self):
        self.device_id = "AGRITRACE-001"
        self.shipment_id = "04beaccb-7c55-44ab-aa84-2a3f338dcf1c"
        self.is_network_online = True
        self.offline_queue: List[Dict[str, Any]] = []
        self.current_sequence = 50
        self.last_hash = ""
        self.auto_stream = True
        
        # Route progress index for map movement
        self.current_lat = 19.0760
        self.current_lon = 72.9982
        
        # Base environmental state
        self.base_temp = 4.2
        self.base_humidity = 78.5
        self.base_gas = 13.0
        self.battery_level = 94.5
        self.solar_harvesting = True

        self._sync_last_hash_from_db()
        self._load_persistent_queue()

    def _load_persistent_queue(self):
        try:
            if os.path.exists(OFFLINE_QUEUE_PATH):
                with open(OFFLINE_QUEUE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and data:
                        self.offline_queue = data
                        last_q = self.offline_queue[-1]
                        if last_q.get("sequence", 0) > self.current_sequence:
                            self.current_sequence = last_q["sequence"]
                            self.last_hash = last_q.get("record_hash", self.last_hash)
        except Exception:
            pass

    def _save_persistent_queue(self):
        try:
            with open(OFFLINE_QUEUE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.offline_queue, f, indent=2)
        except Exception:
            pass

    def _sync_last_hash_from_db(self):
        db = SessionLocal()
        try:
            last_record = db.query(TelemetryRecord).filter(
                TelemetryRecord.device_id == self.device_id
            ).order_by(TelemetryRecord.sequence.desc()).first()
            
            if last_record:
                self.current_sequence = last_record.sequence
                self.last_hash = last_record.record_hash
                self.current_lat = last_record.latitude
                self.current_lon = last_record.longitude
                self.battery_level = last_record.battery
            else:
                self.current_sequence = 0
                self.last_hash = "GENESIS_ROOT_000000000000000000000000000000000000000000000000000000000000"
        finally:
            db.close()

    def generate_single_reading(
        self,
        force_temp: Optional[float] = None,
        force_hum: Optional[float] = None,
        force_gas: Optional[float] = None
    ) -> Dict[str, Any]:
        """Generates next sample with sequential counter and chained hash."""
        self.current_sequence += 1
        
        # Jitter values
        temp = force_temp if force_temp is not None else round(self.base_temp + random.uniform(-0.2, 0.3), 2)
        hum = force_hum if force_hum is not None else round(self.base_humidity + random.uniform(-1.0, 1.0), 1)
        gas = force_gas if force_gas is not None else round(self.base_gas + random.uniform(-0.8, 1.2), 1)
        
        # Slow battery drift & solar harvesting
        if self.solar_harvesting:
            self.battery_level = min(100.0, round(self.battery_level + random.uniform(0.01, 0.05), 1))
            solar_power = round(320.0 + random.uniform(-20, 30), 1)
        else:
            self.battery_level = max(5.0, round(self.battery_level - random.uniform(0.02, 0.06), 1))
            solar_power = 0.0

        # Creep slightly towards destination
        self.current_lat = round(self.current_lat + random.uniform(-0.001, 0.002), 4)
        self.current_lon = round(self.current_lon + random.uniform(-0.001, 0.002), 4)

        now_str = datetime.utcnow().isoformat()

        # Compute deterministic hash
        rec_hash = CryptoEngine.compute_record_hash(
            device_id=self.device_id,
            shipment_id=self.shipment_id,
            sequence=self.current_sequence,
            timestamp_str=now_str,
            temperature=temp,
            humidity=hum,
            gas_ethylene=gas,
            latitude=self.current_lat,
            longitude=self.current_lon,
            battery=self.battery_level,
            previous_hash=self.last_hash
        )

        sig = CryptoEngine.sign_hash(rec_hash)

        reading = {
            "device_id": self.device_id,
            "shipment_id": self.shipment_id,
            "sequence": self.current_sequence,
            "timestamp": now_str,
            "temperature": temp,
            "humidity": hum,
            "gas_ethylene": gas,
            "latitude": self.current_lat,
            "longitude": self.current_lon,
            "battery": self.battery_level,
            "solar_power_mw": solar_power,
            "network_state": "online" if self.is_network_online else "offline",
            "sync_state": "live" if self.is_network_online else "queued",
            "previous_hash": self.last_hash,
            "record_hash": rec_hash,
            "signature": sig,
            "integrity_status": "verified"
        }

        self.last_hash = rec_hash
        return reading

    def tick(self) -> Dict[str, Any]:
        """Main periodic tick: either ingests live to DB or queues locally."""
        reading = self.generate_single_reading()
        
        if not self.is_network_online:
            # Device stores in local persistent offline buffer
            reading["lifecycle_state"] = "received"
            self.offline_queue.append(reading)
            self._save_persistent_queue()
            return {
                "action": "queued_offline",
                "record": reading,
                "offline_queue_length": len(self.offline_queue)
            }
        else:
            # Ingest directly to DB
            db = SessionLocal()
            try:
                reading["lifecycle_state"] = "verified"
                rec_db = TelemetryRecord(
                    device_id=reading["device_id"],
                    shipment_id=reading["shipment_id"],
                    sequence=reading["sequence"],
                    timestamp=datetime.fromisoformat(reading["timestamp"]),
                    temperature=reading["temperature"],
                    humidity=reading["humidity"],
                    gas_ethylene=reading["gas_ethylene"],
                    latitude=reading["latitude"],
                    longitude=reading["longitude"],
                    battery=reading["battery"],
                    solar_power_mw=reading["solar_power_mw"],
                    network_state="online",
                    sync_state="live",
                    previous_hash=reading["previous_hash"],
                    record_hash=reading["record_hash"],
                    signature=reading["signature"],
                    integrity_status="verified",
                    lifecycle_state="verified"
                )
                db.add(rec_db)
                
                # Check alert thresholds
                self._check_and_create_alerts(db, reading)
                
                # Update device state
                dev = db.query(Device).filter(Device.id == self.device_id).first()
                if dev:
                    dev.battery_level = reading["battery"]
                    dev.last_seen = datetime.utcnow()
                    dev.status = "online"
                
                db.commit()
            finally:
                db.close()

            return {
                "action": "ingested_live",
                "record": reading,
                "offline_queue_length": 0
            }

    def set_network_state(self, online: bool) -> Dict[str, Any]:
        """Toggles network connectivity to test offline-first logging."""
        self.is_network_online = online
        db = SessionLocal()
        try:
            dev = db.query(Device).filter(Device.id == self.device_id).first()
            if dev:
                dev.status = "online" if online else "offline"
            
            # Log event
            if not online:
                evt = ShipmentEvent(
                    shipment_id=self.shipment_id,
                    event_type="OFFLINE_ENTER",
                    title="Simulated Cellular Disconnect (Offline Mode)",
                    description="Cellular transceiver disabled. Node logging securely to durable local flash memory.",
                    location_name="Simulated Rural Blindzone",
                    latitude=self.current_lat,
                    longitude=self.current_lon,
                    timestamp=datetime.utcnow(),
                    severity="warning"
                )
                db.add(evt)
            db.commit()
        finally:
            db.close()

        return {
            "status": "online" if online else "offline",
            "message": f"Device network switched to {'ONLINE' if online else 'OFFLINE (Local Queueing Active)'}",
            "offline_records_queued": len(self.offline_queue)
        }

    def perform_batch_sync(self) -> Dict[str, Any]:
        """Simulates MQTT Batch Burst Ingestion when reconnected."""
        if not self.offline_queue:
            return {"status": "empty", "message": "No queued records to sync", "synced_count": 0}

        db = SessionLocal()
        synced_count = len(self.offline_queue)
        try:
            first_seq = self.offline_queue[0]["sequence"]
            last_seq = self.offline_queue[-1]["sequence"]

            for q_rec in self.offline_queue:
                rec_db = TelemetryRecord(
                    device_id=q_rec["device_id"],
                    shipment_id=q_rec["shipment_id"],
                    sequence=q_rec["sequence"],
                    timestamp=datetime.fromisoformat(q_rec["timestamp"]),
                    temperature=q_rec["temperature"],
                    humidity=q_rec["humidity"],
                    gas_ethylene=q_rec["gas_ethylene"],
                    latitude=q_rec["latitude"],
                    longitude=q_rec["longitude"],
                    battery=q_rec["battery"],
                    solar_power_mw=q_rec["solar_power_mw"],
                    network_state="online",
                    sync_state="synced", # Transition from queued -> synced
                    previous_hash=q_rec["previous_hash"],
                    record_hash=q_rec["record_hash"],
                    signature=q_rec["signature"],
                    integrity_status="verified",
                    lifecycle_state="verified"
                )
                db.add(rec_db)
                self._check_and_create_alerts(db, q_rec)

            # Mark any open sequence gaps covered by this batch as FILLED
            open_gaps = db.query(SequenceGap).filter(
                SequenceGap.device_id == self.device_id,
                SequenceGap.status == "OPEN"
            ).all()
            for gap in open_gaps:
                if first_seq <= gap.expected_sequence and last_seq >= gap.expected_sequence:
                    gap.status = "FILLED"
                    gap.resolved_at = datetime.utcnow()

            # Record Sync Recovery Event
            evt = ShipmentEvent(
                shipment_id=self.shipment_id,
                event_type="OFFLINE_RESYNC",
                title=f"MQTT Batch Sync: {synced_count} Records Flushed",
                description=f"Batch (seq #{first_seq} to #{last_seq}) uploaded and verified. Zero data loss during outage.",
                location_name="Reconnected Cellular Mast",
                latitude=self.current_lat,
                longitude=self.current_lon,
                timestamp=datetime.utcnow(),
                severity="success"
            )
            db.add(evt)
            
            # Switch back to online
            self.is_network_online = True
            dev = db.query(Device).filter(Device.id == self.device_id).first()
            if dev:
                dev.status = "online"
                dev.last_seen = datetime.utcnow()

            db.commit()
            self.offline_queue.clear()
            self._save_persistent_queue()
        finally:
            db.close()

        return {
            "status": "success",
            "message": f"Successfully synced {synced_count} records via MQTT/TLS",
            "synced_count": synced_count,
            "sequence_range": f"#{first_seq} - #{last_seq}"
        }

    def inject_gas_spike(self, value: float = 64.2) -> Dict[str, Any]:
        """Injects high ethylene/gas anomaly."""
        reading = self.generate_single_reading(force_gas=value)
        db = SessionLocal()
        try:
            rec_db = TelemetryRecord(
                device_id=reading["device_id"],
                shipment_id=reading["shipment_id"],
                sequence=reading["sequence"],
                timestamp=datetime.fromisoformat(reading["timestamp"]),
                temperature=reading["temperature"],
                humidity=reading["humidity"],
                gas_ethylene=reading["gas_ethylene"],
                latitude=reading["latitude"],
                longitude=reading["longitude"],
                battery=reading["battery"],
                solar_power_mw=reading["solar_power_mw"],
                network_state="online",
                sync_state="live",
                previous_hash=reading["previous_hash"],
                record_hash=reading["record_hash"],
                signature=reading["signature"],
                integrity_status="verified"
            )
            db.add(rec_db)
            
            alert = Alert(
                shipment_id=self.shipment_id,
                device_id=self.device_id,
                alert_type="GAS_ALERT",
                severity="CRITICAL",
                title="GAS_ALERT",
                message=f"Device: {self.device_id} · Shipment: {self.shipment_id} · Value: {value} ppm · Threshold: gasLevel > 50",
                observed_value=f"{value} ppm",
                threshold_value="gasLevel > 50",
                status="OPEN",
                created_at=datetime.utcnow()
            )
            db.add(alert)
            
            evt = ShipmentEvent(
                shipment_id=self.shipment_id,
                event_type="EXCURSION",
                title=f"Critical Gas/Ethylene Spike ({value} ppm)",
                description=f"Rapid ethylene accumulation indicates fruit ripening/spoilage. Threshold 50 ppm breached.",
                location_name="Transit Highway Section",
                latitude=self.current_lat,
                longitude=self.current_lon,
                timestamp=datetime.utcnow(),
                severity="critical"
            )
            db.add(evt)
            db.commit()
        finally:
            db.close()

        return {"status": "injected", "type": "GAS_ALERT", "value": value}

    def inject_temp_excursion(self, value: float = 34.2) -> Dict[str, Any]:
        """Injects high temperature excursion."""
        reading = self.generate_single_reading(force_temp=value)
        db = SessionLocal()
        try:
            rec_db = TelemetryRecord(
                device_id=reading["device_id"],
                shipment_id=reading["shipment_id"],
                sequence=reading["sequence"],
                timestamp=datetime.fromisoformat(reading["timestamp"]),
                temperature=reading["temperature"],
                humidity=reading["humidity"],
                gas_ethylene=reading["gas_ethylene"],
                latitude=reading["latitude"],
                longitude=reading["longitude"],
                battery=reading["battery"],
                solar_power_mw=reading["solar_power_mw"],
                network_state="online",
                sync_state="live",
                previous_hash=reading["previous_hash"],
                record_hash=reading["record_hash"],
                signature=reading["signature"],
                integrity_status="verified"
            )
            db.add(rec_db)
            
            alert = Alert(
                shipment_id=self.shipment_id,
                device_id=self.device_id,
                alert_type="HIGH_TEMP",
                severity="CRITICAL",
                title="HIGH_TEMP",
                message=f"Device: {self.device_id} · Shipment: {self.shipment_id} · Value: {value} °C · Threshold: temperature > 28",
                observed_value=f"{value} °C",
                threshold_value="temperature > 28",
                status="OPEN",
                created_at=datetime.utcnow()
            )
            db.add(alert)
            
            evt = ShipmentEvent(
                shipment_id=self.shipment_id,
                event_type="EXCURSION",
                title=f"Reefer Cooling Failure ({value} °C)",
                description=f"Cargo temperature elevated beyond safe cold chain limit (8°C). Compressor trip suspected.",
                location_name="Transit Highway Section",
                latitude=self.current_lat,
                longitude=self.current_lon,
                timestamp=datetime.utcnow(),
                severity="critical"
            )
            db.add(evt)
            db.commit()
        finally:
            db.close()

        return {"status": "injected", "type": "HIGH_TEMP", "value": value}

    def trigger_tamper_event(self) -> Dict[str, Any]:
        """Simulates physical box lid opened / sensor disconnect."""
        db = SessionLocal()
        try:
            alert = Alert(
                shipment_id=self.shipment_id,
                device_id=self.device_id,
                alert_type="TAMPER_DETECTED",
                severity="CRITICAL",
                title="TAMPER_DETECTED",
                message=f"Optical reed sensor opened. Physical container breach detected outside authorized checkpoint.",
                observed_value="LID_OPENED",
                threshold_value="lid_state == CLOSED",
                status="OPEN",
                created_at=datetime.utcnow()
            )
            db.add(alert)
            
            evt = ShipmentEvent(
                shipment_id=self.shipment_id,
                event_type="EXCURSION",
                title="Physical Tamper Alert: Enclosure Breach",
                description="Node tamper switch tripped. Cryptographic security flag asserted in firmware.",
                location_name="Transit Highway Section",
                latitude=self.current_lat,
                longitude=self.current_lon,
                timestamp=datetime.utcnow(),
                severity="critical"
            )
            db.add(evt)
            db.commit()
        finally:
            db.close()

        return {"status": "tamper_asserted", "type": "TAMPER_DETECTED"}

    def anchor_to_blockchain(self) -> Dict[str, Any]:
        """Builds Merkle Tree of current shipment telemetry and anchors on simulated decentralized ledger."""
        db = SessionLocal()
        try:
            records = db.query(TelemetryRecord).filter(
                TelemetryRecord.shipment_id == self.shipment_id
            ).order_by(TelemetryRecord.sequence.asc()).all()

            if not records:
                return {"status": "error", "message": "No telemetry records found to anchor"}

            leaf_hashes = [r.record_hash for r in records]
            merkle_root, _ = CryptoEngine.build_merkle_tree(leaf_hashes)
            
            # Generate simulated Hyperledger Fabric transaction ID
            random_tx = f"0x{CryptoEngine.canonical_json({'root': merkle_root, 't': datetime.utcnow().isoformat()})[:60]}"
            random_tx = "0x" + "".join(random.choices("0123456789abcdef", k=64))
            block_num = 18492000 + random.randint(100, 999)

            anchor = LedgerAnchor(
                shipment_id=self.shipment_id,
                batch_code="AG-2401",
                merkle_root=merkle_root,
                tx_hash=random_tx,
                block_number=block_num,
                network="Hyperledger Fabric (Channel: agrichannel, CC: agritrace_cc)",
                contract_address="agrichannel:agritrace_cc:v1.0",
                channel_id="agrichannel",
                chaincode_id="agritrace_cc",
                endorsement_peers="peer0.apeda-gov.krushi.net, peer0.farmer-coop.krushi.net, peer0.logistics.krushi.net",
                explorer_url=f"http://fabric-explorer.krushi.net/tx/{random_tx}",
                records_count=len(records),
                start_sequence=records[0].sequence,
                end_sequence=records[-1].sequence,
                anchored_at=datetime.utcnow(),
                verification_status="ANCHORED_VALID"
            )
            db.add(anchor)
            db.flush()

            # Transition all anchored telemetry records from verified -> anchored
            for r in records:
                r.lifecycle_state = "anchored"
                r.anchor_id = anchor.id

            evt = ShipmentEvent(
                shipment_id=self.shipment_id,
                event_type="CHECKPOINT",
                title=f"Decentralized Ledger Proof Anchored (Block #{block_num})",
                description=f"Merkle Root {merkle_root[:18]}... anchored to Hyperledger Fabric (agrichannel) with {len(records)} verified records.",
                location_name="Blockchain Trust Layer",
                latitude=self.current_lat,
                longitude=self.current_lon,
                timestamp=datetime.utcnow(),
                severity="success",
                hash_proof=merkle_root
            )
            db.add(evt)
            db.commit()

            return {
                "status": "anchored",
                "anchor_id": anchor.id,
                "merkle_root": merkle_root,
                "tx_hash": random_tx,
                "block_number": block_num,
                "records_count": len(records),
                "network": "Hyperledger Fabric (Channel: agrichannel, CC: agritrace_cc)",
                "contract_address": "agrichannel:agritrace_cc:v1.0",
                "channel_id": "agrichannel",
                "chaincode_id": "agritrace_cc",
                "endorsement_peers": "peer0.apeda-gov.krushi.net, peer0.farmer-coop.krushi.net, peer0.logistics.krushi.net",
                "explorer_url": f"http://fabric-explorer.krushi.net/tx/{random_tx}"
            }
        finally:
            db.close()

    def _check_and_create_alerts(self, db, reading: Dict[str, Any]):
        """Evaluates thresholds and creates alerts if exceeded."""
        if reading["gas_ethylene"] > 50.0:
            existing = db.query(Alert).filter(
                Alert.shipment_id == self.shipment_id,
                Alert.alert_type == "GAS_ALERT",
                Alert.status == "OPEN"
            ).first()
            if not existing:
                db.add(Alert(
                    shipment_id=self.shipment_id,
                    device_id=self.device_id,
                    alert_type="GAS_ALERT",
                    severity="CRITICAL",
                    title="GAS_ALERT",
                    message=f"Device: {self.device_id} · Shipment: {self.shipment_id} · Value: {reading['gas_ethylene']} · Threshold: gasLevel > 50",
                    observed_value=f"{reading['gas_ethylene']} ppm",
                    threshold_value="gasLevel > 50",
                    status="OPEN"
                ))

        if reading["temperature"] > 28.0:
            existing = db.query(Alert).filter(
                Alert.shipment_id == self.shipment_id,
                Alert.alert_type == "HIGH_TEMP",
                Alert.status == "OPEN"
            ).first()
            if not existing:
                db.add(Alert(
                    shipment_id=self.shipment_id,
                    device_id=self.device_id,
                    alert_type="HIGH_TEMP",
                    severity="CRITICAL",
                    title="HIGH_TEMP",
                    message=f"Device: {self.device_id} · Shipment: {self.shipment_id} · Value: {reading['temperature']} · Threshold: temperature > 28",
                    observed_value=f"{reading['temperature']} °C",
                    threshold_value="temperature > 28",
                    status="OPEN"
                ))

simulator_instance = IoTSimulator()
