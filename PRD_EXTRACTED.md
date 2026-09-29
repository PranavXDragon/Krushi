AgriTrace

Offline-First IoT & Blockchain-Enabled Farm-to-Fork Traceability

Product Requirements Document (PRD)

SIH Problem Statement 26232 | Ministry of Food Processing Industries (MoFPI)

Document Item

Specification

Product

AgriTrace — Low-Cost IoT Blockchain Node & Farm-to-Fork Traceability Platform

SIH PS

SIH26232

Category

Hardware

Theme

Agriculture, FoodTech & Rural Development

Primary users

Farmers/aggregators, logistics operators, processors, quality teams, auditors, consumers

Document status

Implementation-ready product requirements

Reference UI

Provided AgriTrace Monitoring, Traceability, Alerts and Analytics screens

1. Executive Summary

AgriTrace is a low-cost, rugged, offline-first shipment traceability platform designed around SIH26232. The system combines an IoT sensor node with local cryptographic storage, intermittent network synchronization, MQTT-based messaging, a backend traceability service, and a decentralized-ledger anchoring/verification layer. The web dashboard provides a truck-centric operational view of food shipments and makes environmental telemetry, offline synchronization, alerts and data integrity visible to operators.

The central product principle is: sensor data must remain available and verifiable even when the shipment temporarily loses cellular connectivity. Data is therefore captured locally, sequenced, cryptographically protected, queued for sync, and automatically transmitted after connectivity returns. The ledger stores verifiable proofs/anchors rather than requiring every raw sensor sample to be placed directly on-chain.

1.1 Product Value Proposition

Affordable traceability for SMEs that cannot justify enterprise cold-chain hardware.

Offline-first operation for agricultural and rural routes with intermittent connectivity.

Tamper-evident telemetry using device-side cryptographic signing/hashing and chained records.

Automatic synchronization after reconnection using lightweight messaging.

Environmental monitoring for temperature, humidity and ethylene/gas, with GPS and device health telemetry.

Auditable farm-to-fork history with QR-based verification for downstream users.

Truck-centric visualization that maps each sensor/batch to a physical shipment compartment.

2. Problem Statement and Requirements Baseline

The supplied SIH26232 statement identifies two core market constraints: enterprise-grade traceability is expensive for SMEs, and standard loggers can lose connectivity in remote agricultural areas, producing blind spots. The expected solution explicitly requires a rugged, affordable, tamper-proof node; environmental logging; local cryptographic storage; energy harvesting; and automatic synchronization to a decentralized ledger after reconnection.

Requirement from PS

Product interpretation

Acceptance signal

Low-cost IoT node

Commodity MCU, sensors, cellular/GNSS, local storage and power management.

Prototype BOM stays within the team's target cost.

Rugged operation

Sealed enclosure, protected connectors, vibration-resistant mounting and environmental protection.

Node continues logging under representative moisture/dust/vibration tests.

Environmental logging

Temperature, humidity and ethylene/gas as core telemetry.

Timestamped readings are captured at configurable intervals.

Offline continuity

Local queue persists records when cellular/network is unavailable.

No sample loss across a controlled network outage.

Cryptographic storage

Signed/chained records and secure key storage where available.

Modified record fails verification.

Energy harvesting

Solar as primary practical prototype path; thermal harvesting as an optional extension.

Energy subsystem extends runtime and reports energy/battery state.

Lightweight sync

MQTT over TLS with batching and acknowledgements.

Queued records sync automatically after reconnection.

Decentralized ledger

Store/anchor verifiable hashes or Merkle roots; keep high-volume telemetry off-chain.

Dashboard can prove whether a record/batch matches its anchored proof.

3. Goals, Non-Goals and Success Metrics

3.1 Goals

Deliver an end-to-end demonstrable prototype from physical sensor node to dashboard.

Maintain data integrity during offline periods.

Provide real-time monitoring when connectivity is available.

Provide an explicit sync-state model: Live, Offline/Queued, Syncing, Synced, Verification Failed.

Make shipment events and environmental excursions easy to audit.

Keep the architecture modular enough to support different sensor and ledger implementations.

3.2 Non-Goals for MVP

