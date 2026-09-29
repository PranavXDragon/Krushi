export interface TelemetryRecord {
  id: number;
  device_id: string;
  shipment_id: string;
  sequence: number;
  timestamp: string;
  temperature: number;
  humidity: number;
  gas_ethylene: number;
  latitude: number;
  longitude: number;
  battery: number;
  solar_power_mw: number;
  network_state: 'online' | 'offline';
  sync_state: 'live' | 'queued' | 'syncing' | 'synced' | 'failed';
  previous_hash: string;
  record_hash: string;
  signature: string;
  integrity_status: 'verified' | 'pending' | 'failed';
}

export interface Shipment {
  id: string;
  shipment_code: string;
  product_name: string;
  batch_code: string;
  compartment_label: string;
  origin: string;
  destination: string;
  carrier: string;
  truck_plate: string;
  driver_name: string;
  driver_phone: string;
  status: 'CREATED' | 'DEVICE_ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION';
  created_at: string;
  device_id?: string;
  thresholds: {
    min_temp: number;
    max_temp: number;
    max_humidity: number;
    max_gas_ethylene: number;
  };
  latest_telemetry: {
    temperature: number;
    humidity: number;
    gas_ethylene: number;
    battery: number;
    latitude: number;
    longitude: number;
    sync_state: string;
    integrity_status: string;
    timestamp: string;
  };
  open_alerts_count?: number;
}

export interface Device {
  id: string;
  serial_number: string;
  firmware_version: string;
  public_key: string;
  battery_level: number;
  solar_harvesting: boolean;
  charging_state: string;
  signal_strength: number;
  status: 'online' | 'offline' | 'syncing' | 'tamper';
  last_seen: string;
  current_shipment_id?: string;
}

export interface Alert {
  id: number;
  shipment_id: string;
  device_id: string;
  alert_type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  observed_value: string;
  threshold_value: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
}

export interface ShipmentEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  location_name: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  hash_proof?: string;
}

export interface LedgerAnchor {
  merkle_root: string;
  tx_hash: string;
  block_number: number;
  network: string;
  records_count?: number;
  anchored_at: string;
  status?: string;
}

export interface VerificationResult {
  shipment_id: string;
  is_chain_valid: boolean;
  verification_status: string;
  total_records_checked: number;
  calculated_merkle_root: string;
  anchors: LedgerAnchor[];
  latest_anchor?: LedgerAnchor;
  detailed_checks: Array<{
    sequence: number;
    recalculated_hash: string;
    stored_hash: string;
    previous_hash: string;
    expected_previous: string;
    is_valid: boolean;
  }>;
}

export interface AnalyticsData {
  kpis: {
    total_shipments: number;
    successful_deliveries: number;
    alert_free_shipments: number;
    average_delivery_time: string;
    device_uptime: string;
    active_now: number;
    open_alerts: number;
    resolved_alerts: number;
    devices_online: number;
    devices_offline: number;
    queued_records: number;
    verified_shipments: number;
  };
  shipments_per_week: Array<{ day: string; shipments: number }>;
  shipment_status_distribution: Record<string, number>;
  alerts_breakdown: Record<string, number>;
}

export interface QRData {
  shipment_id: string;
  verification_url: string;
  product_name: string;
  batch_code: string;
  origin: string;
  destination: string;
  harvest_date: string;
  cold_chain_compliance: string;
  merkle_root: string;
  blockchain_network: string;
  tx_hash: string;
  status: string;
}
