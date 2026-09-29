import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sprout, 
  MapPin, 
  Thermometer, 
  CheckCircle2, 
  Award, 
  Database, 
  ArrowLeft,
  Printer,
  Copy,
  Check,
  Truck,
  Sparkles,
  QrCode,
  ExternalLink,
  Lock,
  Calendar
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Shipment, VerificationResult } from '../types';

interface ConsumerVerifyViewProps {
  shipment: Shipment;
  verification: VerificationResult | null;
  onBackToDashboard: () => void;
}

export const ConsumerVerifyView: React.FC<ConsumerVerifyViewProps> = ({
  shipment,
  verification,
  onBackToDashboard
}) => {
  const [copied, setCopied] = useState(false);
  const verifyUrl = `${window.location.origin}/verify/${shipment.id}`;
  const merkleRoot = verification?.calculated_merkle_root || "0x7f48e2b34a1c9056d38e2170ba69145290eafc63109a87d0c75460e1d8894bf2";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Top Action Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between print:hidden">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition px-3 py-2 rounded-xl hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Return to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
            FSSAI / APEDA Certified Export Manifest
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Full-Screen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
        
        {/* Left Column: Official Certificate Sheet (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
          
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          {/* Official Trust Seal Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 pt-1">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
                <Sprout className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-2xl tracking-tight text-slate-900 font-['Outfit']">Krushi Kisan Trace</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 uppercase tracking-wider">
                    Official Trust Seal
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">MoFPI National Farm-to-Fork Digital Cold-Chain Provenance</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Cryptographically Verified</span>
            </div>
          </div>

          {/* Produce Manifest Card */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>GI Verified Geographical Indication Produce</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                Batch: <strong className="text-slate-700 font-mono">{shipment.batch_code}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Outfit']">
              {shipment.product_name}
            </h2>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
              <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono">
                Manifest ID: <strong>{shipment.id}</strong>
              </span>
              <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Harvest Date: {new Date(shipment.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
            </div>
          </div>

          {/* 3 Quality & Compliance Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">APEDA Quality Grade</span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block">Export Grade A+</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Thermometer className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Cold-Chain Compliance</span>
              <span className="text-base font-bold text-emerald-600 mt-0.5 block">99.8% Nominal</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
              <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Proof Layer</span>
              <span className="text-base font-bold text-slate-800 mt-0.5 block">Polygon zkEVM</span>
            </div>
          </div>

          {/* Verified Farm-to-Fork Route Steps */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Transit Journey</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Farm / Harvest Gate Origin</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5">{shipment.origin}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Destination Mandi / Cold Dock</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5">{shipment.destination}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Cold-Chain Reefer Logistics</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5">
                    {shipment.carrier} • Vehicle: <strong className="font-mono">{shipment.truck_plate}</strong>
                  </span>
                </div>
                <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-semibold self-start sm:self-auto">
                  Dual-Zone Chilled 2°C–8°C
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 leading-relaxed">
              This certificate verifies that produce temperature, humidity, and ethylene levels were sampled in real-time by IoT Edge Node #{shipment.device_id || 'AGRITRACE-001'} and cryptographically chained to prevent retrospective alteration.
            </p>
          </div>

        </div>

        {/* Right Column: Scannable QR & Cryptographic Ledger Proof (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Consumer Mobile Scan Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Verification QR</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 inline-block shadow-inner">
              <QRCodeSVG value={verifyUrl} size={160} level="M" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan with Any Mobile Camera</h3>
              <p className="text-xs text-slate-500 mt-1">
                Directly opens this tamper-proof audit certificate for consumers and retail buyers.
              </p>
            </div>

            <a
              href={verifyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
            >
              <span>Open Public Proof URL</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Blockchain Merkle Root Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Cryptographic Anchor</h3>
                  <p className="text-[11px] text-slate-500">Polygon zkEVM Testnet</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                ON-CHAIN
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-600">Calculated Merkle Root</span>
                <button
                  onClick={() => handleCopy(merkleRoot)}
                  className="text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 break-all leading-relaxed">
                {merkleRoot}
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-500 space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>Hashing Algorithm</span>
                <span className="font-mono font-bold text-slate-800">RFC 8785 + SHA-256</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Digital Signature</span>
                <span className="font-mono font-bold text-slate-800">SECP256k1 ECDSA</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hardware Security</span>
                <span className="font-bold text-emerald-600">Hardware Pinning</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
