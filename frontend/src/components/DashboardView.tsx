import React from 'react';
import { 
  Truck, 
  Radio, 
  AlertTriangle, 
  CheckCircle2,
  ShieldCheck, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Sun,
  Database,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Shipment, TelemetryRecord, Alert, Device } from '../types';

interface DashboardViewProps {
  shipments: Shipment[];
  devices: Device[];
  alerts: Alert[];
  latestTelemetry?: TelemetryRecord;
  onSelectShipment: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  shipments,
  devices,
  alerts,
  latestTelemetry,
  onSelectShipment,
  onNavigateTab
}) => {
  const activeShipment = shipments[0];
  const openAlerts = alerts.filter(a => a.status === 'OPEN');
  const onlineDevices = devices.filter(d => d.status === 'online');

  // Highway Route Waypoints for the Route Map Graphic
  const waypoints = [
    { name: 'Ratnagiri Orchards', status: 'completed', time: '11:00 AM' },
    { name: 'Chiplun Cold Hub', status: 'completed', time: '01:30 PM' },
    { name: 'Khed Pass (Blindspot Sync)', status: 'completed', time: '02:45 PM' },
    { name: 'Mangaon Toll', status: 'completed', time: '03:40 PM' },
    { name: 'Panvel Expressway', status: 'active', time: 'Live Now' },
    { name: 'JNPT Cold Port, Mumbai', status: 'pending', time: '06:00 PM (ETA)' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Fleet KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Active Shipments */}
        <div 
          onClick={() => onNavigateTab('shipments')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Cargo</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-['Outfit'] mt-2">{shipments.length}</div>
          <span className="text-[11px] text-teal-600 font-semibold mt-1 block">100% In-Transit Coverage</span>
        </div>

        {/* Devices Online */}
        <div 
          onClick={() => onNavigateTab('devices')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IoT Nodes Online</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-['Outfit'] mt-2">{onlineDevices.length} / {devices.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">ESP32-S3 Mesh Active</span>
        </div>

        {/* Open Alerts */}
        <div 
          onClick={() => onNavigateTab('alerts')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Exceptions</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center group-hover:scale-110 transition ${
              openAlerts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {openAlerts.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-['Outfit'] mt-2 ${
            openAlerts.length > 0 ? 'text-rose-600' : 'text-slate-800'
          }`}>{openAlerts.length}</div>
          <span className={`text-[11px] font-semibold mt-1 block ${
            openAlerts.length > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {openAlerts.length > 0 ? 'Requires Food Safety Review' : 'All Shipments Safe · Normal'}
          </span>
        </div>

        {/* Offline Queue */}
        <div 
          onClick={() => onNavigateTab('monitoring')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offline Sync Health</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-['Outfit'] mt-2">100%</div>
          <span className="text-[11px] text-blue-600 font-semibold mt-1 block">Zero Outage Loss</span>
        </div>

        {/* Blockchain Anchors */}
        <div 
          onClick={() => onNavigateTab('traceability')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">zkEVM Proofs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-['Outfit'] mt-2">Verified</div>
          <span className="text-[11px] text-purple-600 font-semibold mt-1 block">Polygon zkEVM Anchor</span>
        </div>

      </div>

      {/* Row 2: Live Route Transit Map & Primary Cargo Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Transit Route Visualizer (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">Active Reefer Transit Corridors</h3>
              <p className="text-xs text-slate-500">Live GPS telemetry and rural connectivity blindzone coverage</p>
            </div>
            <button 
              onClick={() => onNavigateTab('monitoring')}
              className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition"
            >
              <span>View Truck Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Graphical Highway Route Waypoints */}
          <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-4">
              <span className="font-bold text-slate-700">Route: NH-66 Coastal Agri Corridor (Ratnagiri → JNPT Mumbai)</span>
              <span className="font-mono text-teal-700 font-semibold">GPS: 19.0760° N, 72.9982° E</span>
            </div>

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
              {/* Connecting line */}
              <div className="hidden md:block absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

              {waypoints.map((wp, idx) => (
                <div key={wp.name} className="relative z-10 flex md:flex-col items-center gap-2 md:text-center w-full md:w-28">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-xs ${
                    wp.status === 'completed'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : wp.status === 'active'
                      ? 'bg-teal-600 border-teal-600 text-white ring-4 ring-teal-200 animate-pulse'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800 leading-tight">{wp.name}</h5>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{wp.time}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Harvest Gate Origin</span>
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ml-2" />
                <span>Active Truck Location</span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 ml-2" />
                <span>Destination Port Dock</span>
              </div>
              <span className="text-slate-600 font-medium">Estimated Arrival: <strong>2h 15m remaining</strong></span>
            </div>
          </div>

          {/* Quick Active Shipments List */}
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Shipments In Transit</h4>
            {shipments.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectShipment(s.id);
                  onNavigateTab('monitoring');
                }}
                className="bg-slate-50 hover:bg-teal-50/50 p-4 rounded-xl border border-slate-200 flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                    MH04
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{s.product_name}</h5>
                    <p className="text-xs text-slate-500 font-mono">
                      Batch: <span className="font-bold text-slate-700">{s.batch_code}</span> · {s.origin} → {s.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{s.latest_telemetry?.temperature.toFixed(1)}°C</span>
                    <span className="text-[10px] text-slate-400 block">{s.latest_telemetry?.gas_ethylene.toFixed(1)} ppm</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wider">
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right: Critical Alerts & Live Health Status (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Recent Alerts Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Critical Exceptions</h3>
              <button 
                onClick={() => onNavigateTab('alerts')}
                className="text-xs text-teal-600 font-bold hover:text-teal-700"
              >
                View All ({alerts.length})
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {openAlerts.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800">{a.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-rose-700 text-[11px] mt-1 line-clamp-2">{a.message}</p>
                </div>
              ))}

              {openAlerts.length === 0 && (
                <div className="py-5 px-4 text-center rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Zero Critical Exceptions</span>
                  <span className="text-[11px] text-emerald-700 mt-0.5">All monitored shipments within safe cold-chain limits</span>
                </div>
              )}
            </div>
          </div>

          {/* Offline-First Proof Feature Highlights */}
          {/* Offline-First Proof Feature Highlights */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Offline-First Trust Guarantees</h3>
                <span className="text-[10px] text-emerald-700 font-semibold tracking-wide uppercase">Cryptographic Safeguards</span>
              </div>
            </div>
            
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>Durable MicroSD/Flash local sequence preservation during 100% network blackout.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>Automatic burst batch sync over MQTT/TLS upon cell tower handover.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>SHA-256 hash chaining + Polygon zkEVM proof anchoring for independent audits.</span>
              </li>
            </ul>

            <button
              onClick={() => onNavigateTab('traceability')}
              className="w-full mt-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Open Traceability Verification
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
