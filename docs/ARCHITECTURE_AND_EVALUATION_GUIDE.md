# AgriTrace — Architecture & SIH Evaluation Guide
**SIH Problem Statement 26232 | Ministry of Food Processing Industries (MoFPI)**  
*Theme: Agriculture, FoodTech & Rural Development*  
*Hardware & Software Integrated Solution*

---

## 1. Compliance Matrix Against SIH26232 Requirements

| SIH26232 Requirement | AgriTrace Architecture | Implementation File / Evidence |
| :--- | :--- | :--- |
| **1. Low-Cost Hardware Node** | Target BOM < ₹3,500 ($42 USD) utilizing commodity ESP32/STM32 MCU, low-drift sensors, and cellular GNSS. | Edge Hardware BOM Specification (Section 2 below) |
| **2. Rugged Industrial Enclosure** | IP67-rated enclosure, anti-vibration shock mounts, waterproof M8/M12 connectors for reefer environments. | Enclosure mechanical specs & operational tolerances |
| **3. Environmental Telemetry** | High-precision temperature ($\pm 0.3^\circ\text{C}$), humidity ($\pm 2\%$), and ethylene gas ($C_2H_4$) monitoring. | `models.py` (`TelemetryRecord`), `simulator.py` |
| **4. Offline-First Continuity** | Non-volatile circular flash buffer with monotonic sequence counter ($Seq_i$) to prevent gaps during rural transit. | `simulator.py` (`IoTSimulator.offline_queue`, sequence enforcement) |
| **5. Cryptographic Storage** | Deterministic canonical serialization + recursive SHA-256 hash chaining ($H_i = \text{SHA256}(\dots, H_{i-1})$). | `backend/crypto_engine.py` (`CryptoEngine.verify_hash_chain`) |
| **6. Auto-Sync Reconnection** | Lightweight MQTT burst transmission with idempotent deduplication upon cellular reacquisition. | `main.py` (`/api/v1/simulation/batch-sync`), `SimulationBar.tsx` |
| **7. Decentralized Ledger Anchoring**| Periodic Merkle tree batching anchored to EVM/Polygon zkEVM smart contract to eliminate raw gas costs. | `backend/crypto_engine.py` (`build_merkle_tree`), `models.py` (`LedgerAnchor`) |
| **8. Energy Harvesting & Battery** | Solar photovoltaic trickle charger paired with 3.2V LiFePO4 cells to sustain multi-day routes autonomously. | `simulator.py` (solar power model), `TruckOverlay.tsx` (solar monitor) |
| **9. Truck Compartment Visualization**| Multi-zone reefer cargo visualization isolating temperature anomalies to physical compartments. | `frontend/src/components/TruckOverlay.tsx` |
| **10. Downstream Consumer QR** | Instant scan certificate delivering provenance, GI-tag details, cold-chain compliance, and blockchain TX hash. | `frontend/src/components/ConsumerVerifyView.tsx`, `TraceabilityView.tsx` |

---

## 2. Low-Cost Edge Hardware Node Architecture & BOM

To satisfy the low-cost constraint of smallholder farmers and SME agricultural cooperatives, the physical AgriTrace node is designed around high-reliability, low-cost components:

