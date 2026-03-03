'use client';

import { useState } from 'react';
import {
  AlertTriangle, BellRing, RefreshCw, CheckCircle,
  XCircle, TrendingUp, TrendingDown, Activity, Zap,
  Clock, Flag, Filter, Eye, ChevronRight,
} from 'lucide-react';

type Severity = 'critical' | 'high' | 'medium' | 'low';
type AlertType = 'volatility' | 'feed-anomaly' | 'depeg' | 'whale' | 'incident';
type AlertStatus = 'active' | 'acknowledged' | 'resolved';

interface MarketAlert {
  id: string;
  token: string;
  type: AlertType;
  severity: Severity;
  status: AlertStatus;
  message: string;
  value?: string;
  time: string;
  exchange?: string;
}

const ALERTS: MarketAlert[] = [
  { id: 'a1', token: 'JY', type: 'volatility', severity: 'high', status: 'active', message: 'JY token up +34% in 2 hours — potential pump signal', value: '+34%', time: '4m ago', exchange: 'Quidax' },
  { id: 'a2', token: 'USDT', type: 'depeg', severity: 'critical', status: 'active', message: 'USDT/NGN premium exceeds 4% on BuyCoins — stablecoin depeg risk', value: '+4.1%', time: '12m ago', exchange: 'BuyCoins' },
  { id: 'a3', token: 'BTC', type: 'whale', severity: 'medium', status: 'active', message: 'Whale wallet moved 820 BTC to exchange — possible sell pressure', value: '820 BTC', time: '18m ago', exchange: 'Binance' },
  { id: 'a4', token: 'ETH', type: 'feed-anomaly', severity: 'high', status: 'active', message: 'ETH price feed discrepancy: Binance vs Luno spread exceeds 2.5%', value: '2.5%', time: '25m ago', exchange: 'Multiple' },
  { id: 'a5', token: 'RUGPULL', type: 'incident', severity: 'critical', status: 'acknowledged', message: 'Possible rug pull: liquidity removed from AfriMoon BSC pool', value: '-98%', time: '1h ago', exchange: 'PancakeSwap' },
  { id: 'a6', token: 'DOGE', type: 'volatility', severity: 'medium', status: 'active', message: 'DOGE flash spike: +8.2% in 15 minutes with 3x volume', value: '+8.2%', time: '42m ago', exchange: 'Binance' },
  { id: 'a7', token: 'BNB', type: 'feed-anomaly', severity: 'low', status: 'resolved', message: 'BNB price feed briefly stale on Ice3X — resolved after 3 min', time: '2h ago', exchange: 'Ice3X' },
  { id: 'a8', token: 'CELO', type: 'volatility', severity: 'low', status: 'resolved', message: 'CELO 24h swing exceeded 12% threshold — within normal range', value: '12.4%', time: '3h ago', exchange: 'Valr' },
];