Full national-scale logistics optimization.

Replacing regulated food-safety certification or laboratory testing.

Putting every high-frequency raw sensor reading directly on a blockchain.

Building a public marketplace or unrelated commerce module.

Advanced predictive shelf-life modeling as a mandatory MVP feature.

3.3 Suggested Success Metrics

Metric

Target for prototype

Measurement

Data continuity

100% of test samples retained through planned outage

Compare generated vs. received sequence numbers

Sync recovery

< 60 seconds after network recovery for a small queued batch

Device/backend timestamps

Integrity

100% of deliberately modified test records detected

Verification test suite

Dashboard freshness

< 5 seconds for connected telemetry

MQTT publish to UI timestamp

Duplicate prevention

No duplicate sequence IDs accepted

Backend idempotency checks

Alert latency

< 10 seconds under normal connectivity

Sensor event to UI alert

Traceability

Complete batch event timeline

Create → assign → transit → exception → delivery

4. Users and Roles

Role

Primary needs

Key permissions

Farmer / Aggregator

Create shipment, attach device, see shipment health

Create/manage own shipments and devices

Logistics Operator

Monitor active trucks and connectivity

View live telemetry, acknowledge operational alerts

Quality / Food Safety

Review excursions and evidence

View history, verification, reports and export

Processor / Receiver

Verify shipment integrity before intake

Scan QR, view provenance and integrity status

Auditor

Trace immutable event history

Read-only access to events, proofs and verification

System Admin

Fleet, thresholds, users and devices

Full configuration and device management

Consumer

Simple provenance and trust information

Public QR consumer view; no operational controls

5. Product Scope and Information Architecture

The supplied reference screens show an AgriTrace sidebar with operational modules. For the SIH26232 MVP, the navigation should be streamlined to the modules below.

Priority

Page

Purpose

P0

Dashboard

Fleet/shipment overview, live health, sync and critical exceptions.

P0

Shipments

Create, assign, track and review shipments.

P0

Devices

Register, provision, assign and monitor IoT nodes.

P0

Monitoring

Live environmental telemetry and truck-centric visualization.

P0

Traceability

Farm-to-fork event timeline, hashes, proofs and QR verification.

P0

Alerts

Environmental, device, tamper and sync exceptions.

P1

Analytics

Shipment/device trends and operational KPIs.

P1

Reports

Exportable audit/quality reports.

P1

Profile / Settings

User profile, thresholds, notification and organization settings.

External/Public

Consumer View

QR-accessible shipment provenance and integrity summary.

Remove Marketplace from the SIH MVP unless a separate business requirement is introduced. Consumer View should be reached through QR verification rather than being a primary operations sidebar destination.

6. UI/UX Product Requirements

6.1 Design Direction

Use the supplied AgriTrace visual language: dark navy left navigation, white/light-gray workspace, restrained teal/green accents, rounded cards and compact data density.

Keep the interface clean and operational; color should communicate state, not decorate every component.

Use consistent status colors: green = healthy/verified, amber = warning/pending, red = critical/failed, blue = informational/sync.

Every critical metric should expose its threshold or state where practical.

Use responsive layouts for laptop/tablet; the operational dashboard is desktop-first.

6.2 Global Shell

Persistent left sidebar with AgriTrace logo, primary navigation and collapse control.

Top bar with page title/subtitle, global search for shipments/devices/batches, notification icon and user profile.

Persistent status affordance for connectivity/sync when relevant.

Toast notifications for successful sync, QR creation, device assignment and critical errors.

6.3 Dashboard

KPI cards: Active Shipments, Devices Online, Devices Offline, Open Alerts, Pending Sync Records, Verified Shipments.

Live shipment map with truck markers and route status.

Compact critical-alert panel.

Offline queue/sync health card showing queued records and last successful sync.

Shipment status distribution and recent events.

6.4 Monitoring Page

Top warning banner when environmental values are outside configured safe ranges.

Metric cards for Temperature, Humidity, Gas/Ethylene and Battery.

Telemetry history table with timestamp, values, sequence number and source state.

Source badges must distinguish LIVE, OFFLINE QUEUED, SYNCED and VERIFIED where applicable.

