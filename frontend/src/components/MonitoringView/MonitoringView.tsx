import './MonitoringView.css';
import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Flame, 
  Battery, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Sun,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Shipment, TelemetryRecord } from '../../types';
import { TruckOverlay } from '../TruckOverlay';

interface MonitoringViewProps {
  shipment: Shipment;
  telemetryList: TelemetryRecord[];
  onRefresh: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  shipment,
  telemetryList,
  onRefresh
}) => {
  const latest = telemetryList[telemetryList.length - 1];
  const temp = latest?.temperature ?? 4.2;
  const hum = latest?.humidity ?? 78.0;
  const gas = latest?.gas_ethylene ?? 13.5;
  const batt = latest?.battery ?? 94.5;
  const solar = latest?.solar_power_mw ?? 320.0;

  const isTempHigh = temp > (shipment.thresholds?.max_temp ?? 8.0);
  const isGasHigh = gas > (shipment.thresholds?.max_gas_ethylene ?? 50.0);
  const hasWarning = isTempHigh || isGasHigh;

  return (
    <div className="space-y-6">
      
      {/* Top Warning Banner (matching PRD Section 6.4) */}
      {hasWarning && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-800 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Environmental Excursion Detected on Active Shipment</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {isGasHigh && `Ethylene level (${gas} ppm) breached safety threshold (> ${shipment.thresholds.max_gas_ethylene} ppm). Spoilage risk! `}
                {isTempHigh && `Temperature (${temp}°C) breached maximum cold limit (> ${shipment.thresholds.max_temp}°C).`}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white uppercase tracking-wider">
            Critical Action Required
          </span>
        </div>
      )}

      {/* 4 Primary Environmental Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Temperature */}
        <div className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
          isTempHigh ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chamber Temperature</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isTempHigh ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              {isTempHigh ? 'Excursion Risk' : 'In Spec · Optimal'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{temp.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">°C</span>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isTempHigh ? 'bg-rose-100 text-rose-600' : 'bg-teal-50 text-teal-600'
            }`}>
              <Thermometer className="w-5 h-5" />
            </div>
          </div>

          {/* Visual Range Gauge Meter */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>Min {shipment.thresholds?.min_temp ?? 2.0}°C</span>
              <span className="font-bold text-teal-700">Set 4.0°C</span>
              <span>Max {shipment.thresholds?.max_temp ?? 8.0}°C</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
              {/* Safe zone highlight */}
              <div className="absolute inset-y-0 left-[20%] right-[20%] bg-emerald-100" />
              {/* Fill indicator */}
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isTempHigh ? 'bg-rose-500' : 'bg-teal-500'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.max(8, ((temp - 0) / 12) * 100))}%` 
                }}
              />
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Target Range:</span>
            <span className="font-semibold text-slate-800">{shipment.thresholds?.min_temp}°C - {shipment.thresholds?.max_temp}°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relative Humidity</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Nominal Range
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{hum.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">% RH</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </div>
          </div>

          {/* Visual Humidity Gauge Meter */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>0%</span>
              <span className="font-bold text-blue-700">Dew Point: 1.1°C</span>
              <span>Max {shipment.thresholds?.max_humidity ?? 85}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
              <div 
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (hum / 100) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Max Limit:</span>
            <span className="font-semibold text-slate-800">&lt; {shipment.thresholds?.max_humidity}% RH</span>
          </div>
        </div>

        {/* Ethylene / Spoilage */}
        <div className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
          isGasHigh ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ripening Ethylene (C₂H₄)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isGasHigh 
                ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300' 
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isGasHigh ? 'Spoilage Hazard' : 'Safe Shelf-Life'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-extrabold font-['Outfit'] ${
                isGasHigh ? 'text-rose-600' : 'text-slate-900'
              }`}>{gas.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">ppm</span>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isGasHigh ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-amber-50 text-amber-600'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
          </div>

          {/* Visual Ethylene Gauge Meter */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>0 ppm</span>
              <span className="font-bold text-amber-700">Sensor: ZE03</span>
              <span>Crit {shipment.thresholds?.max_gas_ethylene ?? 50} ppm</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isGasHigh 
                    ? 'bg-rose-600' 
                    : gas > 25 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (gas / (shipment.thresholds?.max_gas_ethylene ?? 50)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Critical Threshold:</span>
            <span className="font-semibold text-slate-800">&lt; {shipment.thresholds?.max_gas_ethylene} ppm</span>
          </div>
        </div>

        {/* Battery & Solar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Node Power & Solar</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Sun className="w-3 h-3 text-amber-500" />
              Harvesting
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{batt.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">%</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Battery className="w-5 h-5" />
            </div>
          </div>

          {/* Visual Battery Gauge Meter */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
              <span>0%</span>
              <span className="font-bold text-emerald-700">{batt > 20 ? 'Autonomous 48h+' : 'Low Battery'}</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
              <div 
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, batt))}%` }}
              />
            </div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
            <span className="text-slate-500">Solar Influx Rate:</span>
            <span className="font-semibold text-amber-700 font-mono">+{solar} mW</span>
          </div>
        </div>

      </div>

      {/* Truck Visualization Main Component */}
      <TruckOverlay shipment={shipment} latestTelemetry={latest} />

      {/* Telemetry History Table with Source Badges */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Sequential Telemetry Feed & Hash Chain</h3>
            <p className="text-xs text-slate-500">Monotonically sequenced sensor records with SHA-256 integrity linking</p>
          </div>
          <button 
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Temp (°C)</th>
                <th className="py-3 px-4">Humidity (%)</th>
                <th className="py-3 px-4">Ethylene (ppm)</th>
                <th className="py-3 px-4">Power</th>
                <th className="py-3 px-4">Sync State</th>
                <th className="py-3 px-4">Record SHA-256 Digest</th>
                <th className="py-3 px-4">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {telemetryList.slice(-15).reverse().map((rec) => (
                <tr key={rec.id || rec.sequence} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">#{rec.sequence}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className={`py-3 px-4 font-bold ${
                    rec.temperature > (shipment.thresholds?.max_temp ?? 8) ? 'text-rose-600 font-extrabold' : 'text-slate-800'
                  }`}>
                    {rec.temperature.toFixed(1)}°C
                  </td>
                  <td className="py-3 px-4 text-slate-700">{rec.humidity.toFixed(1)}%</td>
                  <td className={`py-3 px-4 font-bold ${
                    rec.gas_ethylene > (shipment.thresholds?.max_gas_ethylene ?? 50) ? 'text-rose-600' : 'text-slate-700'
                  }`}>
                    {rec.gas_ethylene.toFixed(1)} ppm
                  </td>
                  <td className="py-3 px-4 text-slate-700">{rec.battery.toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rec.sync_state === 'live' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.sync_state === 'queued'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.sync_state}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-teal-700" title={rec.record_hash}>
                    {rec.record_hash.substring(0, 12)}...{rec.record_hash.substring(rec.record_hash.length - 6)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>{rec.integrity_status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
