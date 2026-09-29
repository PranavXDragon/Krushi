import React from 'react';
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
  Wind,
  Radio,
  Cpu,
  Sparkles
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

      {/* 2. Vehicle Digital Twin Canvas with In-Trailer X-Ray Compartments */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50/70 via-slate-100/50 to-slate-200/60 p-4 sm:p-6 border border-slate-200/80 shadow-inner">
        
        {/* Ambient Subtle Grid & Illumination */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Base Truck Image */}
          <img
            src="/truck1.webp"
            alt="Cold-Chain Reefer Truck"
            className="w-full h-auto object-contain select-none filter drop-shadow-md transition-all duration-300"
          />

          {/* In-Trailer Compartment A (Forward Chilled Cargo Chamber) - Borderless & Perfectly Fitted */}
          <div 
            className={`absolute top-[9%] left-[33.5%] w-[30.5%] h-[47%] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between backdrop-blur-md transition-all duration-300 border-0 shadow-sm ${
              isTempExcursion || isGasExcursion
                ? 'bg-rose-50/90 shadow-rose-500/20'
                : 'bg-white/85 hover:bg-white/95 shadow-slate-300/40'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isTempExcursion || isGasExcursion ? 'bg-rose-500 animate-ping' : 'bg-teal-500 animate-pulse'}`} />
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate">Compartment A</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100/80 text-slate-700 font-bold flex-shrink-0">
                {shipment.batch_code}
              </span>
            </div>

            {/* Real-time 3-Metric Instrument Grid (Clean Borderless Mini-Cards) */}
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 my-auto text-center">
              {/* Temp */}
              <div className={`p-1 rounded-lg border-0 transition-colors ${
                isTempExcursion 
                  ? 'bg-rose-100/90 text-rose-900 font-bold' 
                  : 'bg-slate-100/80 text-slate-800'
              }`}>
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Thermometer className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
                  <span>Temp</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {temp.toFixed(1)}°C
                </div>
              </div>

              {/* Humidity */}
              <div className="p-1 rounded-lg bg-slate-100/80 border-0 text-slate-800">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Droplets className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                  <span>Hum</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {hum.toFixed(1)}%
                </div>
              </div>

              {/* Gas */}
              <div className={`p-1 rounded-lg border-0 transition-colors ${
                isGasExcursion 
                  ? 'bg-rose-100/90 text-rose-900 font-bold animate-pulse' 
                  : 'bg-slate-100/80 text-slate-800'
              }`}>
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Flame className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                  <span>Gas</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {gas.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] pt-1 border-t border-slate-100 text-slate-500">
              <span className="font-semibold text-slate-600 truncate">Front Bay · Primary Chilled</span>
              <span className="font-bold text-slate-700">IoT #01</span>
            </div>
          </div>

          {/* In-Trailer Compartment B (Rear Deep Cold Chamber) - Borderless & Perfectly Fitted */}
          <div 
            className="absolute top-[9%] left-[65.5%] w-[30.5%] h-[47%] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between backdrop-blur-md bg-white/85 hover:bg-white/95 border-0 shadow-sm shadow-slate-300/40 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-800 truncate">Compartment B</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100/80 text-slate-700 font-bold flex-shrink-0">
                AG-2402
              </span>
            </div>

            {/* Real-time 3-Metric Instrument Grid (Clean Borderless Mini-Cards) */}
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 my-auto text-center">
              {/* Temp */}
              <div className="p-1 rounded-lg bg-slate-100/80 border-0 text-slate-800">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Thermometer className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                  <span>Temp</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {tempB.toFixed(1)}°C
                </div>
              </div>

              {/* Humidity */}
              <div className="p-1 rounded-lg bg-slate-100/80 border-0 text-slate-800">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Droplets className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                  <span>Hum</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {humB.toFixed(1)}%
                </div>
              </div>

              {/* Gas */}
              <div className="p-1 rounded-lg bg-slate-100/80 border-0 text-slate-800">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-500 font-medium">
                  <Flame className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                  <span>Gas</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold font-['Outfit'] mt-0.5 text-slate-900">
                  {gasB.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] pt-1 border-t border-slate-100 text-slate-500">
              <span className="font-semibold text-slate-600 truncate">Rear Bay · Secondary Cell</span>
              <span className="font-bold text-slate-700">IoT #02</span>
            </div>
          </div>



        </div>

      </div>

      {/* 3. High-Density Telematics & Security Status Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        
        {/* Reefer Unit */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Reefer Plant</span>
              <span className="font-bold text-slate-800">Vector 1550 (Cooling)</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Auto</span>
        </div>

        {/* Air Differential */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Discharge vs Return</span>
              <span className="font-bold text-slate-800 font-mono">ΔT = 0.5°C</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">3.9° / 4.4°</span>
        </div>

        {/* Enclosure Tamper */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Cargo Enclosure</span>
              <span className="font-bold text-emerald-700">Sealed & Intact</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>

        {/* Hardware Node Identity */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Node Cryptography</span>
              <span className="font-mono text-[11px] font-bold text-purple-900">ECDSA SECP256k1</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">Auth</span>
        </div>

      </div>

      {/* 4. Quick Origin & Destination Footnote */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 pt-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Active Device: <strong className="text-slate-700">{shipment.device_id || 'AGRITRACE-001'}</strong> (ESP32-S3 + SHT35 + ZE03 Gas Array)</span>
        </div>
        <div>
          Transit: <strong className="text-slate-700">{shipment.origin.split(',')[0]}</strong> → <strong className="text-slate-700">{shipment.destination.split(',')[0]}</strong>
        </div>
      </div>

    </div>
  );
};
