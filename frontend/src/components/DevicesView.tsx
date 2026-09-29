import React, { useState } from 'react';
import { 
  Cpu, 
  Battery, 
  Sun, 
  Wifi, 
  ShieldCheck, 
  AlertOctagon, 
  Truck, 
  RotateCw, 
  CheckCircle2, 
  Key, 
  Activity,
  Plus,
  Radio,
  Clock
} from 'lucide-react';
import { Device, Shipment } from '../types';

interface DevicesViewProps {
  devices: Device[];
  shipments: Shipment[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  shipments,
  onRefresh,
  onShowToast
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetTruck, setTargetTruck] = useState(shipments[0]?.truck_plate || 'MH-04-AZ-8892');
  const [targetShipmentId, setTargetShipmentId] = useState(shipments[0]?.id || '');
  const [isPinging, setIsPinging] = useState<string | null>(null);

  const handlePingNode = (deviceId: string) => {
    setIsPinging(deviceId);
    setTimeout(() => {
      setIsPinging(null);
      onShowToast(`Heartbeat ACK received from ${deviceId} (4G LTE latency: 42ms)`, 'success');
    }, 1200);
  };

  const handleOpenAssign = (dev: Device) => {
    setSelectedDevice(dev);
    setShowAssignModal(true);
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    onShowToast(`Device ${selectedDevice.id} successfully bound to Reefer ${targetTruck}!`, 'success');
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner: Clean White & Short Professional */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold mb-1 border border-emerald-200">
            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
            <span>4G Telematics Edge Node Fleet</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 font-['Outfit']">IoT Hardware Nodes & Edge Cryptography</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Monitor real-time hardware vitals, LiFePO4 battery harvesting, cellular links, and ECDSA credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Fleet</span>
          </button>
        </div>
      </div>

      {/* Hardware Fleet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((device) => {
          const boundShipment = shipments.find(s => s.device_id === device.id || s.id === device.current_shipment_id);
          const isOnline = device.status === 'online';

          return (
            <div 
              key={device.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top Strip */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-base font-mono">{device.id}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          <span>{device.status}</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        SN: {device.serial_number || 'ESP32S3-2026-X88'} • FW: {device.firmware_version || 'v1.2.0-gov'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePingNode(device.id)}
                    disabled={isPinging === device.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Activity className={`w-3.5 h-3.5 text-emerald-600 ${isPinging === device.id ? 'animate-spin' : ''}`} />
                    <span>{isPinging === device.id ? 'Pinging...' : 'Ping Node'}</span>
                  </button>
                </div>

                {/* Hardware Vitals Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 my-5">
                  
                  {/* Battery & Harvester */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      <span>LiFePO4 Batt</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 font-['Outfit'] mt-1">
                      {device.battery_level}%
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Solar: 340 mW</span>
                    </div>
                  </div>

                  {/* Cellular 4G Signal */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <Wifi className="w-3.5 h-3.5 text-sky-600" />
                      <span>4G LTE Link</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 font-['Outfit'] mt-1">
                      {device.signal_strength || -72} <span className="text-xs text-slate-500 font-normal">dBm</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      SIM: Jio 4G APN
                    </div>
                  </div>

                  {/* Flash Storage Queue */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-500 uppercase">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Hardware Sec</span>
                    </div>
                    <div className="text-lg font-black text-emerald-700 font-['Outfit'] mt-1">
                      SECP256k1
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Signed at Edge
                    </div>
                  </div>

                </div>

                {/* Truck & Shipment Binding */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-600" />
                      <span>Bound Reefer Vehicle</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {boundShipment ? boundShipment.truck_plate : 'Unassigned Standby'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Active Cargo</span>
                    <span className="font-semibold text-emerald-800">
                      {boundShipment ? `${boundShipment.product_name} (${boundShipment.batch_code})` : 'Awaiting Trip Manifest'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-400 truncate">
                    <span>Pubkey:</span>
                    <span className="truncate max-w-[220px]" title={device.public_key}>
                      {device.public_key || '0x04bf9e8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last heartbeat: Just now</span>
                </div>

                <button
                  onClick={() => handleOpenAssign(device)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Assign to Truck</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal: Assign Node to Reefer Truck */}
      {showAssignModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Assign Node to Vehicle</h3>
                  <p className="text-xs text-slate-500">Bind {selectedDevice.id} to cold-chain manifest</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Reefer Truck</label>
                <input
                  type="text"
                  value={targetTruck}
                  onChange={(e) => setTargetTruck(e.target.value)}
                  required
                  placeholder="e.g. MH-04-AZ-8892"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Trip Manifest / Shipment</label>
                <select
                  value={targetShipmentId}
                  onChange={(e) => setTargetShipmentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {shipments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.product_name} ({s.batch_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Anti-Impersonation guardrail will automatically restrict this device token to only accept submissions for this assigned shipment.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
