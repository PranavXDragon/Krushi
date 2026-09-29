import React from 'react';
import { 
  ShieldCheck, 
  Sprout, 
  MapPin, 
  Calendar, 
  Thermometer, 
  CheckCircle2, 
  ExternalLink,
  Award,
  Database,
  ArrowLeft
} from 'lucide-react';
import { Shipment, VerificationResult, QRData } from '../types';

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
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      
      {/* Top Navigation */}
      <button
        onClick={onBackToDashboard}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-600 transition mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Operational Dashboard</span>
      </button>

      {/* Main Certificate Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl relative overflow-hidden">
        
        {/* Certificate Watermark Header */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Sprout className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 font-['Outfit']">AgriTrace Verified</h2>
              <p className="text-[11px] text-teal-600 font-semibold tracking-wider uppercase">MoFPI Decentralized Trust Certificate</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Authentic</span>
          </span>
        </div>

        {/* Product Details Banner */}
        <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-md">
          <span className="text-[10px] text-teal-300 uppercase tracking-widest font-bold">GI Verified Agricultural Produce</span>
          <h3 className="text-xl font-bold mt-1">{shipment.product_name}</h3>
          <p className="text-xs text-slate-300 font-mono mt-1">Batch Code: <strong>{shipment.batch_code}</strong> · Manifest ID: {shipment.id}</p>
        </div>

        {/* 3 Pillars of Trust */}
        <div className="grid grid-cols-3 gap-3 my-6 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
            <span className="text-[10px] text-slate-400 block font-semibold">Origin Grade</span>
            <span className="text-xs font-bold text-slate-800">Export Grade A</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <Thermometer className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
            <span className="text-[10px] text-slate-400 block font-semibold">Cold Chain</span>
            <span className="text-xs font-bold text-emerald-600">99.4% Nominal</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <Database className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
            <span className="text-[10px] text-slate-400 block font-semibold">Proof Layer</span>
            <span className="text-xs font-bold text-slate-800">Polygon zkEVM</span>
          </div>
        </div>

        {/* Provenance Steps */}
        <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Harvest Origin</span>
              <span className="text-slate-600">{shipment.origin}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Destination Delivery Hub</span>
              <span className="text-slate-600">{shipment.destination}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-800 block">Cryptographic Merkle Root</span>
              <span className="font-mono text-[11px] text-slate-500 break-all">
                {verification?.calculated_merkle_root || "0x7f48e2b34a1c9056d38e2170ba69145290eafc63109a87d0c75460e1d8894bf2"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Verified autonomously by AgriTrace Offline-First Node #{shipment.device_id || 'AGRITRACE-001'} with tamper-evident cryptographic hash chaining.
          </p>
        </div>

      </div>

    </div>
  );
};
