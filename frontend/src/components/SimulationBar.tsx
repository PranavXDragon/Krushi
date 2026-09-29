import React from 'react';
import { 
  Play, 
  WifiOff, 
  Wifi, 
  RefreshCw, 
  Flame, 
  Thermometer, 
  ShieldAlert, 
  Database,
  Radio,
  Cpu,
  Layers
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
        onShowToast(`Sample #${res.record.sequence} generated and queued in edge flash (Offline Mode)`, 'warning');
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
      onShowToast('Ethylene Spike Injected: 64.8 ppm (Threshold > 50 ppm). Excursion alert triggered!', 'error');
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
      onShowToast('Temperature Excursion Injected: 33.5°C (Threshold > 8°C). Cold-chain breach triggered!', 'error');
      onRefresh();
    } catch (e) {
      onShowToast('Temp injection failed', 'error');
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
      onShowToast(`Record #${res.sequence} hash corrupted in DB. Traceability engine will flag tamper!`, 'warning');
      onRefresh();
    } catch (e) {
      onShowToast('Corrupt test failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Hardware Node Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-semibold tracking-wide text-slate-200">ESP32-S3 #01</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase border ${
              isOnline 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80' 
                : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {isOnline ? 'Online (MQTT/HTTPS)' : 'Offline (Queuing)'}
            </span>

            {queuedCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                {queuedCount} in Flash
              </span>
            )}
          </div>
        </div>

        {/* Right: Grouped Testbed Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Group 1: Telemetry Ingest & Connectivity */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={handleTick}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition cursor-pointer shadow-xs disabled:opacity-50 text-[11px]"
              title="Generate and ingest next sequential telemetry sample"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Emit Reading</span>
            </button>

            {isOnline ? (
              <button
                onClick={() => handleToggleNetwork(false)}
                disabled={loadingAction !== null}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-300 hover:text-amber-300 hover:bg-slate-700/60 transition cursor-pointer disabled:opacity-50 text-[11px]"
                title="Simulate network blindspot (switches device to offline ring buffer)"
              >
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>Simulate Offline</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleNetwork(true)}
                disabled={loadingAction !== null}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-emerald-300 hover:bg-slate-700/60 transition cursor-pointer disabled:opacity-50 text-[11px]"
                title="Restore network connectivity"
              >
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Go Online</span>
              </button>
            )}

            <button
              onClick={handleBatchSync}
              disabled={loadingAction !== null || queuedCount === 0}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                queuedCount > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 cursor-pointer animate-pulse' 
                  : 'text-slate-500 cursor-not-allowed'
              }`}
              title="Burst transmit locally buffered records from SPIFFS flash"
            >
              <RefreshCw className={`w-3 h-3 ${loadingAction === 'sync' ? 'animate-spin' : ''}`} />
              <span>Burst Sync ({queuedCount})</span>
            </button>
          </div>

          {/* Group 2: Excursion / Hazard Simulation */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-medium px-2 uppercase tracking-wider hidden sm:inline">Excursion:</span>
            <button
              onClick={handleGasSpike}
              disabled={loadingAction !== null}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-amber-300 hover:bg-amber-500/20 transition cursor-pointer text-[11px]"
              title="Inject ethylene spoilage burst (> 50 ppm)"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Gas Spike</span>
            </button>
            <button
              onClick={handleTempSpike}
              disabled={loadingAction !== null}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-rose-300 hover:bg-rose-500/20 transition cursor-pointer text-[11px]"
              title="Inject refrigeration excursion (> 8°C)"
            >
              <Thermometer className="w-3 h-3 text-rose-400" />
              <span>Temp Spike</span>
            </button>
          </div>

          {/* Group 3: Cryptographic Audit & Blockchain */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={handleCorruptHash}
              disabled={loadingAction !== null}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-purple-300 hover:bg-purple-500/20 transition cursor-pointer text-[11px]"
              title="Corrupt database hash to test automated fraud detection"
            >
              <ShieldAlert className="w-3 h-3 text-purple-400" />
              <span>Corrupt Hash</span>
            </button>
            <button
              onClick={handleBlockchainAnchor}
              disabled={loadingAction !== null}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium transition cursor-pointer text-[11px]"
              title="Derive Merkle root and anchor to Polygon blockchain"
            >
              <Database className="w-3 h-3 text-teal-200" />
              <span>Anchor Proof</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

