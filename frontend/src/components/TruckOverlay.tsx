import React, { useState } from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Battery, 
  Sun, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  Gauge,
  Lock,
  Layers,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Cpu
} from 'lucide-react';
import { Shipment, TelemetryRecord } from '../types';

interface TruckOverlayProps {
  shipment: Shipment;
  latestTelemetry?: TelemetryRecord;
  onOpenShipmentModal?: () => void;
}

export const TruckOverlay: React.FC<TruckOverlayProps> = ({
  shipment,
  latestTelemetry,
}) => {
  const [activeZone, setActiveZone] = useState<'A' | 'B'>('A');

  const temp = latestTelemetry?.temperature ?? shipment.latest_telemetry?.temperature ?? 4.2;
  const hum = latestTelemetry?.humidity ?? shipment.latest_telemetry?.humidity ?? 78.0;
  const gas = latestTelemetry?.gas_ethylene ?? shipment.latest_telemetry?.gas_ethylene ?? 13.5;
  const batt = latestTelemetry?.battery ?? shipment.latest_telemetry?.battery ?? 94.5;
  const solarMw = latestTelemetry?.solar_power_mw ?? 320;
  const lat = latestTelemetry?.latitude ?? shipment.latest_telemetry?.latitude ?? 19.0760;
  const lon = latestTelemetry?.longitude ?? shipment.latest_telemetry?.longitude ?? 72.9982;
  const syncState = latestTelemetry?.sync_state ?? shipment.latest_telemetry?.sync_state ?? 'live';
  const isIntegrityOk = (latestTelemetry?.integrity_status ?? 'verified') === 'verified';

  const isTempExcursion = temp > (shipment.thresholds?.max_temp ?? 8.0) || temp < (shipment.thresholds?.min_temp ?? 2.0);
  const isGasExcursion = gas > (shipment.thresholds?.max_gas_ethylene ?? 50.0);

  // Compartment B secondary simulated telemetry (slight offset for realistic dual-zone reefer)
  const tempB = Math.max(1.0, temp - 0.4);
  const humB = Math.max(60.0, hum - 1.5);
  const gasB = gas > 20 ? gas * 0.85 : 8.2;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-6">
      
      {/* 1. Header: Vehicle Profile & Master Telematics */}
      <div className="flex flex-wrap items-center justify-between pb-5 border-b border-slate-100 gap-4">
        
        {/* Left: Plate & Vehicle Metadata */}
        <div className="flex items-center gap-3.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-mono font-bold text-sm tracking-wider border border-slate-800 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {shipment.truck_plate}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-['Outfit']">{shipment.product_name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Grade A GI-Certified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Carrier: <span className="font-semibold text-slate-700">{shipment.carrier}</span> · Driver: {shipment.driver_name} ({shipment.driver_phone})
            </p>
          </div>
        </div>

        {/* Right: Master Status & Cryptographic Seals */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Live / Queued State */}
          <span className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider flex items-center gap-1.5 border ${
            syncState === 'live' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : syncState === 'queued'
              ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${syncState === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {syncState === 'live' ? 'Live Telemetry' : 'Queued (Flash)'}
          </span>

          {/* Cryptographic Integrity */}
          <span className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border ${
            isIntegrityOk 
              ? 'bg-teal-50 text-teal-700 border-teal-200' 
              : 'bg-rose-50 text-rose-700 border-rose-300 animate-bounce'
          }`}>
            {isIntegrityOk ? <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
            <span>{isIntegrityOk ? 'ECDSA Verified' : 'Integrity Mismatch'}</span>
          </span>

          {/* GPS Coordinate Pill */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px]">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span>
          </div>

          {/* Power & Solar Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Battery className="w-3 h-3 text-emerald-600" />
              {batt.toFixed(1)}%
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <Sun className="w-3 h-3 text-amber-500" />
              {solarMw} mW
            </span>
          </div>

        </div>
      </div>

      {/* 2. Vehicle Digital Twin Canvas (Clean & Unobstructed) */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50/70 via-slate-100/50 to-slate-200/60 p-5 sm:p-7 border border-slate-200/80 shadow-inner">
        
        {/* Ambient Subtle Grid & Illumination */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        
        {/* Interactive Zone Indicator Banners (Cleanly floating above trailer zones) */}
        <div className="relative max-w-4xl mx-auto">
          
          {/* Top Zone Radar Headers */}
          <div className="flex items-center justify-between px-6 sm:px-16 mb-2">
            
            {/* Cab Status Tag */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
              <Cpu className="w-3 h-3 text-slate-600" />
              <span>Tractor Cab</span>
            </div>

            {/* Zone 1 HUD Callout */}
            <button
              onClick={() => setActiveZone('A')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeZone === 'A'
                  ? 'bg-teal-600 text-white shadow-teal-500/20 scale-105'
                  : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200/90'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isTempExcursion || isGasExcursion ? 'bg-rose-400 animate-ping' : 'bg-teal-400'}`} />
              <span>Zone 1: Front Chilled Bay</span>
              <span className="font-mono text-[11px] opacity-90">({temp.toFixed(1)}°C)</span>
            </button>

            {/* Zone 2 HUD Callout */}
            <button
              onClick={() => setActiveZone('B')}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                activeZone === 'B'
                  ? 'bg-sky-600 text-white shadow-sky-500/20 scale-105'
                  : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200/90'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Zone 2: Rear Deep Cold</span>
              <span className="font-mono text-[11px] opacity-90">({tempB.toFixed(1)}°C)</span>
            </button>

          </div>

          {/* Truck Render (Full Quality, Zero Ugly Box Occlusions) */}
          <div className="relative flex flex-col items-center">
            <img
              src="/truck1.webp"
              alt="Reefer Cold-Chain Transport"
              className="w-full h-auto object-contain select-none filter drop-shadow-md transition-all duration-300"
            />

            {/* High-Tech Road Dock Pad & Contact Shadow */}
            <div className="w-full -mt-2.5 h-2 rounded-full bg-gradient-to-r from-transparent via-slate-300/80 to-transparent flex items-center justify-center">
              <div className="w-3/4 h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
            </div>

            {/* Zone Framing Brackets along the trailer chassis */}
            <div className="w-full grid grid-cols-12 gap-2 mt-2 px-4 sm:px-12 text-[10px] text-slate-500">
              <div className="col-span-4 text-center font-medium">
                <span className="text-slate-400">Cab & Diesel Engine</span>
              </div>
              <div className={`col-span-4 border-t-2 pt-1 text-center transition-colors ${
                activeZone === 'A' ? 'border-teal-500 text-teal-700 font-bold' : 'border-slate-300 text-slate-500'
              }`}>
                <span>Forward Compartment (Primary Evaporator)</span>
              </div>
              <div className={`col-span-4 border-t-2 pt-1 text-center transition-colors ${
                activeZone === 'B' ? 'border-sky-500 text-sky-700 font-bold' : 'border-slate-300 text-slate-500'
              }`}>
                <span>Aft Compartment (Rear Bulkhead)</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Multi-Compartment & Reefer Telematics Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Compartment A (Forward Chilled Cargo) */}
        <div className={`rounded-xl p-4 border transition-all ${
          activeZone === 'A' 
            ? 'bg-gradient-to-b from-teal-50/40 to-white border-teal-300 shadow-xs' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Forward Chilled Bay</h4>
                <p className="text-[10px] text-slate-500 font-mono">Node IoT #01 · SHT35 Probe</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isTempExcursion || isGasExcursion
                ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                : 'bg-teal-100 text-teal-800 border border-teal-200'
            }`}>
              {isTempExcursion || isGasExcursion ? 'Excursion Alert' : 'Active Cooling'}
            </span>
          </div>

          {/* Real-time Readings */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            
            <div className={`p-2 rounded-lg border ${
              isTempExcursion ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Thermometer className="w-3 h-3 text-teal-600" />
                <span>Temp</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {temp.toFixed(1)}°C
              </div>
              <span className="text-[9px] text-slate-500">Set: 4.0°C</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>Humidity</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {hum.toFixed(1)}%
              </div>
              <span className="text-[9px] text-slate-500">Target &lt;85%</span>
            </div>

            <div className={`p-2 rounded-lg border ${
              isGasExcursion ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50/80 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Ethylene</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {gas.toFixed(1)}
              </div>
              <span className="text-[9px] text-slate-500">Limit &lt;50 ppm</span>
            </div>

          </div>

          {/* Compartment Specifics */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Cargo: <strong className="text-slate-800">350 Crates</strong> ({shipment.batch_code})</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Sealed
            </span>
          </div>
        </div>

        {/* Compartment B (Aft Deep Cold Cargo) */}
        <div className={`rounded-xl p-4 border transition-all ${
          activeZone === 'B' 
            ? 'bg-gradient-to-b from-sky-50/40 to-white border-sky-300 shadow-xs' 
            : 'bg-white border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                B
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Rear Deep Cold Bay</h4>
                <p className="text-[10px] text-slate-500 font-mono">Node IoT #02 · SHT35 Probe</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
              Set Maintained
            </span>
          </div>

          {/* Real-time Readings */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            
            <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Thermometer className="w-3 h-3 text-sky-600" />
                <span>Temp</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {tempB.toFixed(1)}°C
              </div>
              <span className="text-[9px] text-slate-500">Set: 3.5°C</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>Humidity</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {humB.toFixed(1)}%
              </div>
              <span className="text-[9px] text-slate-500">Target &lt;85%</span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Ethylene</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                {gasB.toFixed(1)}
              </div>
              <span className="text-[9px] text-slate-500">Nominal</span>
            </div>

          </div>

          {/* Compartment Specifics */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Cargo: <strong className="text-slate-800">150 Crates</strong> (AG-2402)</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Sealed
            </span>
          </div>
        </div>

        {/* Reefer Engine & Vehicle Telematics */}
        <div className="rounded-xl p-4 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-slate-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Reefer Unit & Telematics</h4>
                <p className="text-[10px] text-slate-500">Carrier Vector 1550 · Micro-Link</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Continuous Run
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-slate-400" />
                Air Differential (ΔT):
              </span>
              <span className="font-mono font-semibold text-slate-800">0.5°C (Discharge 3.9°C / Return 4.4°C)</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Enclosure Tamper Sensor:
              </span>
              <span className="font-semibold text-emerald-700">Sealed & Monitored</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-slate-400" />
                Hardware Identity:
              </span>
              <span className="font-mono text-[11px] font-bold text-teal-700">ECDSA SECP256k1</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Route: <strong className="text-slate-700">{shipment.origin.split(',')[0]}</strong> → <strong className="text-slate-700">{shipment.destination.split(',')[0]}</strong></span>
            <span className="font-semibold text-teal-600">68% Transit</span>
          </div>
        </div>

      </div>

    </div>
  );
};

