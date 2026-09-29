"""
AgriTrace Backend - Database Engine and Models
SIH Problem Statement 26232: Offline-First IoT & Blockchain-Enabled Farm-to-Fork Traceability
"""

import json
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, Float, String, Boolean, DateTime, Text, ForeignKey, desc
import os
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from pydantic import BaseModel, Field

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "agritrace.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ================= DATABASE MODELS =================

class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True, index=True) # e.g. AGRITRACE-001
    serial_number = Column(String, unique=True, index=True)
    firmware_version = Column(String, default="v2.4.1-sih")
    public_key = Column(String, default="04a8b72f10c8e39d885a12...")
    battery_level = Column(Float, default=94.5)
    solar_harvesting = Column(Boolean, default=True)
    charging_state = Column(String, default="harvesting_active")
    signal_strength = Column(Integer, default=-68) # dBm
    status = Column(String, default="online") # online, offline, syncing, tamper
    last_seen = Column(DateTime, default=datetime.utcnow)
    current_shipment_id = Column(String, nullable=True)

class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(String, primary_key=True, index=True) # e.g. SHP-2026-0891
    shipment_code = Column(String, unique=True, index=True)
    product_name = Column(String) # e.g. Organic Alphonso Mangoes (Export Grade A)
    batch_code = Column(String) # e.g. AG-2401
    compartment_label = Column(String, default="Compartment A (Forward Cold Cell)")
    origin = Column(String) # e.g. Ratnagiri Orchards, Maharashtra
    destination = Column(String) # e.g. JNPT Cold Port Terminal, Mumbai
    carrier = Column(String, default="KisanCold Logistics Ltd.")
    truck_plate = Column(String, default="MH-04-AZ-8892")
    driver_name = Column(String, default="Rajesh Shinde")
    driver_phone = Column(String, default="+91 98201 44512")
    status = Column(String, default="IN_TRANSIT") # CREATED, DEVICE_ASSIGNED, IN_TRANSIT, DELIVERED, EXCEPTION
    created_at = Column(DateTime, default=datetime.utcnow)
    estimated_delivery = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    device_id = Column(String, ForeignKey("devices.id"), nullable=True)
    
    # Configurable Environmental Thresholds
    min_temp = Column(Float, default=2.0)
    max_temp = Column(Float, default=8.0)
    max_humidity = Column(Float, default=85.0)
    max_gas_ethylene = Column(Float, default=50.0) # ppm

class TelemetryRecord(Base):
    __tablename__ = "telemetry"
    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String, ForeignKey("devices.id"), index=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True)
    sequence = Column(Integer, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    temperature = Column(Float)
    humidity = Column(Float)
    gas_ethylene = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    battery = Column(Float)
    solar_power_mw = Column(Float, default=320.0)
    network_state = Column(String, default="online") # online, offline
    sync_state = Column(String, default="live") # live, queued, syncing, synced, failed
    previous_hash = Column(String)
    record_hash = Column(String, index=True)
    signature = Column(String)
    integrity_status = Column(String, default="verified") # verified, pending, failed

class ShipmentEvent(Base):
    __tablename__ = "shipment_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True)
    event_type = Column(String) # CREATED, ASSIGNED, DEPARTURE, EXCURSION, OFFLINE_ENTER, OFFLINE_RESYNC, CHECKPOINT, INTAKE_VERIFIED
    title = Column(String)
    description = Column(String)
    location_name = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String, default="info") # info, warning, critical, success
    hash_proof = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True)
    device_id = Column(String, ForeignKey("devices.id"), index=True)
    alert_type = Column(String) # HIGH_TEMP, GAS_ALERT, DEVICE_OFFLINE, TAMPER_DETECTED, INTEGRITY_FAILED, LOW_BATTERY
    severity = Column(String) # CRITICAL, WARNING, INFO
    title = Column(String)
    message = Column(String)
    observed_value = Column(String)
    threshold_value = Column(String)
    status = Column(String, default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

class LedgerAnchor(Base):
    __tablename__ = "ledger_anchors"
    id = Column(Integer, primary_key=True, autoincrement=True)
    shipment_id = Column(String, ForeignKey("shipments.id"), index=True)
    batch_code = Column(String)
    merkle_root = Column(String, unique=True)
    tx_hash = Column(String, unique=True)
    block_number = Column(Integer)
    network = Column(String, default="Polygon zkEVM / AgriChain Testnet")
    records_count = Column(Integer)
    start_sequence = Column(Integer)
    end_sequence = Column(Integer)
    anchored_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(String, default="ANCHORED_VALID")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
