import React, { useState } from 'react';
import { 
  Truck, 
  Sprout, 
  Thermometer, 
  Wind, 
  Cpu, 
  MapPin, 
  User, 
  Phone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { Device } from '../types';
import { api } from '../services/api';

interface CreateShipmentViewProps {
  devices: Device[];
  onShipmentCreated: (newShipmentId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const CROP_PRESETS = [
  {
    name: 'Ratnagiri Alphonso Mango',
    code: 'GI-MH-ALPH',
    icon: '🥭',
    minTemp: 2.0,
    maxTemp: 8.0,
    maxHumidity: 85.0,
    maxGas: 45.0,
    compartment: 'Compartment A (Chilled Front)',
    defaultOrigin: 'Ratnagiri Orchards, Maharashtra',
    defaultDest: 'APMC Vashi Market, Navi Mumbai'
  },
  {
    name: 'Nagpur Mandarin Oranges',
    code: 'GI-MH-NAGP',
    icon: '🍊',
    minTemp: 4.0,
    maxTemp: 7.0,
    maxHumidity: 88.0,
    maxGas: 35.0,
    compartment: 'Compartment B (Controlled Rear)',
    defaultOrigin: 'Katol Citrus Belt, Nagpur',
    defaultDest: 'JNPT International Port, Mumbai'
  },
  {
    name: 'Nashik Thompson Seedless Grapes',
    code: 'GI-MH-NSHK',
    icon: '🍇',
    minTemp: -0.5,
    maxTemp: 2.0,
    maxHumidity: 92.0,
    maxGas: 25.0,
    compartment: 'Compartment A (Deep Chill Front)',
    defaultOrigin: 'Dindori Vineyard Valley, Nashik',
    defaultDest: 'Nhava Sheva Cargo Terminal'
  },
  {
    name: 'Shimla Royal Delicious Apples',
    code: 'GI-HP-SHML',
    icon: '🍎',
    minTemp: 0.0,
    maxTemp: 4.0,
    maxHumidity: 90.0,
    maxGas: 40.0,
    compartment: 'Compartment A (Chilled Front)',
    defaultOrigin: 'Kotgarh Apple Cooperative, Himachal Pradesh',
    defaultDest: 'Azadpur Mandi, New Delhi'
  }
];

export const CreateShipmentView: React.FC<CreateShipmentViewProps> = ({
  devices,
  onShipmentCreated,
  onShowToast
}) => {
  const [selectedCrop, setSelectedCrop] = useState(CROP_PRESETS[0]);
  const [productName, setProductName] = useState(CROP_PRESETS[0].name);
  const [batchCode, setBatchCode] = useState(`AGRI-${Math.floor(1000 + Math.random() * 9000)}`);
  const [origin, setOrigin] = useState(CROP_PRESETS[0].defaultOrigin);
  const [destination, setDestination] = useState(CROP_PRESETS[0].defaultDest);
  const [carrier, setCarrier] = useState('KisanCold Express Logistics');
  const [truckPlate, setTruckPlate] = useState('MH-04-AZ-8892');
  const [driverName, setDriverName] = useState('Ramesh Patil');
  const [driverPhone, setDriverPhone] = useState('+91 98201 44512');
  const [compartment, setCompartment] = useState(CROP_PRESETS[0].compartment);
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0]?.id || 'AGRITRACE-001');
  
  const [minTemp, setMinTemp] = useState(CROP_PRESETS[0].minTemp);
  const [maxTemp, setMaxTemp] = useState(CROP_PRESETS[0].maxTemp);
  const [maxGas, setMaxGas] = useState(CROP_PRESETS[0].maxGas);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectPreset = (preset: typeof CROP_PRESETS[0]) => {
    setSelectedCrop(preset);
    setProductName(preset.name);
    setOrigin(preset.defaultOrigin);
    setDestination(preset.defaultDest);
    setCompartment(preset.compartment);
    setMinTemp(preset.minTemp);
    setMaxTemp(preset.maxTemp);
    setMaxGas(preset.maxGas);
    setBatchCode(`AGRI-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        product_name: productName,
        batch_code: batchCode,
        compartment_label: compartment,
        origin,
        destination,
        carrier,
        truck_plate: truckPlate,
        driver_name: driverName,
        driver_phone: driverPhone,
        device_id: selectedDeviceId,
        min_temp: Number(minTemp),
        max_temp: Number(maxTemp),
        max_gas_ethylene: Number(maxGas)
      };

      const result = await api.createShipment(payload);
      onShowToast(`Shipment ${batchCode} registered & linked to IoT Node ${selectedDeviceId}!`, 'success');
      if (result && result.id) {
        onShipmentCreated(result.id);
      }
    } catch (err) {
      console.error(err);
      onShowToast('Failed to create shipment. Backend connection error.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Kisan Cold-Chain Dispatch Registration</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-['Outfit']">Create New Farm-to-Fork Shipment</h1>
          <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
            Register fresh farm produce, lock tamper-proof temperature thresholds, and bind the cold-chain telemetry unit for blockchain-backed provenance.
          </p>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <span>Select Approved Crop Preset (Pre-loaded GI Standards)</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Auto-fills safe cold-chain limits</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CROP_PRESETS.map((crop) => {
            const isSelected = selectedCrop.name === crop.name;
            return (
              <button
                key={crop.code}
                type="button"
                onClick={() => handleSelectPreset(crop)}
                className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
                <div>
                  <span className="text-2xl mb-2 block">{crop.icon}</span>
                  <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{crop.code}</div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{crop.name}</h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                  <span>Target: {crop.minTemp}°C to {crop.maxTemp}°C</span>
                  <span className="text-slate-400">Gas: &lt;{crop.maxGas}ppm</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-8 space-y-8">
        
        {/* Step 1: Crop & Batch Identification */}
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Crop Batch & Compartment Assignment</h3>
              <p className="text-xs text-slate-500">Provide official mandi batch tag and select in-trailer reefer zone</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Crop / Produce Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Batch / Harvest Lot Code</label>
              <input
                type="text"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Reefer Truck Compartment</label>
              <select
                value={compartment}
                onChange={(e) => setCompartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Compartment A (Chilled Front)">Compartment A (Chilled Front 2°C–8°C)</option>
                <option value="Compartment B (Controlled Rear)">Compartment B (Ambient/Dry 8°C–15°C)</option>
                <option value="Dual-Zone Unified Trailer">Dual-Zone Unified Trailer (Complete Load)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Route & Carrier Manifest */}
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Route & Logistics Carrier</h3>
              <p className="text-xs text-slate-500">Origin dispatch point, destination terminal, vehicle and driver</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Origin Mandi / FPO Collection Center</span>
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Destination Port / Wholesale Mandi</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>Cold-Chain Carrier</span>
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Truck Plate / Reefer Registration</label>
              <input
                type="text"
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Driver Name</span>
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Driver Mobile</span>
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 3: IoT Hardware Node & Guardrails */}
        <div>
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <h3 className="text-base font-bold text-slate-900">IoT Telematics Node & Safety Thresholds</h3>
              <p className="text-xs text-slate-500">Bind authenticated ESP32 edge node and configure automatic spoilage tripwires</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bind IoT Hardware Node</span>
              </label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-emerald-800"
              >
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.id} ({d.status.toUpperCase()} • Bat: {d.battery_level}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                <span>Min Safe Temp (°C)</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={minTemp}
                onChange={(e) => setMinTemp(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                <span>Max Safe Temp (°C)</span>
              </label>
              <input
                type="number"
                step="0.5"
                value={maxTemp}
                onChange={(e) => setMaxTemp(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-amber-600" />
                <span>Max Ethylene (ppm)</span>
              </label>
              <input
                type="number"
                step="5"
                value={maxGas}
                onChange={(e) => setMaxGas(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security Summary & Submit Button */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              All readings are cryptographically hashed using <strong>RFC 8785 canonical JSON</strong> and verified with ECDSA signatures.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Deploying Manifest...</span>
            ) : (
              <>
                <span>Register & Launch Shipment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
