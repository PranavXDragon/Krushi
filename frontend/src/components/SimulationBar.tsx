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
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: SIH Simulation Label & Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SIH26232 SIMULATION LAB</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${
              isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {isOnline ? 'NODE: ONLINE' : 'NODE: OFFLINE (QUEUEING)'}
            </span>

            {queuedCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                {queuedCount} Queued Records
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
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Generate next sequential telemetry sample"
          >
            <Play className="w-3 h-3 text-teal-400" />
            <span>Emit Reading</span>
          </button>

          {/* Step 2: Disconnect / Reconnect Network */}
          {isOnline ? (
            <button
              onClick={() => handleToggleNetwork(false)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition font-medium"
              title="Simulate network loss (blindspot) and start local offline queue"
            >
              <WifiOff className="w-3 h-3" />
              <span>Simulate Offline</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleNetwork(true)}
              disabled={loadingAction !== null}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition font-medium"
              title="Restore network connection"
            >
              <Wifi className="w-3 h-3" />
              <span>Reconnect Network</span>
            </button>
          )}

          {/* Step 3: MQTT Batch Sync */}
          <button
            onClick={handleBatchSync}
            disabled={loadingAction !== null || queuedCount === 0}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border transition font-medium ${
              queuedCount > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 animate-pulse'
                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
            title="Flush queued offline telemetry over MQTT with sequence validation"
          >
            <RefreshCw className="w-3 h-3" />
            <span>MQTT Batch Sync ({queuedCount})</span>
          </button>

          {/* Step 4: Excursion Injections */}
          <button
            onClick={handleGasSpike}
            disabled={loadingAction !== null}
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
            title="Simulate Ethylene / Spoilage gas surge"
          >
            <Flame className="w-3 h-3" />
            <span>Gas Spike</span>
          </button>

          <button
            onClick={handleTempSpike}
            disabled={loadingAction !== null}
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition"
            title="Simulate Cold Chain failure (> 28°C)"
          >
            <Thermometer className="w-3 h-3" />
            <span>Temp Spike</span>
          </button>

          <button
            onClick={handleTamper}
            disabled={loadingAction !== null}
            className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 transition"
            title="Simulate box lid switch opened"
          >
            <Lock className="w-3 h-3" />
            <span>Tamper Box</span>
          </button>

          {/* Step 5: Blockchain Anchor */}
          <button
            onClick={handleBlockchainAnchor}
            disabled={loadingAction !== null}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition font-medium"
            title="Anchor Merkle Root of current batch to Polygon zkEVM"
          >
            <Database className="w-3 h-3" />
            <span>Anchor zkEVM</span>
          </button>

          {/* Step 6: Test Tamper Detection */}
          <button
            onClick={handleCorruptHash}
            disabled={loadingAction !== null}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-700/60 transition"
            title="Corrupt hash in DB to demonstrate tamper detection in Verification tab"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Test Tamper Audit</span>
          </button>
        </div>

      </div>
    </div>
  );
};
