import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Cpu, 
  Activity, 
  GitBranch, 
  AlertTriangle, 
  BarChart3, 
  ShoppingBag, 
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'shipments', 
      label: 'Shipments', 
      icon: Truck, 
      hasSub: true,
      subItems: [
        { id: 'active-shipments', label: 'Active Shipments' },
        { id: 'create-shipment', label: 'Create Shipment' },
        { id: 'shipment-history', label: 'Shipment History' }
      ]
    },
    { 
      id: 'devices', 
      label: 'Devices', 
      icon: Cpu, 
      hasSub: true,
      subItems: [
        { id: 'device-list', label: 'Device List' },
        { id: 'assign-device', label: 'Assign Device' }
      ]
    },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'traceability', label: 'Traceability', icon: GitBranch },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: openAlertsCount },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'consumer-view', label: 'Consumer View', icon: QrCode }
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-[#0F1E2E] text-slate-300 flex flex-col flex-shrink-0 min-h-screen transition-all duration-300 select-none border-r border-slate-800`}>
      
      {/* Brand Header */}
      <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white block leading-none font-['Outfit']">AgriTrace</span>
              <span className="text-[10px] text-teal-400 tracking-wider uppercase font-semibold mt-1 block">SIH 26232 Node</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg">
            <Sprout className="w-6 h-6" />
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive 
                      ? 'bg-teal-500/10 text-teal-400 font-semibold' 
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
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
                            ? 'bg-teal-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                activeTab === item.id 
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 font-semibold' 
                  : 'hover:bg-slate-800/60 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
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

      {/* Footer Pill Card (Matching SIH Demo Reference UI) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-white">AgriTrace Demo Network</p>
              <p className="text-[10px] text-slate-400">Smart India Hackathon MVP</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-teal-400/90 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>zkEVM Cryptographic Sync Active</span>
          </div>
        </div>
      )}

    </aside>
  );
};
