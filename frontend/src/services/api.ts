const API_BASE = "http://localhost:8000/api/v1";

export const api = {
  // Shipments
  getShipments: async () => {
    const res = await fetch(`${API_BASE}/shipments`);
    return res.json();
  },
  getShipmentById: async (id: string) => {
    const res = await fetch(`${API_BASE}/shipments/${id}`);
    return res.json();
  },
  createShipment: async (payload: any) => {
    const res = await fetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Devices
  getDevices: async () => {
    const res = await fetch(`${API_BASE}/devices`);
    return res.json();
  },

  // Telemetry
  getTelemetry: async (shipmentId?: string, limit: number = 50) => {
    const url = shipmentId 
      ? `${API_BASE}/telemetry?shipment_id=${shipmentId}&limit=${limit}`
      : `${API_BASE}/telemetry?limit=${limit}`;
    const res = await fetch(url);
    return res.json();
  },

  // Alerts
  getAlerts: async (status?: string) => {
    const url = status ? `${API_BASE}/alerts?status=${status}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    return res.json();
  },
  updateAlert: async (alertId: number, status: string) => {
    const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Traceability & Verification
  getTimeline: async (shipmentId: string) => {
    const res = await fetch(`${API_BASE}/shipments/${shipmentId}/timeline`);
    return res.json();
  },
  getVerification: async (shipmentId: string) => {
    const res = await fetch(`${API_BASE}/shipments/${shipmentId}/verification`);
    return res.json();
  },
  getQRData: async (shipmentId: string) => {
    const res = await fetch(`${API_BASE}/shipments/${shipmentId}/qr`);
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    return res.json();
  },

  // Simulation Controls for SIH Demo
  simulationTick: async () => {
    const res = await fetch(`${API_BASE}/simulation/tick`, { method: 'POST' });
    return res.json();
  },
  toggleNetwork: async (online: boolean) => {
    const res = await fetch(`${API_BASE}/simulation/network-toggle?online=${online}`, { method: 'POST' });
    return res.json();
  },
  batchSync: async () => {
    const res = await fetch(`${API_BASE}/simulation/batch-sync`, { method: 'POST' });
    return res.json();
  },
  injectGasSpike: async (value: number = 64.5) => {
    const res = await fetch(`${API_BASE}/simulation/inject-gas-spike?value=${value}`, { method: 'POST' });
    return res.json();
  },
  injectTempSpike: async (value: number = 34.8) => {
    const res = await fetch(`${API_BASE}/simulation/inject-temp-spike?value=${value}`, { method: 'POST' });
    return res.json();
  },
  triggerTamper: async () => {
    const res = await fetch(`${API_BASE}/simulation/trigger-tamper`, { method: 'POST' });
    return res.json();
  },
  anchorBlockchain: async () => {
    const res = await fetch(`${API_BASE}/simulation/anchor-blockchain`, { method: 'POST' });
    return res.json();
  },
  corruptHashForAudit: async () => {
    const res = await fetch(`${API_BASE}/simulation/tamper-corrupt-hash`, { method: 'POST' });
    return res.json();
  },

  // User Authentication
  signUp: async (payload: { name: string; email: string; password: string; role?: string; phone?: string; organization?: string }) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Signup failed');
    }
    return data;
  },
  signIn: async (payload: { email: string; password: string }) => {
    const res = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password');
    }
    return data;
  },
  getMe: async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/me?email=${encodeURIComponent(email)}`);
    return res.json();
  }
};
