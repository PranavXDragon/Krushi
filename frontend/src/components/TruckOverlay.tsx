import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Battery, 
  Sun, 
  Radio, 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  Clock,
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
  onOpenShipmentModal
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

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      
      {/* Truck Header info bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 font-mono font-bold text-sm border border-teal-200">
            {shipment.truck_plate}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{shipment.product_name}</h3>
            <p className="text-xs text-slate-500">
              Carrier: <span className="font-semibold text-slate-700">{shipment.carrier}</span> · Driver: {shipment.driver_name} ({shipment.driver_phone})
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {/* Sync status */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
            syncState === 'live' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
              : syncState === 'queued'
              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${syncState === 'live' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {syncState}
          </span>

          {/* Cryptographic integrity */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
            isIntegrityOk 
              ? 'bg-teal-50 text-teal-700 border-teal-200' 
              : 'bg-rose-50 text-rose-700 border-rose-300 animate-bounce'
          }`}>
            {isIntegrityOk ? <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
            {isIntegrityOk ? 'Chain Verified' : 'Integrity Mismatch'}
          </span>
        </div>
      </div>

      {/* Main Truck Graphic Container with HTML / React Compartment Overlays */}
      <div className="relative mt-6 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50/80 via-slate-100/40 to-slate-200/50 p-4 sm:p-6 border border-slate-200/70 shadow-inner">
        
        {/* Ambient Cold Chain Atmosphere Glow */}
        <div className="absolute inset-0 bg-radial from-teal-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Base Layer Truck Image with Ground Integration */}
        <div className="relative max-w-4xl mx-auto flex flex-col items-center justify-center">
          <img
            src="/truck1.webp"
            alt="Cold Chain Reefer Truck"
            className="w-full h-auto object-contain select-none filter drop-shadow-md transition-all duration-300"
            onError={(e) => {
              // Fallback if asset load fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />

          {/* Sleek Transit Surface & Ambient Shadow Integration */}
          <div className="w-full -mt-1.5 h-1.5 rounded-full bg-gradient-to-r from-transparent via-slate-300/70 to-transparent flex items-center justify-center">
            <div className="w-2/3 h-[1px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
          </div>

          {/* Top Truck Info Pills (Floating above truck) */}
          <div className="absolute top-2 left-2 sm:left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>GPS: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
              <span>{batt.toFixed(1)}%</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-amber-600 font-medium">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Solar: {solarMw} mW</span>
            </div>
          </div>

          {/* Compartment A Overlay (Reefer Cargo Chamber - Front Zone) */}
          <div 
            className={`absolute top-[18%] left-[36%] w-[27%] bg-white/25 hover:bg-white/35 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border-2 shadow-md transition-all duration-300 cursor-pointer ${
              isTempExcursion || isGasExcursion
                ? 'border-rose-500 shadow-rose-500/20'
                : 'border-teal-500/80 hover:border-teal-400 shadow-teal-500/10'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-300/60">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">Compartment A</span>
              </div>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/60 border border-slate-300/80 text-slate-800 font-bold flex-shrink-0">
                {shipment.batch_code}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-1 text-center">
              {/* Temp */}
              <div className={`p-1 rounded-lg border backdrop-blur-xs transition-colors ${
                isTempExcursion 
                  ? 'bg-rose-500/20 border-rose-400 text-rose-900' 
                  : 'bg-white/45 border-slate-300/80 text-slate-900'
              }`}>
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Thermometer className="w-2.5 h-2.5 text-teal-600 flex-shrink-0" />
                  <span className="truncate">Temp</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {temp.toFixed(1)}°C
                </div>
              </div>

              {/* Humidity */}
              <div className="p-1 rounded-lg bg-white/45 border border-slate-300/80 text-slate-900 backdrop-blur-xs">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Droplets className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Hum</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {hum.toFixed(1)}%
                </div>
              </div>

              {/* Gas / Ethylene */}
              <div className={`p-1 rounded-lg border backdrop-blur-xs transition-colors ${
                isGasExcursion 
                  ? 'bg-rose-500/20 border-rose-400 text-rose-900 animate-pulse' 
                  : 'bg-white/45 border-slate-300/80 text-slate-900'
              }`}>
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Flame className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">Gas</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {gas.toFixed(1)} ppm
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[8px] text-slate-600 pt-0.5 border-t border-slate-300/40">
              <span className="font-semibold text-teal-700 truncate">Front Bay · Primary Node</span>
              <span className="font-bold text-slate-700">IoT #01</span>
            </div>
          </div>

          {/* Compartment B Overlay (Reefer Cargo Chamber - Rear Zone) */}
          <div className="absolute top-[18%] left-[65%] w-[27%] bg-white/25 hover:bg-white/35 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border-2 border-sky-500/80 hover:border-sky-400 shadow-md shadow-sky-500/10 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between pb-1 border-b border-slate-300/60">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-900 truncate">Compartment B</span>
              </div>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/60 border border-slate-300/80 text-slate-800 font-bold flex-shrink-0">
                AG-2402
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-1 text-center">
              {/* Temp */}
              <div className="p-1 rounded-lg bg-white/45 border border-slate-300/80 text-slate-900 backdrop-blur-xs">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Thermometer className="w-2.5 h-2.5 text-sky-600 flex-shrink-0" />
                  <span className="truncate">Temp</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {(temp - 0.4).toFixed(1)}°C
                </div>
              </div>

              {/* Humidity */}
              <div className="p-1 rounded-lg bg-white/45 border border-slate-300/80 text-slate-900 backdrop-blur-xs">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Droplets className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Hum</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {Math.max(0, hum - 1.5).toFixed(1)}%
                </div>
              </div>

              {/* Gas / Ethylene */}
              <div className="p-1 rounded-lg bg-white/45 border border-slate-300/80 text-slate-900 backdrop-blur-xs">
                <div className="flex items-center justify-center gap-0.5 text-[8px] sm:text-[9px] text-slate-600 font-medium">
                  <Flame className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">Gas</span>
                </div>
                <div className="text-[10px] sm:text-xs font-extrabold mt-0.5 text-slate-900">
                  {(gas > 20 ? gas * 0.85 : 8.2).toFixed(1)} ppm
                </div>
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[8px] text-slate-600 pt-0.5 border-t border-slate-300/40">
              <span className="font-semibold text-emerald-700 truncate">Rear Bay · Secondary Cell</span>
              <span className="font-bold text-emerald-700">Nominal</span>
            </div>
          </div>

        </div>

      </div>

      {/* Quick Footnote */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Real-time IoT Node attached: <strong>{shipment.device_id || 'AGRITRACE-001'}</strong> (ESP32-S3 + SHT31 + Gas Array)</span>
        </div>
        <div>
          Origin: <strong className="text-slate-700">{shipment.origin}</strong> → Destination: <strong className="text-slate-700">{shipment.destination}</strong>
        </div>
      </div>

    </div>
  );
};
