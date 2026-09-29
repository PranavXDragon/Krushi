import React from 'react';
import { Search, Bell, Moon, Sun, ArrowRight, ShieldCheck, Wifi } from 'lucide-react';

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
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-[45px] z-30 shadow-xs">
      
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-['Outfit']">{title}</h1>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Right Controls: Search, Notifications, User Profile */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar */}
        <div className="relative w-80 hidden md:block">
          <input
            type="text"
            placeholder="Search shipments, devices, batches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-teal-500 hover:text-white text-slate-600 flex items-center justify-center absolute right-1.5 top-1/2 -translate-y-1/2 transition">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <button 
            onClick={onOpenAlerts}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Alerts Center"
          >
            <Bell className="w-5 h-5" />
            {openAlertsCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
            )}
          </button>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* User Badge Profile (Matching exact UI screenshot) */}
        <div className="flex items-center gap-3 pl-2">
          <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/80 p-1.5 pr-3 rounded-full border border-slate-200/80 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              K
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block leading-tight">Kritika Gupta</span>
              <span className="text-[9px] font-semibold text-teal-600 tracking-wider uppercase block">FARMER</span>
            </div>
          </div>
        </div>

      </div>

    </header>
  );
};
