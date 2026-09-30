import './AnalyticsView.css';
import React from 'react';
import { 
  Package, 
  CheckCircle, 
  Shield, 
  Clock, 
  Radio, 
  Truck,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { AnalyticsData } from '../../types';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics }) => {
  const kpis = analytics?.kpis || {
    total_shipments: 1,
    successful_deliveries: 0,
    alert_free_shipments: 0,
    average_delivery_time: "5h 42m",
    device_uptime: "99.8%",
    active_now: 1,
    open_alerts: 3,
    resolved_alerts: 3,
    devices_online: 2,
    devices_offline: 1
  };

  const chartData = [
    { day: 'Fri', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Fri', count: 0 },
    { day: 'Fri', count: 4 },
    { day: 'Fri', count: 1 }
  ];

  return (
    <div className="space-y-6">
      
      {/* 6 Top Metric Cards (Matching exact UI reference screenshot) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* 1. Total Shipments */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Package className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Total Shipments</span>
          <span className="text-2xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.total_shipments}
          </span>
        </div>

        {/* 2. Successful Deliveries */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Successful Deliveries</span>
          <span className="text-2xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.successful_deliveries}
          </span>
        </div>

        {/* 3. Alert-Free Shipments */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Alert-Free Shipments</span>
          <span className="text-2xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.alert_free_shipments}
          </span>
        </div>

        {/* 4. Average Delivery Time */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Average Delivery Time</span>
          <span className="text-xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.average_delivery_time}
          </span>
        </div>

        {/* 5. Device Uptime */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <Radio className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Device Uptime</span>
          <span className="text-2xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.device_uptime}
          </span>
        </div>

        {/* 6. Active Now */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Truck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 block">Active Now</span>
          <span className="text-2xl font-bold text-slate-800 font-['Outfit'] mt-1 block">
            {kpis.active_now}
          </span>
        </div>

      </div>

      {/* Row 2: Shipments per Week & Shipment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Shipments per Week Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Shipments per Week</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F1E2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#3B82F6' }} 
                  activeDot={{ r: 6, fill: '#1D4ED8' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipment Status Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Shipment Status Distribution</h3>
          
          <div className="space-y-4 pt-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>DEVICE_ASSIGNED / IN_TRANSIT</span>
                <span>100%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>DELIVERED & VERIFIED</span>
                <span>0%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-0" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>FAILED / EXCEPTION</span>
                <span>0%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full w-0" />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Alerts Overview & Device Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerts Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Alerts Overview</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Open Exceptions</span>
                <span className="text-rose-600 font-bold">{kpis.open_alerts}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(kpis.open_alerts / 6) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Resolved</span>
                <span className="text-slate-600 font-bold">{kpis.resolved_alerts}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full" style={{ width: `${(kpis.resolved_alerts / 6) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Device Status</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Online</span>
              <div className="text-2xl font-bold text-emerald-600 font-['Outfit'] mt-1">{kpis.devices_online}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Offline</span>
              <div className="text-2xl font-bold text-slate-700 font-['Outfit'] mt-1">{kpis.devices_offline}</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
