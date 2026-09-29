import React from 'react';
import { 
  GitBranch, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Database,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Activity
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Shipment, ShipmentEvent, VerificationResult, QRData } from '../types';
import { api } from '../services/api';

interface TraceabilityViewProps {
  shipment: Shipment;
  shipments?: Shipment[];
  events: ShipmentEvent[];
  verification: VerificationResult | null;
  onSelectShipment?: (id: string) => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  shipment,
  shipments = [],
  events,
  verification,
  onSelectShipment,
  onRefresh,
  onShowToast
}) => {
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [qrData, setQRData] = React.useState<QRData | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [selectedHashBlock, setSelectedHashBlock] = React.useState<any | null>(null);

  const handleOpenQR = async () => {
    try {
      const data = await api.getQRData(shipment.id);
      setQRData(data);
      setShowQRModal(true);
    } catch (e) {
      onShowToast('Could not fetch QR code details', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Copied hash to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const isChainValid = verification?.is_chain_valid ?? true;
  const latestAnchor = verification?.latest_anchor;

  return (
    <div className="space-y-8">
      
      {/* Top Header Card with Verification Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {shipment.id}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-teal-600">{shipment.product_name}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-1">Farm-to-Fork Cryptographic Provenance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable sensor ledger and verifiable physical handover history from {shipment.origin} to {shipment.destination}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Shipment Switcher */}
          {shipments.length > 0 && onSelectShipment && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Produce:</span>
              <select
                value={shipment.id}
                onChange={(e) => onSelectShipment(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs"
              >
                {shipments.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.product_name} ({s.batch_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* QR Code Action Button */}
          <button
            onClick={handleOpenQR}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
          >
            <QrCode className="w-4 h-4 text-teal-400" />
            <span>Generate Consumer QR</span>
          </button>

          {/* Audit Verification Trigger */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Proof Chain</span>
          </button>
        </div>
      </div>

      {/* Verification Summary Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isChainValid 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : 'bg-rose-50 border-rose-300 text-rose-950'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
              isChainValid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-bounce'
            }`}>
              {isChainValid ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {isChainValid ? 'Cryptographic Integrity Status: VERIFIED TAMPER-PROOF' : 'Integrity Audit Warning: SEQUENCE TAMPER DETECTED'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isChainValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                }`}>
                  {verification?.verification_status || 'VERIFIED'}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                {isChainValid 
                  ? (verification?.total_records_checked ?? 0) === 0
                    ? 'Hash chain verified. Ready to ingest and cryptographically verify incoming live ESP32 records.'
                    : `All ${verification?.total_records_checked} sequential telemetry records match their chained SHA-256 digests and ECDSA device signature.`
                  : `A stored telemetry hash failed mathematical verification! The record was modified in storage without private device key.`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold text-slate-500">Calculated Merkle Root:</div>
            <div className="text-xs font-mono font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5">
              {verification?.calculated_merkle_root ? `${verification.calculated_merkle_root.substring(0, 20)}...` : 'Pending Telemetry...'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Farm-to-Fork Timeline & Blockchain Proof Anchor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Farm-to-Fork Event Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Shipment Lifecycle Events</h3>
              <p className="text-xs text-slate-500">Chain of custody timestamps and physical inspection milestones</p>
            </div>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
              {events.length} Milestones
            </span>
          </div>

          {/* Vertical Timeline */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {events.map((evt, idx) => {
              const isExcursion = evt.severity === 'critical';
              const isSuccess = evt.severity === 'success';
              const isWarning = evt.severity === 'warning';

              return (
                <div key={evt.id || idx} className="relative group">
                  {/* Timeline node icon */}
                  <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    isExcursion 
                      ? 'border-rose-500 ring-4 ring-rose-100' 
                      : isSuccess 
                      ? 'border-emerald-500 ring-4 ring-emerald-100' 
                      : isWarning
                      ? 'border-amber-500 ring-4 ring-amber-100'
                      : 'border-teal-500 ring-4 ring-teal-100'
                  }`} />

                  {/* Event content box */}
                  <div className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-xl border border-slate-200/70 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isExcursion 
                            ? 'bg-rose-100 text-rose-700' 
                            : isSuccess 
                            ? 'bg-emerald-100 text-emerald-700'
                            : isWarning 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-teal-100 text-teal-700'
                        }`}>
                          {evt.event_type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 mt-1">{evt.title}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{evt.description}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        {evt.location_name}
                      </span>

                      {evt.hash_proof && (
                        <span className="font-mono text-[10px] text-teal-700" title={evt.hash_proof}>
                          Proof: {evt.hash_proof.substring(0, 14)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Blockchain Anchor & Cryptographic Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Blockchain Anchor Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Decentralized Anchor Proof</h3>
                  <p className="text-[11px] text-slate-500">Polygon zkEVM / AgriChain Testnet</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                On-Chain Valid
              </span>
            </div>

            {latestAnchor ? (
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Merkle Root Anchor</label>
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5 font-mono text-[11px] text-slate-700">
                    <span>{latestAnchor.merkle_root.substring(0, 22)}...</span>
                    <button onClick={() => copyToClipboard(latestAnchor.merkle_root)} className="text-slate-400 hover:text-slate-600">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Transaction Hash (TX)</label>
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5 font-mono text-[11px] text-purple-700">
                    <span>{latestAnchor.tx_hash.substring(0, 24)}...</span>
                    <button onClick={() => copyToClipboard(latestAnchor.tx_hash)} className="text-slate-400 hover:text-slate-600">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Block Height</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">#{latestAnchor.block_number}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Network</span>
                    <span className="text-xs font-bold text-slate-800">Polygon zkEVM</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">No on-chain anchors committed yet. Click 'Anchor zkEVM' in the top simulation bar.</p>
            )}
          </div>

          {/* Cryptographic Hash-Chain Inspector */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Chained Digest Inspector</h3>
                  <p className="text-[11px] text-slate-500">Live SHA-256 math verification</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">SHA-256 + ECDSA</span>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Each record incorporates the preceding record's digest into its payload before signing. Click any sequence block to verify:
            </p>

            <div className="space-y-2 mt-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {verification?.detailed_checks?.map((check) => (
                <div
                  key={check.sequence}
                  onClick={() => setSelectedHashBlock(check)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition text-xs font-mono flex items-center justify-between ${
                    check.is_valid 
                      ? 'bg-slate-50 hover:bg-teal-50/50 border-slate-200 text-slate-700' 
                      : 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Seq #{check.sequence}</span>
                    <span className="text-[10px] text-slate-400">Digest: {check.stored_hash.substring(0, 10)}...</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    check.is_valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-600 text-white animate-pulse'
                  }`}>
                    {check.is_valid ? 'MATCH' : 'MISMATCH'}
                  </span>
                </div>
              ))}

              {(!verification?.detailed_checks || verification.detailed_checks.length === 0) && (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-slate-100">
                  <Activity className="w-5 h-5 mx-auto text-emerald-500 mb-1.5 opacity-60" />
                  <span>Waiting for first signed telemetry packet from ESP32 node.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* QR Code Consumer Transparency Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setShowQRModal(false)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center absolute right-4 top-4"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Consumer Transparency QR</h3>
              <p className="text-xs text-slate-500 mt-1">Scan with any smartphone camera for verifiable farm-to-fork origin</p>
            </div>

            {/* QR Code Graphic */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 w-fit mx-auto my-6 shadow-inner">
              <QRCodeSVG
                value={qrData.verification_url}
                size={200}
                bgColor={"#F8FAFC"}
                fgColor={"#0F1E2E"}
                level={"H"}
                includeMargin={false}
              />
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <span className="font-bold text-slate-800">{qrData.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batch Code:</span>
                <span className="font-mono font-bold text-teal-700">{qrData.batch_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Origin:</span>
                <span className="font-medium text-slate-700">{qrData.origin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compliance:</span>
                <span className="font-bold text-emerald-600">{qrData.cold_chain_compliance}</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={`http://localhost:5173/verify/${shipment.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20"
              >
                <span>Open Public Consumer View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Block Hash Inspection Modal */}
      {selectedHashBlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 relative">
            <button 
              onClick={() => setSelectedHashBlock(null)}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center absolute right-4 top-4"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-800">Sequence #{selectedHashBlock.sequence} Cryptographic Audit</h3>
            
            <div className="mt-4 space-y-3 text-xs font-mono">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">Stored Record SHA-256</span>
                <span className="text-slate-800 break-all">{selectedHashBlock.stored_hash}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">Recalculated Canonical SHA-256</span>
                <span className="text-teal-700 break-all">{selectedHashBlock.recalculated_hash}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-sans font-semibold">Previous Linked Hash Pointer</span>
                <span className="text-slate-600 break-all">{selectedHashBlock.previous_hash}</span>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl text-xs font-bold text-center ${
              selectedHashBlock.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {selectedHashBlock.is_valid ? '✓ SHA-256 Digest Matches Perfectly' : '⚠ Hash Mismatch: Data was altered'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