Truck visualization is the primary shipment-centric monitoring surface.

Reference 1 — Monitoring screen supplied by the user.

6.5 Truck Shipment Visualization

Use the provided truck WebP as the visual base layer. Do not split the truck into separate images. Render compartment readings as HTML/React overlays positioned relative to the cargo body.

Overlay

Required fields

Interaction

Cargo block

Batch ID, temperature, humidity, ethylene/gas, integrity state

Click opens detailed shipment/device panel

Truck header

Shipment ID, origin, destination, current state

Click opens shipment

Connectivity

Wi-Fi/cellular state, last seen

Click opens device status

Battery

Battery %, charging/harvesting state

Click opens device health

GPS

Lat/long or readable location, timestamp

Click centers route/map

Alert badge

Active alert count/severity

Click filters alerts

Recommended cargo overlay pattern:

<div className="relative">  <img src="/assets/truck1.webp" className="w-full h-auto" alt="Shipment truck" />  <CargoContainer batch="AG-2401" temperature={4.2} humidity={78} ethylene={0.8} integrity="verified" />  <CargoContainer batch="AG-2402" temperature={5.1} humidity={81} ethylene={1.0} integrity="warning" /></div>

6.6 Traceability Page

Vertical event timeline: device assigned, shipment created, departure, telemetry exception, offline period, sync completed, delivery and verification.

Integrity panel showing current record hash, previous hash, sequence, verification result and ledger anchor.

QR code panel for shipment verification.

Record filtering by event type and time range.

A verification failure must be visually prominent and explain what failed without exposing secret keys.

Reference 2 — Traceability screen supplied by the user.

6.7 Alerts Page

Cards grouped by severity and status.

Alert types: HIGH_TEMP, TEMPERATURE_EXCURSION, HIGH_HUMIDITY, GAS_ALERT, DEVICE_OFFLINE, TAMPER_DETECTED, INTEGRITY_FAILED, SYNC_FAILED, LOW_BATTERY.

Actions: View Shipment, Acknowledge/Dismiss, Open Details.

Each alert includes device, shipment, observed value, threshold, timestamp and event/sequence reference.

Resolved alerts remain auditable.

Reference 3 — Alerts screen supplied by the user.

6.8 Analytics Page

Shipment volume trend.

Shipment status distribution.

Alert overview.

Device online/offline/uptime view.

Environmental excursion trend.

Average sync delay and offline duration.

Integrity verification success/failure counts.

Reference 4 — Analytics screen supplied by the user.

7. Functional Requirements

ID

Requirement

Description

FR-01

Authentication & roles

Users authenticate and receive role-scoped access.

FR-02

Shipment creation

Create shipment with origin, destination, product/batch, expected conditions and device.

FR-03

Device registration

Register a unique node ID and provision credentials.

FR-04

Device assignment

Associate a device with one active shipment at a time.

FR-05

Telemetry ingestion

Accept timestamped temperature, humidity, ethylene/gas, battery, GPS and connectivity data.

FR-06

Offline capture

Device stores readings locally when network is unavailable.

FR-07

Sequence integrity

Every telemetry record has monotonic device sequence number.

FR-08

Cryptographic protection

Records are signed/hashed and linked to the prior record.

FR-09

MQTT sync

Device publishes queued records securely after reconnecting.

FR-10

Idempotent ingestion

Backend rejects or safely ignores duplicate sequence IDs.

FR-11

Alert engine

Evaluate configurable thresholds and device conditions.

FR-12

Traceability events

Create auditable shipment lifecycle events.

FR-13

Ledger anchoring

Anchor batch/record proofs to a decentralized ledger.

FR-14

Verification

Recompute and verify hashes against stored proof/ledger anchor.

FR-15

QR verification

Generate a QR that opens a shipment verification view.

FR-16

Analytics

Aggregate shipment, device, alert and sync metrics.

FR-17

Reporting

Export traceability and excursion evidence.

FR-18

Audit log

Record user actions and system security events.

8. IoT Hardware & Firmware Requirements

8.1 Recommended Prototype Stack

Subsystem

Recommended technology

Role

MCU