```
+-----------------------------------------------------------------------+
|                        AgriTrace Edge Node                            |
|                                                                       |
|   +-----------------------+         +-------------------------------+ |
|   | Solar Panel (5V 2W)   |         | SHT31 / DHT22 (Temp & Hum)    | |
|   | & CN3065 Solar Charger| ------> | Winsen ZE03 / MQ-137 (Ethylene)| |
|   | + LiFePO4 3200mAh Cell|         | NEO-6M / SIM7600 (GPS/GNSS)   | |
|   +-----------------------+         +-------------------------------+ |
|               |                                     |                 |
|               v                                     v                 |
|   +-----------------------------------------------------------------+ |
|   |         Dual-Core ESP32-WROOM-32 / STM32F4 (160MHz)              | |
|   |  - Hardware Cryptographic Accelerator (SHA-256 in silicon)       | |
|   |  - Deep-Sleep Power Optimization (~15µA in sleep mode)          | |
|   |  - W25Q64 64Mbit SPI NOR Flash (Holds up to 100,000 records)   | |
|   +-----------------------------------------------------------------+ |
|               |                                                       |
|               +-----------------------+                               |
|                                       v                               |
|                       +-------------------------------+               |
|                       | SIM7600E-H LTE / 2G Fallback  |               |
|                       | (MQTT over TLS with Keep-Alive)|               |
|                       +-------------------------------+               |
+-----------------------------------------------------------------------+
```

### Estimated Bill of Materials (BOM) in Production (1,000+ units)

| Component | Part / Model | Approx. Cost (INR) | Role |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32D | ₹240 | Core MCU, hardware SHA-256 acceleration |
| **Temp & Humidity** | Sensirion SHT31 (I2C) | ₹180 | Industrial-grade cold chain temperature accuracy |
| **Ethylene Gas Sensor** | Winsen ZE03-C2H4 Electrochemical | ₹850 | Detects spoilage & premature fruit ripening |
| **GNSS & Cellular** | SIM7600E-H (4G LTE + GPS) | ₹1,450 | Dual cellular data and location tracking |
| **Cryptographic Flash** | Winbond W25Q64 SPI Flash (8MB) | ₹45 | Non-volatile offline store for 100k+ records |
| **Power Management** | CN3065 Solar IC + TP4056 | ₹60 | Photovoltaic battery management circuit |
| **Battery Cell** | 3.2V 3200mAh LiFePO4 | ₹260 | High thermal stability & safety in trucks |
| **Enclosure & Mounts** | IP67 UV-stabilized Polycarbonate | ₹210 | Dust, shock, and washdown protection |
| **Total Estimated BOM** | — | **₹3,295 (~$39.50)** | **Well within SME adoption targets** |

---

## 3. Cryptographic Protocol & Data Integrity Model

### Monotonic Sequence Guarantee
Every node maintains a hardware counter $i$. For any record $R_i$, its sequence must satisfy:
$$Seq(R_i) = Seq(R_{i-1}) + 1$$
If a malicious driver disconnects the device to hide an air conditioning shutdown, the subsequent upload will either:
1. Show a gap in timestamps between consecutive sequences (exposing the outage period), or
2. Fail sequence validation if simulated data is artificially injected without correct incrementation.

### Recursive SHA-256 Hash Chain
The record hash is calculated over canonical JSON:
$$H_i = \text{SHA256}\Big(\text{Canonical}\big(Dev, Shp, Seq_i, Ts_i, Temp_i, Hum_i, Gas_i, Lat_i, Lon_i, Batt_i, H_{i-1}\big)\Big)$$

Where:
- $H_0$ is the genesis constant.
- $H_{i-1}$ is the exact cryptographic hash of the immediate predecessor.

### Merkle Tree Proof Aggregation
To anchor $N$ telemetry samples to the blockchain without paying $N \times \text{gas fees}$, AgriTrace groups samples into a binary Merkle tree:
```
                     [ Merkle Root ]  <--- Anchored on Polygon zkEVM
                         /      \
               [ Node 1-2 ]    [ Node 3-4 ]
                 /      \        /      \
             [ H1 ]    [ H2 ]  [ H3 ]   [ H4 ]
```
Any individual record $H_k$ can be proven to belong to the anchored shipment using a Merkle audit path of size $\log_2(N)$ hashes.

---

## 4. End-to-End Demonstration Script for SIH Judges

When presenting to evaluators, follow this structured 5-minute demonstration script:

