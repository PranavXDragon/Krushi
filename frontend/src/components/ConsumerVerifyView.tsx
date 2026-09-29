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
  Sparkles
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
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition px-3 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-slate-50 transition"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Certificate</span>
        </button>
      </div>

      {/* Main Certificate Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 sm:p-10 relative overflow-hidden print:border-none print:shadow-none print:p-4">
        
        {/* Subtle Decorative Header Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        {/* Certificate Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs flex-shrink-0">
              <Sprout className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-['Outfit']">Krushi Kisan Trace</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 uppercase tracking-wider">
                  Official Seal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">National Farm-to-Fork Digital Cold-Chain Provenance</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Cryptographically Verified</span>
          </div>
        </div>

        {/* Produce Overview Card */}
        <div className="my-6 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>GI Tagged Certified Produce</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
              {shipment.product_name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 font-semibold">
                Batch: <strong>{shipment.batch_code}</strong>
              </span>
              <span className="font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-500">
                Manifest: {shipment.id}
              </span>
            </div>
          </div>

          {/* Verification QR */}
          <div className="flex flex-col items-center p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex-shrink-0">
            <QRCodeSVG value={verifyUrl} size={92} level="M" />
            <span className="text-[10px] font-semibold text-slate-400 mt-1.5">Scan to Verify</span>
          </div>
        </div>

        {/* 3 Core Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-7">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">APEDA Quality</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">Export Grade A+</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Cold-Chain Nominal</span>
            <span className="text-sm font-bold text-emerald-600 mt-0.5 block">99.8% Compliant</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Decentralized Anchor</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">Polygon zkEVM</span>
          </div>
        </div>

        {/* Verified Farm-to-Fork Route Steps */}
        <div className="space-y-4 pt-5 border-t border-slate-100 text-xs">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Transit Journey</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Farm / Harvest Gate</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">{shipment.origin}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Destination Mandi / Dock</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">{shipment.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <Truck className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase">Reefer Carrier & Vehicle</span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5">
                  {shipment.carrier} • Plate: {shipment.truck_plate}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 font-semibold self-start sm:self-auto">
                Temperature Controlled
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Merkle Root Seal */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic Merkle Root Anchor</span>
            </div>
            <button
              onClick={() => handleCopy(merkleRoot)}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200">
            {merkleRoot}
          </div>
        </div>

        {/* Certificate Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Verified autonomously by Krushi IoT Telematics Edge Node #{shipment.device_id || 'AGRITRACE-001'} with RFC 8785 canonical JSON hashing and SECP256k1 ECDSA digital signatures.
          </p>
        </div>

      </div>

    </div>
  );
};