ESP32-S3 / ESP32-class MCU

Low-power processing, connectivity and sensor orchestration

Temperature/Humidity

SHT31/SHTC3-class sensor

Environmental telemetry

Ethylene/Gas

Ethylene-capable sensor module appropriate to the prototype

Food maturity/spoilage-related gas signal

GNSS

u-blox-class GNSS module

Shipment location

Cellular

LTE Cat-1/Cat-1 bis or NB-IoT/LTE-M module depending on coverage

Wide-area connectivity

Local storage

Industrial microSD or flash

Offline telemetry queue

RTC

Low-power RTC

Stable timestamping during connectivity loss

Tamper

Lid/reed switch + optional accelerometer

Physical tamper and shock/vibration detection

Power

Li-ion/LiFePO4 battery + BMS

Primary energy storage

Energy harvesting

Solar panel + charge controller

Runtime extension

Security

Secure element where practical

Device identity/key protection

Enclosure

Rugged sealed enclosure

Dust/moisture/vibration protection

Exact sensor selection must be validated against the food/product type, required gas range, calibration needs and environmental conditions. The SIH statement establishes ethylene/gas monitoring as a requirement but does not prescribe a specific sensor model.

8.2 Firmware Responsibilities

Read sensors on a configurable interval.

Timestamp and sequence each sample.

Normalize/validate sensor values and attach quality flags.

Build a canonical telemetry record.

Hash/sign the record and link it to the previous record.

Persist the record before attempting network transmission.

Publish live telemetry when connected.

Queue unsent records during outage.

Retry with exponential backoff and batch uploads.

Report battery, charging/harvesting, signal and firmware state.

Detect tamper/open events and generate priority records.

Support secure configuration and firmware update strategy for production.

9. Offline-First & Synchronization Architecture

Offline-first is a primary product requirement, not an edge case.

Sensor → Validate → Sequence → Hash/Sign → Local Durable Queue                                   ↓                           Network Available?                              /           \                            No             Yes                            ↓               ↓                       Keep queued      MQTT/TLS batch                                            ↓                                      Backend ACK                                            ↓                                    Mark records synced                                            ↓                                  Ledger proof/anchor                                            ↓                                      UI verification

State

Meaning

UI treatment

LIVE

Record arrived directly from connected node.

Green LIVE badge

QUEUED

Record safely stored locally but not yet uploaded.

Amber offline badge

SYNCING

Queued records are being transmitted.

Blue sync indicator

SYNCED

Backend accepted the record.

Green/neutral synced state

VERIFIED

Cryptographic proof matches expected chain/anchor.

Green verification badge

FAILED

Integrity or synchronization failed.

Red alert + actionable details

9.1 MQTT Topic Design

agritrace/{deviceId}/telemetryagritrace/{deviceId}/eventsagritrace/{deviceId}/statusagritrace/{deviceId}/ackagritrace/{deviceId}/config

Use MQTT over TLS.

Use QoS appropriate to the criticality of telemetry; the prototype can use QoS 1 for delivery-at-least-once semantics.

Use message IDs/device sequence numbers for deduplication.

Never rely on MQTT delivery alone as the integrity mechanism; the record itself must be cryptographically protected.

10. Cryptographic Integrity Model

The integrity model should make a modified historical record detectable without storing sensitive private keys in the dashboard. A simple prototype can use a hash chain; production hardware should use a secure element or equivalent key-protection mechanism.

record_n = {  device_id,  shipment_id,  sequence,  timestamp,  temperature,  humidity,  ethylene,  latitude,  longitude,  battery,  previous_hash}record_hash = SHA-256(canonical(record_n))signature   = Sign(private_device_key, record_hash)

Canonical serialization must be deterministic so the same record produces the same digest.

The previous_hash field links records into a tamper-evident sequence.

The backend verifies sequence continuity and signature/hash before accepting a record.

Periodic Merkle roots or batch hashes can be anchored on-chain to reduce transaction cost.

The ledger should contain proof/anchor data, not secrets and not necessarily all raw telemetry.

11. Blockchain / Decentralized Ledger Layer

