import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  ArrowRight, 
  Sprout, 
  X, 
  Truck, 
  Cpu, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  Clock,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { Shipment, Device } from '../types';
import { AuthUser } from './AuthModal';

interface NavbarProps {
  title: string;
  subtitle: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openAlertsCount: number;
  onOpenAlerts: () => void;
  shipments?: Shipment[];
  devices?: Device[];
  onSelectShipment?: (id: string) => void;
  onNavigateTab?: (tab: string) => void;
  user?: AuthUser | null;
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  searchQuery,
  setSearchQuery,
  openAlertsCount,
  onOpenAlerts,
  shipments = [],
  devices = [],
  onSelectShipment,
  onNavigateTab,
  user,
  onOpenSignIn,
  onOpenSignUp,
  onSignOut
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const query = searchQuery.trim().toLowerCase();

  // Filter matching shipments
  const matchedShipments = query ? shipments.filter(s => 
    s.product_name.toLowerCase().includes(query) ||
    s.batch_code.toLowerCase().includes(query) ||
    s.origin.toLowerCase().includes(query) ||
    s.destination.toLowerCase().includes(query) ||
    s.truck_plate.toLowerCase().includes(query) ||
    s.driver_name.toLowerCase().includes(query) ||
    s.carrier.toLowerCase().includes(query) ||
    s.id.toLowerCase().includes(query)
  ) : [];

  // Filter matching devices
  const matchedDevices = query ? devices.filter(d =>
    d.id.toLowerCase().includes(query) ||
    d.serial_number.toLowerCase().includes(query) ||
    (d.firmware_version && d.firmware_version.toLowerCase().includes(query))
  ) : [];

  const hasResults = matchedShipments.length > 0 || matchedDevices.length > 0;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectShipment = (id: string) => {
    onSelectShipment?.(id);
    onNavigateTab?.('monitoring');
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectDevice = () => {
    onNavigateTab?.('devices');
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (matchedShipments.length > 0) {
      handleSelectShipment(matchedShipments[0].id);
    } else if (matchedDevices.length > 0) {
      handleSelectDevice();
    } else if (query) {
      onNavigateTab?.('shipments');
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">{title}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
      </div>

      {/* Right Controls: Search, Notifications, Farmer Profile */}
      <div className="flex items-center gap-4">
        
        {/* Global Live Interactive Search Bar */}
        <div ref={containerRef} className="relative w-80 lg:w-96 hidden md:block">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Search crop, truck plate, mandi, batch..."
              value={searchQuery}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-20 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition placeholder:text-slate-400 text-slate-800 shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                type="submit"
                className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-xs cursor-pointer"
                title="Search and jump to crop"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Live Search Results Dropdown Popover */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto custom-scrollbar">
              
              {query && hasResults && (
                <div className="p-2 space-y-1">
                  
                  {/* Matching Shipments Header */}
                  {matchedShipments.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Crops & Live Cargo</span>
                        <span>{matchedShipments.length} found</span>
                      </div>

                      {matchedShipments.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectShipment(s.id)}
                          className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group border border-transparent hover:border-slate-200"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                              <Sprout className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition">
                                  {s.product_name}
                                </h4>
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                                  {s.batch_code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                <span>{s.origin} → {s.destination}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-slate-800 block">
                              {s.latest_telemetry ? `${s.latest_telemetry.temperature.toFixed(1)}°C` : 'Nominal'}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 block">
                              {s.truck_plate}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matching Hardware Devices */}
                  {matchedDevices.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>IoT Edge Hardware</span>
                        <span>{matchedDevices.length} found</span>
                      </div>

                      {matchedDevices.map(d => (
                        <div
                          key={d.id}
                          onClick={handleSelectDevice}
                          className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group border border-transparent hover:border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                              <Cpu className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 font-mono group-hover:text-teal-700 transition">
                                Node #{d.id}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-mono">
                                SN: {d.serial_number}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            d.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* No Results Fallback */}
              {query && !hasResults && (
                <div className="p-6 text-center text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No matching produce or trucks</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    No results found for &ldquo;<span className="font-bold text-slate-600">{searchQuery}</span>&rdquo;. Try searching &ldquo;Mango&rdquo;, &ldquo;Grapes&rdquo;, &ldquo;MH-04&rdquo;, or &ldquo;AGRI-001&rdquo;.
                  </p>
                </div>
              )}

              {/* Quick Search Suggestions (when query is empty) */}
              {!query && (
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Quick Live Searches</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {shipments.slice(0, 4).map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectShipment(s.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
                      >
                        <Sprout className="w-3 h-3 text-emerald-600" />
                        <span>{s.product_name.split(' ')[0]} ({s.batch_code})</span>
                      </button>
                    ))}
                    {devices.slice(0, 2).map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={handleSelectDevice}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
                      >
                        <Cpu className="w-3 h-3 text-teal-600" />
                        <span>{d.id}</span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    Search by crop name, mandi origin/destination, truck plate number, driver, or batch code.
                  </p>
                </div>
              )}

            </div>
          )}
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

        {/* Farmer & Citizen Friendly Profile / Auth Controls */}
        <div ref={profileRef} className="relative pl-2">
          {user ? (
            <div>
              <div 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 p-1.5 pr-3 rounded-xl border border-emerald-200/80 transition cursor-pointer select-none"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[120px]">{user.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase block">
                    {user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-800 block truncate">{user.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                    {user.organization && (
                      <span className="text-[10px] text-emerald-700 font-semibold mt-1 block truncate">
                        🏢 {user.organization}
                      </span>
                    )}
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {user.role} Account
                    </span>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onOpenSignIn?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch Account / Role</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenSignIn}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={onOpenSignUp}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
