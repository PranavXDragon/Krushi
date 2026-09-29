import React from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Thermometer, 
  WifiOff, 
  Lock, 
  CheckCircle2, 
  Eye, 
  XCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Alert } from '../types';
import { api } from '../services/api';

interface AlertsViewProps {
  alerts: Alert[];
  onViewShipment: (shipmentId: string) => void;
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onViewShipment,
  onRefresh,
  onShowToast
}) => {
  const [filter, setFilter] = React.useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.status === filter;
  });

  const handleDismiss = async (alertId: number) => {
    try {
      await api.updateAlert(alertId, 'RESOLVED');
      onShowToast(`Alert #${alertId} marked resolved`, 'success');
      onRefresh();
    } catch (e) {
      onShowToast('Failed to update alert', 'error');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'GAS_ALERT':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'HIGH_TEMP':
        return <Thermometer className="w-5 h-5 text-rose-500" />;
      case 'DEVICE_OFFLINE':
        return <WifiOff className="w-5 h-5 text-amber-600" />;
      case 'TAMPER_DETECTED':
        return <Lock className="w-5 h-5 text-rose-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === tab 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Alerts' : tab === 'OPEN' ? 'Open Exceptions' : 'Resolved'}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Alert List Cards (Matching exact UI reference) */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-800">No active alerts</h4>
            <p className="text-xs text-slate-500">All environmental values and devices are within safe thresholds.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isResolved = alert.status === 'RESOLVED';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md ${
                  isCritical && !isResolved 
                    ? 'border-rose-300 ring-1 ring-rose-200' 
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start gap-4">
                  
                  {/* Left Icon Pill */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isCritical 
                      ? 'bg-rose-50 text-rose-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {getAlertIcon(alert.alert_type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.severity}
                      </span>

                      <h4 className="text-sm font-bold text-slate-800">{alert.title}</h4>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-mono">
                      Device: <span className="font-bold text-slate-700">{alert.device_id}</span>
                      {alert.shipment_id && (
                        <> · Shipment: <span className="text-teal-700">{alert.shipment_id}</span></>
                      )}
                      {alert.observed_value && (
                        <> · Value: <span className="font-bold text-slate-900">{alert.observed_value}</span></>
                      )}
                      {alert.threshold_value && (
                        <> · Threshold: <span className="text-slate-500">{alert.threshold_value}</span></>
                      )}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1">
                      {isResolved && <span className="text-slate-500 font-semibold mr-1">Resolved ·</span>}
                      {alert.created_at ? new Date(alert.created_at).toLocaleString() : ''}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center gap-2.5">
                      {alert.shipment_id && (
                        <button
                          onClick={() => onViewShipment(alert.shipment_id)}
                          className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Shipment</span>
                        </button>
                      )}

                      {!isResolved ? (
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="px-4 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition"
                        >
                          Dismiss
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