The dashboard requires a decentralized verification capability. For the MVP, the recommended pattern is off-chain telemetry with on-chain proof anchoring. This keeps high-frequency sensor traffic efficient while retaining verifiability.

Layer

Data

Reason

Device

Raw samples, local queue, hash/signature

Works offline and protects the source record

Backend DB

Telemetry, events, shipment metadata, hashes, sync state

Fast queries and dashboard analytics

Proof service

Batch hash/Merkle root and verification metadata

Build efficient integrity proofs

Ledger

Shipment/batch proof anchor, timestamp, reference

Independent tamper-evidence

Dashboard

Human-readable state and verification result

Operations and audit usability

The exact ledger/network choice is an implementation decision and should be finalized based on SIH judging requirements, deployment cost, transaction model, and available infrastructure. The PRD does not assume that a particular chain is mandatory.

12. Backend Architecture

IoT Node  │ MQTT/TLS  ▼MQTT Broker  │  ▼Ingestion Service ──► Validation ──► Integrity Verification  │                                      │  │                                      ├──► Alert Engine  │                                      ├──► Sync State  │                                      └──► Proof/Anchor Service  ▼PostgreSQL / Time-Series Storage  │  ├── REST API / WebSocket  ▼React Dashboard

12.1 Recommended Software Stack

Layer

Recommended stack

Responsibility

Frontend

React + TypeScript + Vite

Dashboard UI

Styling

Tailwind CSS

Design system/layout

Charts

Recharts or Apache ECharts

Telemetry/analytics

Maps

Mapbox GL JS or Google Maps

GPS/routes

Backend

FastAPI + Python

REST/WebSocket and business logic

MQTT

EMQX/Mosquitto or managed broker

Device messaging

Database

PostgreSQL + PostGIS; optional TimescaleDB

Transactional + telemetry + geospatial data

Cache/queue

Redis

Short-lived state, jobs, rate limiting

Blockchain

EVM-compatible or other SIH-approved decentralized ledger

Proof anchoring/verification

Storage

Object storage

Reports/exports/firmware/artifacts

Deployment

Docker + cloud VM/container platform

Reproducible deployment

13. Database Model

Entity

Key fields

users

id, organization_id, name, email, role, status

devices

id, serial_number, firmware_version, public_key, battery, signal, status, last_seen

shipments

id, shipment_code, product, batch_code, origin, destination, status, created_at

device_assignments

device_id, shipment_id, assigned_at, unassigned_at

telemetry

id, device_id, shipment_id, sequence, timestamp, temp, humidity, ethylene, lat, lon, battery, hash, signature, sync_state

shipment_events

id, shipment_id, event_type, timestamp, location, metadata, hash

alerts

id, shipment_id, device_id, type, severity, observed_value, threshold, status, created_at, resolved_at

ledger_anchors

id, shipment_id, root_hash, transaction_id, network, anchored_at, verification_status

sync_batches

id, device_id, first_sequence, last_sequence, count, status, started_at, completed_at

audit_logs

id, actor_id, action, target_type, target_id, timestamp, metadata

14. API Specification

Method

Endpoint

Purpose

POST

/api/v1/shipments

Create shipment

GET

/api/v1/shipments

List/filter shipments

GET

/api/v1/shipments/{id}

Shipment detail

POST

/api/v1/shipments/{id}/assign-device

Assign device

GET

/api/v1/devices

List devices

POST

/api/v1/devices

Register/provision device

GET

/api/v1/devices/{id}/telemetry

Telemetry history

GET

/api/v1/shipments/{id}/timeline

Traceability timeline

GET

/api/v1/shipments/{id}/verification

Integrity verification result

GET

/api/v1/alerts

Alert list

PATCH

/api/v1/alerts/{id}

Acknowledge/resolve alert

GET

/api/v1/analytics/overview

Dashboard KPI data

GET

/api/v1/shipments/{id}/qr

Generate/retrieve QR payload

POST

/api/v1/sync/telemetry

Batch sync endpoint for gateway/direct integration

Use WebSocket/SSE for live dashboard updates where appropriate; REST remains the system-of-record API for queries and administrative operations.

15. Alert & Rule Engine

Rule

Example

Severity

Temperature high

