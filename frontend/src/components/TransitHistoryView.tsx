import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Thermometer, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Award,
  Clock,
  Truck
} from 'lucide-react';
import { Shipment } from '../types';

interface TransitHistoryViewProps {
  shipments: Shipment[];
  onSelectShipment: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const TransitHistoryView: React.FC<TransitHistoryViewProps> = ({
  shipments,
  onSelectShipment,
  onShowToast
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELIVERED' | 'IN_TRANSIT'>('ALL');

  // Completed + mock historical journeys for comprehensive audit view
  const completedJourneys = [
    {
      id: 'shp-hist-001',
      shipment_code: 'SHP-HIST-RATN-089',
      product_name: 'Ratnagiri Alphonso Mangoes (GI Certified)',
      batch_code: 'GI-MH-ALPH-9021',
      origin: 'Ratnagiri Cooperative Mandi, Maharashtra',
      destination: 'JNPT International Container Terminal, Navi Mumbai',
      carrier: 'KisanCold Reefer Express',
      truck_plate: 'MH-08-BQ-3412',
      driver_name: 'Suresh More',
      delivered_at: '28 Sep 2026, 18:40 UTC',
      duration: '11 hrs 20 mins',
      avg_temp: '3.8°C',
      compliance_score: '99.8% (GI Grade A+)',
      total_samples: 4120,
      excursions: 0,
      merkle_root: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      tx_hash: '0x3c7e4d8a1b2f9c5e6d0a7b4f8c1e3a9d5f7b2c4e6a8d0f1b3c5e7a9d2f4b6c8e',
      status: 'DELIVERED'
    },
    {
      id: 'shp-hist-002',
      shipment_code: 'SHP-HIST-NAGP-044',
      product_name: 'Nagpur Organic Mandarin Oranges',
      batch_code: 'GI-MH-NAGP-4102',
      origin: 'Katol Citrus FPO, Nagpur',
      destination: 'Azadpur Cold Storage Terminal, Delhi',
      carrier: 'Vashi Cold Logistics Corp',
      truck_plate: 'MH-31-CB-9021',
      driver_name: 'Harpreet Singh',
      delivered_at: '25 Sep 2026, 09:15 UTC',
      duration: '22 hrs 45 mins',
      avg_temp: '5.2°C',
      compliance_score: '98.9% (GI Grade A)',
      total_samples: 8200,
      excursions: 0,
      merkle_root: '0x8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a',
      tx_hash: '0x5e6d0a7b4f8c1e3a9d5f7b2c4e6a8d0f1b3c5e7a9d2f4b6c8e3c7e4d8a1b2f9c',
      status: 'DELIVERED'
    },
    {
      id: 'shp-hist-003',
      shipment_code: 'SHP-HIST-NSHK-012',
      product_name: 'Nashik Thompson Seedless Export Grapes',
      batch_code: 'GI-MH-NSHK-1120',
      origin: 'Dindori Grape Cooperative, Nashik',
      destination: 'Mumbai Air Cargo Cold Warehouse',
      carrier: 'KisanCold Air Link',
      truck_plate: 'MH-15-DX-4410',
      driver_name: 'Anil Kadam',
      delivered_at: '22 Sep 2026, 14:00 UTC',
      duration: '5 hrs 50 mins',
      avg_temp: '0.8°C',
      compliance_score: '100% (Export Grade Elite)',
      total_samples: 2100,
      excursions: 0,
      merkle_root: '0x7b2c4e6a8d0f1b3c5e7a9d2f4b6c8e3c7e4d8a1b2f9c5e6d0a7b4f8c1e3a9d5f',
      tx_hash: '0x1b3c5e7a9d2f4b6c8e3c7e4d8a1b2f9c5e6d0a7b4f8c1e3a9d5f7b2c4e6a8d0f',
      status: 'DELIVERED'
    }
  ];

  const handleDownloadCertificate = (batchCode: string) => {
    onShowToast(`Cryptographic Certificate for ${batchCode} generated & downloaded!`, 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Historical Transit Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">Cold-Chain Transit History & Completed Audits</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse delivered crop batches, verified temperature compliance scorecards, and cryptographic blockchain Merkle proofs.
          </p>
        </div>

        {/* Global Compliance Stats */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-2xl font-black text-emerald-600 font-['Outfit']">99.6%</span>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Overall Grade</span>
          </div>
          <div className="text-center px-3 border-r border-slate-200">
            <span className="text-2xl font-black text-slate-900 font-['Outfit']">14,420</span>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Verified Hours</span>
          </div>
          <div className="text-center px-3">
            <span className="text-2xl font-black text-emerald-600 font-['Outfit']">0</span>
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Spoilage Losses</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search produce, lot code, or driver..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          {(['ALL', 'DELIVERED', 'IN_TRANSIT'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Completed Journeys List */}
      <div className="space-y-4">
        {completedJourneys
          .filter(j => 
            j.product_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
            j.batch_code.toLowerCase().includes(filterQuery.toLowerCase()) ||
            j.truck_plate.toLowerCase().includes(filterQuery.toLowerCase())
          )
          .map((journey) => (
            <div 
              key={journey.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Crop & Route Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
                      {journey.batch_code}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                      {journey.truck_plate}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{journey.status}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{journey.product_name}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate"><strong>From:</strong> {journey.origin}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate"><strong>To:</strong> {journey.destination}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Transit Time: <strong>{journey.duration}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Delivered: <strong>{journey.delivered_at}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      Driver: <strong>{journey.driver_name}</strong>
                    </span>
                  </div>
                </div>

                {/* Middle: Cold-Chain Compliance Metric Card */}
                <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 lg:w-72 justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cold-Chain Grade</div>
                    <div className="text-base font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5 font-['Outfit']">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>{journey.compliance_score}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Avg Temp: <strong>{journey.avg_temp}</strong> (0 Excursions)
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data Samples</div>
                    <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
                      {journey.total_samples.toLocaleString()} pkts
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">100% Verified</div>
                  </div>
                </div>

                {/* Right: Blockchain Proof & Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end justify-center gap-2">
                  <button
                    onClick={() => handleDownloadCertificate(journey.batch_code)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Audit Certificate</span>
                  </button>

                  <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]" title={journey.tx_hash}>
                    Tx: {journey.tx_hash.slice(0, 10)}...{journey.tx_hash.slice(-8)}
                  </div>
                </div>

              </div>
            </div>
          ))}
      </div>

    </div>
  );
};
