import React from 'react';
import { 
  Play, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Flame, 
  Thermometer, 
  Lock, 
  ShieldAlert, 
  Database,
  Radio
} from 'lucide-react';
import { api } from '../services/api';

interface SimulationBarProps {
  isOnline: boolean;
  queuedCount: number;
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  isOnline,
  queuedCount,
  onRefresh,
  onShowToast
}) => {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const handleTick = async () => {
    setLoadingAction('tick');
    try {
      const res = await api.simulationTick();
      if (res.action === 'queued_offline') {
        onShowToast(`Sample #${res.record.sequence} generated and queued locally (Offline Mode)`, 'warning');
      } else {
        onShowToast(`Sample #${res.record.sequence} ingested live (${res.record.temperature}°C, ${res.record.gas_ethylene} ppm)`, 'success');
      }
      onRefresh();
    } catch (e) {
      onShowToast('Simulation error', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleNetwork = async (online: boolean) => {
    setLoadingAction('net');
    try {
      const res = await api.toggleNetwork(online);
      onShowToast(res.message, online ? 'success' : 'warning');
      onRefresh();
    } catch (e) {
      onShowToast('Network toggle failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBatchSync = async () => {
    setLoadingAction('sync');
    try {
      const res = await api.batchSync();
      if (res.status === 'success') {
        onShowToast(`MQTT Burst Sync complete: ${res.synced_count} records uploaded & verified`, 'success');
      } else {
        onShowToast(res.message, 'info');
      }
      onRefresh();
    } catch (e) {
      onShowToast('Sync failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGasSpike = async () => {
    setLoadingAction('gas');
    try {
      await api.injectGasSpike(64.8);
      onShowToast('Ethylene Spike Injected: 64.8 ppm (Threshold > 50 ppm). Alert triggered!', 'error');
      onRefresh();
    } catch (e) {
      onShowToast('Gas injection failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTempSpike = async () => {
    setLoadingAction('temp');
    try {
      await api.injectTempSpike(33.5);
      onShowToast('Temperature Excursion Injected: 33.5°C (Threshold > 28°C). Alert triggered!', 'error');
      onRefresh();
    } catch (e) {
      onShowToast('Temp injection failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTamper = async () => {
    setLoadingAction('tamper');
    try {
      await api.triggerTamper();
      onShowToast('Enclosure Tamper Asserted: Lid opened outside authorized checkpoint!', 'error');
      onRefresh();
    } catch (e) {
      onShowToast('Tamper trigger failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleBlockchainAnchor = async () => {
    setLoadingAction('anchor');
    try {
      const res = await api.anchorBlockchain();
      if (res.status === 'anchored') {
        onShowToast(`Merkle Root ${res.merkle_root.substring(0, 14)}... anchored on Polygon zkEVM (Block #${res.block_number})`, 'success');
      }
      onRefresh();
    } catch (e) {
      onShowToast('Anchoring failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCorruptHash = async () => {
    setLoadingAction('corrupt');
    try {
      const res = await api.corruptHashForAudit();
      onShowToast(`Record #${res.sequence} hash corrupted in DB. Run Traceability Verification to see integrity detection!`, 'warning');
      onRefresh();
    } catch (e) {
      onShowToast('Corrupt test failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 text-slate-800 px-4 py-2.5 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Simulation Label & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>SIH26232 IoT SIMULATOR</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
              {isOnline ? 'Node Online' : 'Node Offline (Queuing)'}
            </span>

            {queuedCount > 0 && (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {queuedCount} Queued in Flash
              </span>
            )}
          </div>
        </div>

        {/* Right: Simulation Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Step 1: Tick single telemetry */}
          <button
            onClick={handleTick}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition font-medium cursor-pointer shadow-2xs"
            title="Generate next sequential telemetry sample"
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>Emit Reading</span>
          </button>

          {/* Step 2: Disconnect / Reconnect Network */}
          {isOnline ? (
            <button
              onClick={() => handleToggleNetwork(false)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition font-semibold cursor-pointer shadow-2xs"
              title="Simulate network loss (blindspot) and start local offline queue"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate Offline</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleNetwork(true)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition font-semibold cursor-pointer shadow-2xs"
              title="Restore network connectivity"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Go Online</span>
            </button>
          )}

          {/* Step 3: MQTT Burst Sync */}
          <button
            onClick={handleBatchSync}
            disabled={loadingAction !== null || queuedCount === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition border shadow-2xs ${
              queuedCount > 0 
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 cursor-pointer animate-pulse' 
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            }`}
            title="Burst transmit all locally buffered records from edge flash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'sync' ? 'animate-spin' : ''}`} />
            <span>Burst Sync ({queuedCount})</span>
          </button>

          {/* Step 4: Spoilage Injections */}
          <button
            onClick={handleGasSpike}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition font-medium cursor-pointer shadow-2xs"
            title="Inject premature fruit ripening ethylene burst (> 50 ppm)"
          >
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Gas Spike</span>
          </button>

          <button
            onClick={handleTempSpike}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition font-medium cursor-pointer shadow-2xs"
            title="Inject refrigeration failure temperature spike (> 28°C)"
          >
            <Thermometer className="w-3.5 h-3.5 text-rose-600" />
            <span>Temp Spike</span>
          </button>

          {/* Step 5: Cryptographic Tampering */}
          <button
            onClick={handleCorruptHash}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition font-medium cursor-pointer shadow-2xs"
            title="Deliberately corrupt database record hash to demonstrate cryptographic fraud detection"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            <span>Corrupt Hash</span>
          </button>

          {/* Step 6: Anchor to Ledger */}
          <button
            onClick={handleBlockchainAnchor}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition cursor-pointer shadow-xs"
            title="Derive Merkle root and anchor telemetry batch to Polygon zkEVM"
          >
            <Database className="w-3.5 h-3.5 text-emerald-200" />
            <span>Anchor Proof</span>
          </button>

        </div>

      </div>
    </div>
  );
};