temperature > configured upper bound

Critical/Warning

Temperature low

temperature < configured lower bound

Warning

Humidity high/low

humidity outside product range

Warning

Gas/ethylene

ethylene/gas signal above threshold

Critical

Device offline

No heartbeat for configured interval

Warning

Tamper

Enclosure opened or unexpected movement

Critical

Low battery

Battery below configured percentage

Warning

Integrity failed

Signature/hash verification mismatch

Critical

Sequence gap

Unexpected missing sequence range

Critical/Warning

Sync failed

Repeated MQTT/backend acknowledgement failure

Warning

Thresholds must be configurable per product/batch because safe environmental ranges are product-dependent. The reference screen's example values should be treated as demo configuration, not universal food-safety limits.

16. QR / Consumer Verification

Each shipment receives a unique public verification identifier.

QR resolves to a public consumer/auditor page.

Show product/batch, origin, shipment dates, major checkpoints, environmental compliance summary and integrity status.

Do not expose device private keys, internal credentials, personal information or raw infrastructure secrets.

Verification page should explain whether the displayed history is verified, partially verified, pending synchronization or failed.

17. Security Requirements

TLS for MQTT and HTTPS for APIs.

Per-device identity and credential provisioning.

Private keys never stored in frontend code.

JWT/OAuth2-style session management with role-based authorization.

Server-side validation for all telemetry and administrative inputs.

Idempotency and sequence checks to prevent duplicate/replayed samples.

Rate limiting and broker ACLs per device/topic.

Secrets stored in a secret manager/environment configuration, never committed to source control.

Audit logs for user actions and integrity events.

Database backups and retention policy.

Signed firmware/update mechanism should be planned for production.

18. Performance & Reliability Requirements

Area

Requirement

Live telemetry

UI should reflect connected sensor updates within the agreed latency target.

Offline queue

No data loss during planned connectivity outages within device storage capacity.

Scalability

Backend must process batched telemetry without blocking dashboard queries.

Availability

Critical ingestion path should degrade gracefully if analytics/ledger services are temporarily unavailable.

Consistency

Shipment/device assignment must be transactional.

Observability

Logs, metrics and health checks for broker, API, DB, sync and ledger services.

Recovery

Queued data must resume automatically after reconnection.

19. Testing & Acceptance Plan

Test category

Key tests

Sensor

Accuracy sanity checks, invalid values, disconnected sensor behavior

Offline

Disable cellular/network, generate records, restore network, verify complete ordered sync

Integrity

Modify a stored record and confirm verification failure

Replay

Resend same sequence and confirm idempotent handling

Gap

Delete/drop one sequence and confirm gap detection

MQTT

Broker disconnect/reconnect, retained state, QoS behavior

Alerts

Cross thresholds, resolve condition, confirm alert lifecycle

GPS

Valid fix, unavailable fix, stale location

Battery

Low-battery warning and charging/harvesting state

Tamper

Open enclosure / trigger sensor and confirm alert

Blockchain

Anchor proof, verify proof, simulate mismatch

UI

Responsive layout, loading, empty, offline, error and permission states

Security

Unauthorized API calls, expired token, invalid signatures, malformed payloads

20. MVP Delivery Plan

Phase

Deliverables

Phase 1 — Foundation

Repo setup, design system, auth, PostgreSQL schema, device/shipment CRUD

Phase 2 — IoT

Sensor firmware, local queue, sequence/hash chain, device status

Phase 3 — Messaging

MQTT broker, secure ingestion, acknowledgements, sync state

Phase 4 — Monitoring

Monitoring page, telemetry history, truck overlay, GPS

Phase 5 — Alerts

Rule engine, alert UI, notifications and resolution flow

Phase 6 — Traceability

Event timeline, integrity verification, QR view

Phase 7 — Ledger

Proof batching, ledger anchoring, verification service

Phase 8 — Analytics

KPIs, charts, reports and operational metrics

Phase 9 — Hardening

Security, offline tests, hardware enclosure/power tests, demo rehearsal

21. Recommended Repository Structure

