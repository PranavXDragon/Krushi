import React from 'react';
import { 
  Truck, 
  Plus, 
  Cpu, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Shipment, Device } from '../types';
import { api } from '../services/api';

interface ShipmentsViewProps {
  shipments: Shipment[];
  devices: Device[];
  onSelectShipment: (id: string) => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  shipments,
  devices,
  onSelectShipment,
  onRefresh,
  onShowToast
}) => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [productName, setProductName] = React.useState('');
  const [batchCode, setBatchCode] = React.useState('');
  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [carrier, setCarrier] = React.useState('KisanCold Express Logistics');
  const [truckPlate, setTruckPlate] = React.useState('MH-04-AZ-8892');
  const [deviceId, setDeviceId] = React.useState('AGRITRACE-001');
  const [minTemp, setMinTemp] = React.useState(2.0);
  const [maxTemp, setMaxTemp] = React.useState(8.0);
  const [maxGas, setMaxGas] = React.useState(50.0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createShipment({
        product_name: productName || 'GI Organic Mangoes',
        batch_code: batchCode || `AG-${Math.floor(1000 + Math.random() * 9000)}`,
        origin: origin || 'Ratnagiri Farms, Maharashtra',
        destination: destination || 'JNPT Port Terminal, Navi Mumbai',
        carrier,
        truck_plate: truckPlate,
        device_id: deviceId,
        min_temp: Number(minTemp),
        max_temp: Number(maxTemp),
        max_gas_ethylene: Number(maxGas)
      });
      onShowToast('Shipment created and IoT node bound successfully!', 'success');
      setShowCreateModal(false);
      onRefresh();
    } catch (e) {
      onShowToast('Failed to create shipment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Shipments & Device Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage active cold chain manifests, IoT node bindings, and safety ranges</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Shipment</span>
        </button>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4">Active & Historical Shipments</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Shipment Code</th>
                <th className="py-3 px-4">Product & Batch</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Carrier & Truck</th>
                <th className="py-3 px-4">IoT Node</th>
                <th className="py-3 px-4">Thresholds</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{s.shipment_code}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-800 block">{s.product_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Batch: {s.batch_code}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-800">{s.origin}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                      <span className="text-slate-800">{s.destination}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-800 block">{s.carrier}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{s.truck_plate}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {s.device_id ? (
                      <span className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        <Cpu className="w-3 h-3 text-teal-600" />
                        {s.device_id}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-500">
                    <div>Temp: {s.thresholds?.min_temp}°C - {s.thresholds?.max_temp}°C</div>
                    <div>Max Gas: {s.thresholds?.max_gas_ethylene} ppm</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      s.status === 'IN_TRANSIT' 
                        ? 'bg-teal-100 text-teal-800' 
                        : s.status === 'DELIVERED' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onSelectShipment(s.id)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 text-xs font-bold transition shadow-2xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Devices Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4">Registered Hardware Nodes (ESP32-S3)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 text-sm">{d.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  d.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {d.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">Serial: {d.serial_number}</p>
              <div className="text-xs text-slate-600 pt-2 border-t border-slate-200 flex justify-between">
                <span>Firmware: <strong>{d.firmware_version}</strong></span>
                <span>Battery: <strong>{d.battery_level}%</strong></span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                {d.charging_state}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-slate-800">Create New Tracked Shipment</h3>
            <p className="text-xs text-slate-500 mt-1">Bind IoT node credentials, route checkpoints, and safe parameters</p>

            <form onSubmit={handleCreate} className="space-y-4 mt-6 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Export Alphonso Mangoes"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batch Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AG-2405"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Assign IoT Node</label>
                  <select
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.id} ({d.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Origin Cluster</label>
                  <input
                    type="text"
                    placeholder="Ratnagiri Agri Farm Gate"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Destination Hub</label>
                  <input
                    type="text"
                    placeholder="JNPT Reefer Terminal"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={minTemp}
                    onChange={(e) => setMinTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Gas (ppm)</label>
                  <input
                    type="number"
                    value={maxGas}
                    onChange={(e) => setMaxGas(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-white shadow-md shadow-teal-600/20"
                >
                  Save & Bind IoT Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
