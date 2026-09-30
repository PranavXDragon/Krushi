import './Sidebar.css';
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Cpu, 
  Activity, 
  GitBranch, 
  AlertTriangle, 
  BarChart3, 
  QrCode, 
  ChevronDown, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Sprout,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openAlertsCount
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [shipmentsExpanded, setShipmentsExpanded] = React.useState(true);
  const [devicesExpanded, setDevicesExpanded] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Farmer Dashboard', icon: LayoutDashboard },
    { 
      id: 'shipments', 
      label: 'Shipments & Routes', 
      icon: Truck, 
      hasSub: true,
      subItems: [
        { id: 'active-shipments', label: 'Active Shipments' },
        { id: 'create-shipment', label: 'Create Shipment' },
        { id: 'shipment-history', label: 'Transit History' }
      ]
    },
    { 
      id: 'devices', 
      label: 'IoT Hardware Nodes', 
      icon: Cpu, 
      hasSub: true,
      subItems: [
        { id: 'device-list', label: 'Node Status' },
        { id: 'assign-device', label: 'Assign to Truck' }
      ]
    },
    { id: 'monitoring', label: 'Live Cold-Chain', icon: Activity },
    { id: 'traceability', label: 'Farm-to-Fork Audit', icon: GitBranch },
    { id: 'alerts', label: 'Alerts & Warnings', icon: AlertTriangle, badge: openAlertsCount },
    { id: 'analytics', label: 'Quality & Freshness', icon: BarChart3 },
    { id: 'consumer-view', label: 'Consumer Certificate', icon: QrCode }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white text-slate-700 flex flex-col flex-shrink-0 min-h-screen transition-all duration-300 select-none border-r border-slate-200 shadow-xs z-20`}>
      
      {/* Brand Header */}
      <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100 bg-white">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 block leading-none font-['Outfit']">Krushi</span>
              <span className="text-[11px] text-emerald-700 font-semibold tracking-wide uppercase mt-1 block">Kisan Cold-Chain</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Sprout className="w-6 h-6" />
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.subItems && item.subItems.some(s => s.id === activeTab));

          if (item.hasSub && !isCollapsed) {
            const isExpanded = item.id === 'shipments' ? shipmentsExpanded : devicesExpanded;
            const toggleExpand = () => {
              if (item.id === 'shipments') setShipmentsExpanded(!shipmentsExpanded);
              if (item.id === 'devices') setDevicesExpanded(!devicesExpanded);
            };

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={toggleExpand}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="pl-10 space-y-1 py-1">
                    {item.subItems?.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveTab(sub.id)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          activeTab === sub.id 
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition group ${
                activeTab === item.id 
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold' 
                  : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>

              {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Pill Card (Farmer & Citizen Friendly) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 m-3 rounded-2xl border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-slate-800">Kisan Live Sync Active</p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Government MoFPI Verified Node</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Chain Secure</span>
          </div>
        </div>
      )}

    </aside>
  );
};