const severityCfg: Record<Severity, { color: string; dot: string; label: string }> = {
  critical: { color: 'text-red-400 bg-red-500/10 border-red-500/30', dot: 'bg-red-500', label: 'Critical' },
  high: { color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500', label: 'High' },
  medium: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-500', label: 'Medium' },
  low: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', dot: 'bg-blue-500', label: 'Low' },
};

const typeCfg: Record<AlertType, { label: string; Icon: React.FC<{ className?: string }> }> = {
  volatility: { label: 'Volatility Spike', Icon: TrendingUp },
  'feed-anomaly': { label: 'Feed Anomaly', Icon: Activity },
  depeg: { label: 'Stablecoin Depeg', Icon: AlertTriangle },
  whale: { label: 'Whale Movement', Icon: Zap },
  incident: { label: 'Market Incident', Icon: Flag },
};

const statusCfg: Record<AlertStatus, { color: string; label: string }> = {
  active: { color: 'text-red-400 bg-red-500/10', label: 'Active' },
  acknowledged: { color: 'text-yellow-400 bg-yellow-500/10', label: 'Acknowledged' },
  resolved: { color: 'text-emerald-400 bg-emerald-500/10', label: 'Resolved' },
};

export default function SuperAdminMarketAlertsPage() {
  const [alerts, setAlerts] = useState<MarketAlert[]>(ALERTS);
  const [activeTab, setActiveTab] = useState<'feed' | 'config' | 'log'>('feed');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const acknowledge = (id: string) =>
    setAlerts(p => p.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
  const resolve = (id: string) =>
    setAlerts(p => p.map(a => a.id === id ? { ...a, status: 'resolved' } : a));

  const active = alerts.filter(a => a.status === 'active');
  const critical = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const feedAnomalies = alerts.filter(a => a.type === 'feed-anomaly' && a.status === 'active').length;
  const resolved24h = alerts.filter(a => a.status === 'resolved').length;

  const filteredFeed = alerts.filter(a =>
    a.status !== 'resolved' &&
    (filterSeverity === 'all' || a.severity === filterSeverity) &&
    (filterType === 'all' || a.type === filterType)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-400" /> Market Alerts</h1>
          <p className="text-gray-400 mt-1">Review volatility, feed anomalies, and market incident alerts</p>
        </div>
        <button onClick={() => setAlerts([...ALERTS])} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{label:'Active Alerts',value:active.length,Icon:BellRing,color:'text-red-400'},
          {label:'Critical',value:critical,Icon:AlertTriangle,color:'text-orange-400'},
          {label:'Feed Anomalies',value:feedAnomalies,Icon:Activity,color:'text-yellow-400'},
          {label:'Resolved (24h)',value:resolved24h,Icon:CheckCircle,color:'text-emerald-400'}].map(k => (
          <div key={k.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-400">{k.label}</span><k.Icon className={`w-5 h-5 ${k.color}`} /></div>
            <div className="text-2xl font-bold text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1.5">
        {(['feed','config','log'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            {tab === 'feed' ? 'Live Alert Feed' : tab === 'config' ? 'Alert Config' : 'Incident Log'}
          </button>
        ))}
      </div>

      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="all">All Types</option>
              <option value="volatility">Volatility</option>
              <option value="feed-anomaly">Feed Anomaly</option>
              <option value="depeg">Depeg</option>
              <option value="whale">Whale</option>
              <option value="incident">Incident</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredFeed.length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-800 border border-gray-700 rounded-xl">No active alerts matching filters.</div>}
            {filteredFeed.map(alert => {
              const sv = severityCfg[alert.severity];
              const tp = typeCfg[alert.type];
              const st = statusCfg[alert.status];
              return (
                <div key={alert.id} className={`bg-gray-800 border rounded-xl p-4 ${alert.severity === 'critical' ? 'border-red-500/50' : alert.severity === 'high' ? 'border-orange-500/40' : 'border-gray-700'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${sv.dot} ${alert.status === 'active' && (alert.severity === 'critical' || alert.severity === 'high') ? 'animate-pulse' : ''}`} />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-white">{alert.token}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sv.color}`}>{sv.label}</span>
                          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded flex items-center gap-1"><tp.Icon className="w-3 h-3" />{tp.label}</span>
                          {alert.exchange && <span className="text-xs text-gray-500">{alert.exchange}</span>}
                        </div>
                        <p className="text-sm text-gray-300">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {alert.value && <span className="text-xs font-bold font-mono text-white bg-gray-700 px-2 py-0.5 rounded">{alert.value}</span>}
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                    {alert.status === 'active' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => acknowledge(alert.id)} className="px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">Ack</button>
                        <button onClick={() => resolve(alert.id)} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Resolve</button>
                      </div>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button onClick={() => resolve(alert.id)} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0">Resolve</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-5">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-red-400" /> Alert Thresholds</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[{label:'Volatility spike threshold',value:'5%',desc:'Trigger alert when token moves more than X% in 15 min'},
                {label:'Whale movement threshold',value:'500 BTC eq.',desc:'Alert when wallet moves more than X in single transaction'},
                {label:'Stablecoin depeg threshold',value:'2%',desc:'Alert when stablecoin trades more than X% from peg'},
                {label:'Feed discrepancy threshold',value:'1.5%',desc:'Alert when two feeds differ by more than X%'},
                {label:'Volume anomaly multiplier',value:'3x',desc:'Alert when 15-min volume exceeds X times 24h average'},
                {label:'Alert cooldown period',value:'10 min',desc:'Minimum time between two alerts for the same token/type'}].map(cfg => (
                <div key={cfg.label} className="bg-gray-700/40 border border-gray-600 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">{cfg.label}</label>
                  <p className="text-xs text-gray-500 mb-2">{cfg.desc}</p>
                  <input defaultValue={cfg.value} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-red-500" />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm">Save Thresholds</button>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><BellRing className="w-5 h-5 text-yellow-400" /> Notification Channels</h3>
            <div className="space-y-2">
              {[{channel:'Telegram Bot',enabled:true,detail:'@coindaily_alerts_bot'},
                {channel:'Email (ops team)',enabled:true,detail:'ops@coindaily.africa'},
                {channel:'Slack Webhook',enabled:false,detail:'Not configured'},
                {channel:'PagerDuty',enabled:false,detail:'Enterprise only'}].map(n => (
                <div key={n.channel} className="flex items-center justify-between bg-gray-700/40 border border-gray-600 rounded-xl p-3">
                  <div><div className="text-sm font-medium text-white">{n.channel}</div><div className="text-xs text-gray-500">{n.detail}</div></div>
                  <div className={`w-10 h-5 rounded-full relative ${n.enabled ? 'bg-emerald-500' : 'bg-gray-600'}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2"><Eye className="w-5 h-5 text-gray-400" /> Resolved Incidents — Last 24h</h3>
          {alerts.filter(a => a.status === 'resolved').map(alert => {
            const sv = severityCfg[alert.severity];
            const tp = typeCfg[alert.type];
            return (
              <div key={alert.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 opacity-75">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-300">{alert.token}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sv.color}`}>{sv.label}</span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1"><tp.Icon className="w-3 h-3" />{tp.label}</span>
                    </div>
                    <p className="text-sm text-gray-400">{alert.message}</p>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{alert.time} · Resolved</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
                </div>
              </div>
            );
          })}
          {alerts.filter(a => a.status === 'resolved').length === 0 && <div className="text-center py-12 text-gray-500 bg-gray-800 border border-gray-700 rounded-xl">No resolved incidents in the last 24 hours.</div>}
        </div>
      )}
    </div>
  );
}
