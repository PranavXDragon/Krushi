import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MonitoringView } from './components/MonitoringView';
import { TraceabilityView } from './components/TraceabilityView';
import { AlertsView } from './components/AlertsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ShipmentsView } from './components/ShipmentsView';
import { CreateShipmentView } from './components/CreateShipmentView';
import { TransitHistoryView } from './components/TransitHistoryView';
import { DevicesView } from './components/DevicesView';
import { ConsumerVerifyView } from './components/ConsumerVerifyView';
import { AuthModal, AuthUser } from './components/AuthModal';
import { api } from './services/api';
import { Shipment, Device, TelemetryRecord, Alert, ShipmentEvent, VerificationResult, AnalyticsData } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('monitoring');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('04beaccb-7c55-44ab-aa84-2a3f338dcf1c');
  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryList, setTelemetryList] = useState<TelemetryRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Simulation state
  const [isNodeOnline, setIsNodeOnline] = useState<boolean>(true);
  const [queuedRecordsCount, setQueuedRecordsCount] = useState<number>(0);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' | 'info' } | null>(null);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('krushi_user');
      return saved ? JSON.parse(saved) : {
        id: 'usr-c0ec6aa7b6',
        name: 'Rajesh Patil',
        email: 'rajesh.patil@kisan.in',
        role: 'FARMER',
        organization: 'Ratnagiri Alphonso Co-operative',
        created_at: new Date().toISOString()
      };
    } catch {
      return null;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const handleAuthSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('krushi_user', JSON.stringify(user));
      localStorage.setItem('krushi_token', token);
    } catch (e) {
      console.error('Could not save auth to storage:', e);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('krushi_user');
      localStorage.removeItem('krushi_token');
    } catch (e) {
      console.error('Could not remove auth from storage:', e);
    }
    showToast('Signed out of Krushi portal', 'info');
  };

  const showToast = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [shipmentsRes, devicesRes, alertsRes, analyticsRes] = await Promise.all([
        api.getShipments(),
        api.getDevices(),
        api.getAlerts(),
        api.getAnalytics()
      ]);

      setShipments(shipmentsRes);
      setDevices(devicesRes);
      setAlerts(alertsRes);
      setAnalytics(analyticsRes);

      if (analyticsRes?.kpis?.queued_records !== undefined) {
        setQueuedRecordsCount(analyticsRes.kpis.queued_records);
      }

      // Load specific shipment data
      const targetId = selectedShipmentId || (shipmentsRes[0]?.id ?? '04beaccb-7c55-44ab-aa84-2a3f338dcf1c');
      if (targetId) {
        const [telemRes, eventsRes, verifRes] = await Promise.all([
          api.getTelemetry(targetId, 60),
          api.getTimeline(targetId),
          api.getVerification(targetId)
        ]);
        setTelemetryList(telemRes);
        setEvents(eventsRes);
        setVerification(verifRes);
      }
    } catch (err) {
      console.error('Error fetching AgriTrace state:', err);
    }
  }, [selectedShipmentId]);

  useEffect(() => {
    loadData();
    // Periodic refresh every 6 seconds if not offline
    const interval = setInterval(() => {
      loadData();
    }, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  // WebSocket & Stale Data Resilience State (STORY-012)
  const [wsStatus, setWsStatus] = useState<'connected' | 'reconnecting' | 'offline'>('connected');
  const [wsLatencyMs, setWsLatencyMs] = useState<number>(12);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(Date.now());
  const [isStaleData, setIsStaleData] = useState<boolean>(false);

  // Connect WebSocket with Exponential Backoff Reconnection & Ping/Pong Latency Benchmark
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let retryAttempt = 0;
    let unmounted = false;
    let lastPingSentAt = 0;

    const connectWebSocket = () => {
      if (unmounted) return;
      try {
        ws = new WebSocket('ws://localhost:8000/ws/telemetry');

        ws.onopen = () => {
          if (unmounted) return;
          retryAttempt = 0;
          setWsStatus('connected');
          setLastSyncTimestamp(Date.now());
          setIsStaleData(false);

          // Start periodic ping/pong latency benchmark
          if (pingInterval) clearInterval(pingInterval);
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              lastPingSentAt = performance.now();
              ws.send('ping');
            }
          }, 5000);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          setLastSyncTimestamp(Date.now());
          setIsStaleData(false);

          if (event.data === 'pong') {
            if (lastPingSentAt > 0) {
              const rtt = Math.max(1, Math.round(performance.now() - lastPingSentAt));
              setWsLatencyMs(rtt);
            }
            return;
          }

          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'NEW_TELEMETRY') {
              setTelemetryList(prev => [...prev, msg.data]);
            } else if (msg.type === 'NETWORK_STATE_CHANGED') {
              setIsNodeOnline(msg.is_online);
            } else {
              loadData();
            }
          } catch {
            // ignore raw text
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          if (pingInterval) clearInterval(pingInterval);
          setWsStatus('reconnecting');
          const backoffMs = Math.min(15000, 1000 * Math.pow(2, retryAttempt));
          retryAttempt += 1;
          reconnectTimer = setTimeout(connectWebSocket, backoffMs);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch {
        setWsStatus('offline');
        const backoffMs = Math.min(15000, 1000 * Math.pow(2, retryAttempt));
        retryAttempt += 1;
        reconnectTimer = setTimeout(connectWebSocket, backoffMs);
      }
    };

    connectWebSocket();

    // Stale data monitor (flags stale if > 30s without sync or when node is offline)
    const staleMonitor = setInterval(() => {
      const elapsed = Date.now() - lastSyncTimestamp;
      if (elapsed > 30000 || !isNodeOnline) {
        setIsStaleData(true);
      }
    }, 4000);

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      clearInterval(staleMonitor);
      if (ws) ws.close();
    };
  }, [loadData, isNodeOnline, lastSyncTimestamp]);

  const activeShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0] || {
    id: '04beaccb-7c55-44ab-aa84-2a3f338dcf1c',
    shipment_code: 'SHP-AGRI-04BEACCB',
    product_name: 'GI-Tagged Ratnagiri Alphonso Mangoes',
    batch_code: 'AG-2401',
    compartment_label: 'Compartment A (Main Reefer Chamber)',
    origin: 'Ratnagiri Agri Cooperative, Maharashtra',
    destination: 'JNPT Cold Export Terminal, Navi Mumbai',
    carrier: 'KisanCold Express Logistics',
    truck_plate: 'MH-04-AZ-8892',
    driver_name: 'Rajesh Shinde',
    driver_phone: '+91 98201 44512',
    status: 'IN_TRANSIT',
    created_at: new Date().toISOString(),
    thresholds: { min_temp: 2.0, max_temp: 8.0, max_humidity: 85.0, max_gas_ethylene: 50.0 },
    latest_telemetry: {
      temperature: 4.2,
      humidity: 78.0,
      gas_ethylene: 13.5,
      battery: 94.5,
      latitude: 19.0760,
      longitude: 72.9982,
      sync_state: 'live',
      integrity_status: 'verified',
      timestamp: new Date().toISOString()
    }
  };

  const openAlertsCount = alerts.filter(a => a.status === 'OPEN').length;

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Kisan & Supply Chain Dashboard', subtitle: 'Live cargo condition, truck locations, and harvest freshness status' };
      case 'monitoring':
        return { title: 'Live Cold-Chain Monitoring', subtitle: 'Real-time temperature, humidity, ethylene gas, and truck compartment health' };
      case 'traceability':
        return { title: 'Farm-to-Fork Provenance', subtitle: 'Transparent journey from harvest co-op to market with tamper-proof blockchain proof' };
      case 'alerts':
        return { title: 'Safety & Spoilage Alerts', subtitle: 'Immediate warnings for temperature spikes and spoilage risks' };
      case 'analytics':
        return { title: 'Freshness & Quality Analytics', subtitle: 'Safe transit records and cold-chain compliance scorecards' };
      case 'shipments':
      case 'active-shipments':
        return { title: 'Active Crop Shipments', subtitle: 'Live transit manifests, reefer truck conditions, and mandi routes' };
      case 'create-shipment':
        return { title: 'Create Crop Shipment', subtitle: 'Register fresh farm produce, safe cold-chain tripwires, and bind IoT hardware' };
      case 'shipment-history':
        return { title: 'Cold-Chain Transit History', subtitle: 'Immutable audit logs, verified trip manifests, and GI compliance grades' };
      case 'devices':
      case 'device-list':
      case 'assign-device':
        return { title: 'IoT Hardware Nodes & Fleet', subtitle: '4G LTE-M edge nodes, LiFePO4 battery health, solar telemetry, and cryptographic verification' };
      case 'consumer-view':
        return { title: 'Consumer Freshness Certificate', subtitle: 'Public transparency certificate to verify GI-tag authenticity and cold-chain safety' };
      default:
        return { title: 'AgriTrace Kisan Portal', subtitle: 'Offline-First Farm-to-Fork Cold-Chain Traceability' };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      
      <div className="flex flex-1 min-h-screen">
        
        {/* Left Sidebar Shell */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openAlertsCount={openAlertsCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Navbar */}
          <Navbar
            title={pageInfo.title}
            subtitle={pageInfo.subtitle}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            openAlertsCount={openAlertsCount}
            onOpenAlerts={() => setActiveTab('alerts')}
            shipments={shipments}
            devices={devices}
            onSelectShipment={(id) => setSelectedShipmentId(id)}
            onNavigateTab={setActiveTab}
            user={currentUser}
            onOpenSignIn={() => {
              setAuthModalMode('signin');
              setAuthModalOpen(true);
            }}
            onOpenSignUp={() => {
              setAuthModalMode('signup');
              setAuthModalOpen(true);
            }}
            onSignOut={handleSignOut}
            wsStatus={wsStatus}
            wsLatencyMs={wsLatencyMs}
            isStaleData={isStaleData}
            isNodeOnline={isNodeOnline}
          />

          {/* Page Body */}
          <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
            
            {activeTab === 'dashboard' && (
              <DashboardView
                shipments={shipments}
                devices={devices}
                alerts={alerts}
                latestTelemetry={telemetryList[telemetryList.length - 1]}
                isOnline={isNodeOnline}
                queuedCount={queuedRecordsCount}
                onRefresh={loadData}
                onShowToast={showToast}
                onSelectShipment={(id) => {
                  setSelectedShipmentId(id);
                  setActiveTab('monitoring');
                }}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'monitoring' && (
              <MonitoringView
                shipment={activeShipment}
                telemetryList={telemetryList}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'traceability' && (
              <TraceabilityView
                shipment={activeShipment}
                shipments={shipments}
                events={events}
                verification={verification}
                onSelectShipment={(id) => setSelectedShipmentId(id)}
                onRefresh={loadData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onViewShipment={(shipmentId) => {
                  setSelectedShipmentId(shipmentId);
                  setActiveTab('monitoring');
                }}
                onRefresh={loadData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView analytics={analytics} />
            )}

            {(activeTab === 'shipments' || activeTab === 'active-shipments') && (
              <ShipmentsView
                shipments={shipments}
                devices={devices}
                onSelectShipment={(id) => {
                  setSelectedShipmentId(id);
                  setActiveTab('monitoring');
                }}
                onRefresh={loadData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'create-shipment' && (
              <CreateShipmentView
                devices={devices}
                onShipmentCreated={(newId) => {
                  setSelectedShipmentId(newId);
                  loadData();
                  setActiveTab('monitoring');
                }}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'shipment-history' && (
              <TransitHistoryView
                shipments={shipments}
                onSelectShipment={(id) => {
                  setSelectedShipmentId(id);
                  setActiveTab('monitoring');
                }}
                onShowToast={showToast}
              />
            )}

            {(activeTab === 'devices' || activeTab === 'device-list' || activeTab === 'assign-device') && (
              <DevicesView
                devices={devices}
                shipments={shipments}
                onRefresh={loadData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'consumer-view' && (
              <ConsumerVerifyView
                shipment={activeShipment}
                shipments={shipments}
                verification={verification}
                onSelectShipment={(id) => setSelectedShipmentId(id)}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

          </main>

        </div>

      </div>

      {/* Toast Notification Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-3 border transition-all animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'success' 
            ? 'bg-emerald-900 text-emerald-100 border-emerald-500' 
            : toast.type === 'warning'
            ? 'bg-amber-900 text-amber-100 border-amber-500'
            : toast.type === 'error'
            ? 'bg-rose-950 text-rose-100 border-rose-500'
            : 'bg-slate-900 text-white border-slate-700'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Authentication Modal (Sign In & Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        onShowToast={showToast}
      />

    </div>
  );
}
export default App;