### Step 1: The Problem & Live Monitoring (1 min)
1. Open the AgriTrace Dashboard at `http://localhost:5173/`.
2. Highlight the active shipment: **GI-Tagged Ratnagiri Alphonso Mangoes** traveling from Ratnagiri Agri Cooperative to JNPT Cold Export Terminal.
3. Show the **Truck-Centric Compartment Overlay**: point out how Compartment A (reefer) has live temperature ($4.2^\circ\text{C}$), humidity ($78\%$), ethylene ($13.5\text{ ppm}$), battery ($94.5\%$), and solar charging ($320\text{ mW}$).

### Step 2: Demonstrating Offline-First Resilience (1.5 mins)
1. **Explain the challenge**: *"Trucks traveling through the Western Ghats frequently lose 4G connectivity for hours."*
2. Click **`Go Offline`** in the top simulation bar.
3. Show the status change: **Offline / Queuing**.
4. Click **`Tick +1 Sample`** 3–4 times.
5. Highlight that the sample sequence increments monotonically ($51 \to 52 \to 53$), hashes remain chained, and records are held safely in the edge flash buffer.
6. Click **`Go Online`** to simulate re-entering a cellular zone.
7. Click **`MQTT Burst Sync`**. Notice how all queued samples are instantly ingested and plotted on the chart with zero loss.

### Step 3: Simulating Spoilage & Excursion Injections (1 min)
1. Click **`Inject Gas Spike (64.8 ppm)`** or **`Inject Temp Spike (33.5°C)`**.
2. Immediately point out:
   * The **Critical Alert** banner is created with sound and color.
   * The truck compartment flashes **red**, alerting the logistics operator to a cooling failure or ripening outbreak.
   * The event is permanently logged into the immutable shipment history.

### Step 4: Cryptographic Tamper Detection Demo (1 min)
1. Ask the judge: *"What if an operator or malicious party tampers with the database to erase an excursion?"*
2. Click **`Corrupt Hash (Tamper)`**. This alters a byte in the database.
3. Navigate to the **Traceability** tab.
4. Click **`Audit Proof Chain`**.
5. Show how the engine instantly detects the broken link, displays **`Integrity Mismatch`**, and highlights the exact sequence where the tampering occurred.

### Step 5: Blockchain Anchor & Consumer QR Verification (30 secs)
1. Click **`Anchor to Ledger`**. Show the derived **Merkle Root** and generated smart contract transaction hash (`0x7f4b...`).
2. Click **`Generate Consumer QR`** (or open the **Consumer Provenance View**).
3. Display the transparency certificate that downstream buyers or end consumers scan to verify origin, cold-chain compliance score, and blockchain validity.

---

## 5. Frequently Asked Questions (FAQ) for Jury Defense

**Q1: Why not upload every sensor reading directly to the blockchain?**  
*Answer:* Writing high-frequency IoT data (e.g. every 60 seconds) directly on-chain is cost-prohibitive, slow, and causes blockchain bloat. AgriTrace uses a Layer-2/Rollup architecture: telemetry records are locally hashed into a tamper-proof cryptographic chain, and periodically batched into a **Merkle Tree**. Only the cryptographic Merkle Root is anchored on-chain, reducing transaction costs by $99.9\%$ while maintaining 100% mathematical verifiability.

**Q2: How does the system prevent replay or spoofing attacks from rogue devices?**  
*Answer:* Each IoT node has a hardware-embedded cryptographic key pair. Every telemetry packet contains a monotonic sequence number, GPS coordinates, timestamp, and a digital signature generated by the device's private key. The backend validates signature authenticity and strictly enforces sequence order ($Seq_i = Seq_{i-1} + 1$).

**Q3: How does the node survive long journeys with intermittent power?**  
*Answer:* The node combines ultra-low-power deep sleep states ($\sim 15\mu\text{A}$) between sampling intervals with an integrated solar photovoltaic charging circuit and stable LiFePO4 chemistry. This allows the node to operate indefinitely in typical daylight conditions without draining the truck's battery.
