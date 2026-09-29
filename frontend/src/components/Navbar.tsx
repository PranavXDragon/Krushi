import React from 'react';
import { Search, Bell, Sun, ArrowRight, ShieldCheck, Sprout } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openAlertsCount: number;
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  searchQuery,
  setSearchQuery,
  openAlertsCount,
  onOpenAlerts
}) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">{title}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
      </div>

      {/* Right Controls: Search, Notifications, Farmer Profile */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar */}
        <div className="relative w-80 hidden md:block">
          <input
            type="text"
            placeholder="Search crop, truck plate, mandi, batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 transition shadow-xs">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <button 
            onClick={onOpenAlerts}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Alerts Center"
          >
            <Bell className="w-5 h-5" />
            {openAlertsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
            )}
          </button>
        </div>

        {/* Farmer & Citizen Friendly Profile Badge */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex items-center gap-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 p-1.5 pr-3.5 rounded-xl border border-emerald-200/80 transition cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              <Sprout className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-900 block leading-tight">Farmer Portal</span>
              <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase block">Kisan Hub</span>
            </div>
          </div>
        </div>

      </div>

    </header>
  );
};