agritrace/├── apps/│   ├── web/                    # React + TypeScript dashboard│   └── api/                    # FastAPI backend├── firmware/│   └── node/                   # MCU firmware├── services/│   ├── ingestion/              # MQTT consumer / validation│   ├── alerts/                 # Rules and notifications│   ├── proof/                  # Hash/Merkle + ledger anchoring│   └── sync/                   # Batch synchronization jobs├── packages/│   ├── types/                  # Shared schemas/types│   └── crypto/                 # Canonicalization/integrity helpers├── infra/│   ├── docker/│   └── mqtt/├── docs/│   ├── architecture/│   ├── api/│   └── hardware/└── README.md

22. Key UI Data Contracts

TelemetryRecord {  deviceId: string  shipmentId: string  sequence: number  timestamp: string  temperatureC: number | null  humidityPct: number | null  ethylenePpm: number | null  latitude: number | null  longitude: number | null  batteryPct: number | null  network: "online" | "offline" | "unknown"  syncState: "live" | "queued" | "syncing" | "synced" | "failed"  integrity: "verified" | "pending" | "failed"}

23. Demo Scenario for SIH Presentation

Create a shipment for a food batch and assign an AgriTrace node.

Start the truck view with normal temperature, humidity and gas readings.

Show live GPS and battery/network state.

Intentionally disconnect cellular connectivity.

Continue generating sensor readings; the dashboard/device state changes to Offline/Queued.

Demonstrate that sequence numbers continue and data remains stored locally.

Reconnect the network.

Show automatic MQTT batch synchronization and transition from Queued → Syncing → Synced.

Generate a controlled temperature or gas excursion and show the Alerts page.

Show the traceability timeline recording the excursion and offline event.

Generate/verify the shipment QR.

Show cryptographic verification and ledger proof/anchor.

Open Analytics to show shipment, alert, device and synchronization metrics.

24. Risks and Mitigations

Risk

Impact

Mitigation

Poor cellular coverage

Delayed sync

Durable local queue + batch retry + store-and-forward

Sensor drift

False alerts

Calibration procedure + sensor health flags + product-specific thresholds

Battery depletion

Node stops logging

Solar harvesting + low-power firmware + battery alerts

Ledger outage

Proof delayed

Keep verified backend records and queue proof anchoring asynchronously

Duplicate messages

Duplicate telemetry

Device sequence IDs + backend idempotency

Tampering

Loss of trust

Secure keys + hash chain + tamper event + ledger anchor

Overloading blockchain

High cost/latency

Anchor batches/Merkle roots instead of raw telemetry

UI complexity

Poor operator usability

Truck-first visualization + concise cards + drill-down details

25. Open Decisions Before Hardware Freeze

Final ethylene/gas sensor and calibration method.

Final cellular technology based on target Indian deployment areas.

Exact energy-harvesting architecture and expected duty cycle.

Enclosure ingress-protection target and mechanical test plan.

Final decentralized ledger/network selected for the SIH demonstration.

Whether GNSS is always-on or duty-cycled based on movement.

Data retention period and sampling frequency per product class.

Exact environmental thresholds for each food category.

Production-grade secure element and device provisioning workflow.

26. Final Product Definition

AgriTrace is not merely a dashboard. The product is an end-to-end trust pipeline: the physical node captures evidence, the offline-first firmware preserves that evidence during connectivity loss, the MQTT/backend layer transports and validates it, the integrity layer makes modification detectable, the ledger provides independent proof anchoring, and the dashboard makes the result operationally understandable.

For the SIH26232 prototype, implementation should prioritize a convincing end-to-end demonstration over unnecessary feature breadth. The highest-value flow is a real sensor reading → offline storage → network interruption → automatic sync → alert/traceability event → cryptographic verification → ledger proof → truck-centric dashboard/QR verification.

Appendix A — Reference Asset Usage

Asset

Use in product

Provided Monitoring screenshot

Reference for environmental metric cards and telemetry history

Provided Traceability screenshot

Reference for event timeline, integrity panel and QR verification

Provided Alerts screenshot

Reference for severity-based alert cards and actions

Provided Analytics screenshot

Reference for KPI cards, charts and device/shipment status

Provided truck WebP

Primary visual asset for truck-centric shipment monitoring