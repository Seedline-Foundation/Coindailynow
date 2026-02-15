'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XOctagon,
  Info,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchPartnerSite } from '@/lib/api';

/**
 * Partner Site Health Page - press.coindaily.online/partner/health
 *
 * Powered by the Virus Agent (24/7/365).
 * Monitors tech stack, security threats, outdated modules,
 * and overall site safety. Threat levels: None, Moderate, High, Very High.
 */

interface HealthCheck {
  category: string;
  status: 'pass' | 'warning' | 'critical';
  detail: string;
  lastChecked: string;
}

const HEALTH_CHECKS: HealthCheck[] = [
  { category: 'SSL/TLS Certificate', status: 'pass', detail: 'Valid, expires Mar 2027', lastChecked: '2h ago' },
  { category: 'WordPress Version', status: 'pass', detail: 'v6.5.2 (latest)', lastChecked: '2h ago' },
  { category: 'PHP Version', status: 'warning', detail: 'v8.1 — recommend 8.3', lastChecked: '2h ago' },
  { category: 'Plugin Vulnerabilities', status: 'pass', detail: '0 known vulnerabilities', lastChecked: '2h ago' },
  { category: 'Malware Scan', status: 'pass', detail: 'Clean', lastChecked: '2h ago' },
  { category: 'DNS Configuration', status: 'pass', detail: 'DNSSEC enabled', lastChecked: '6h ago' },
  { category: 'Outdated Dependencies', status: 'warning', detail: '2 packages need update', lastChecked: '2h ago' },
  { category: 'Content Security Policy', status: 'pass', detail: 'CSP headers set', lastChecked: '2h ago' },
  { category: 'Suspicious Outbound Links', status: 'pass', detail: 'None detected', lastChecked: '2h ago' },
  { category: 'DDoS Protection', status: 'pass', detail: 'Cloudflare active', lastChecked: '2h ago' },
];

const DH_INFO = {
  currentDH: 62,
  tier: 'gold',
  threatLevel: 'none' as const,
  lastFullScan: '2026-02-13T08:00:00Z',
  nextScan: '2026-02-14T08:00:00Z',
};

const threatMeta: Record<string, { label: string; color: string; icon: any; description: string }> = {
  none: { label: 'No Threats Detected', color: 'text-green-500 bg-green-500/10 border-green-500/30', icon: CheckCircle, description: 'Your site meets all safety requirements. PR distribution is fully active.' },
  moderate: { label: 'Moderate Threat', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30', icon: AlertTriangle, description: 'Minor issues detected. Distribution continues but please remediate. Moderate threats must not have the ability to distribute themselves.' },
  high: { label: 'High Threat', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30', icon: AlertTriangle, description: 'Significant security concerns. New PR distribution is paused until issues are resolved.' },
  'very high': { label: 'Very High Threat', color: 'text-red-500 bg-red-500/10 border-red-500/30', icon: XOctagon, description: 'Critical security threats. Your site has been suspended from the network. Remediate immediately.' },
};

const statusIcon: Record<string, { icon: any; color: string }> = {
  pass: { icon: CheckCircle, color: 'text-green-500' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500' },
  critical: { icon: XOctagon, color: 'text-red-500' },
};

export default function PartnerHealthPage() {
  const { user } = useAuth();
  const [dhInfo, setDhInfo] = useState(DH_INFO);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    fetchPartnerSite(user.email).then(site => {
      if (site) {
        setDhInfo(prev => ({
          ...prev,
          currentDH: Number(site.dh_score) || prev.currentDH,
          tier: site.tier || prev.tier,
          threatLevel: (site.threat_level || 'none') as any,
        }));
      }
    }).catch(console.error);
  }, [user?.email]);

  const threat = threatMeta[dhInfo.threatLevel];
  const ThreatIcon = threat.icon;

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mb-1">Site Health</h1>
          <p className="text-dark-400">Monitored 24/7 by the SENDPRESS Virus Agent.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-dark-600 hover:border-primary-500 text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          Request Re-scan
        </button>
      </div>

      {/* Threat Level Banner */}
      <div className={`border rounded-xl p-5 mb-8 ${threat.color}`}>
        <div className="flex items-start gap-4">
          <ThreatIcon className="w-8 h-8 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold mb-1">{threat.label}</h2>
            <p className="text-sm opacity-80">{threat.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
              <span>Last full scan: {new Date(dhInfo.lastFullScan).toLocaleString()}</span>
              <span>Next scan: {new Date(dhInfo.nextScan).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threat Level Guide */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-dark-400" />
          <h3 className="text-sm font-semibold text-white">Threat Level Guide</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(threatMeta).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className={`p-3 rounded-lg border ${meta.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold text-sm">{meta.label}</span>
                </div>
                <p className="text-xs opacity-70 leading-relaxed">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Checks Table */}
      <div className="bg-dark-900 border border-dark-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold text-white">Security & Health Checks</h2>
          <p className="text-dark-500 text-xs mt-1">Automated scans are performed by the SENDPRESS Virus Agent once your site is verified on the network.</p>
        </div>
        {healthChecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-dark-500">
            <Shield className="w-12 h-12 mb-3" />
            <p className="text-sm">No health checks recorded yet.</p>
            <p className="text-xs mt-1">Automated scanning begins once your site joins the network.</p>
          </div>
        ) : (
        <div className="divide-y divide-dark-800">
          {healthChecks.map((check) => {
            const st = statusIcon[check.status];
            const StatusIcon = st.icon;
            return (
              <div key={check.category} className="flex items-center justify-between px-4 py-3.5 hover:bg-dark-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`w-5 h-5 ${st.color}`} />
                  <div>
                    <p className="text-white font-medium text-sm">{check.category}</p>
                    <p className="text-dark-400 text-xs">{check.detail}</p>
                  </div>
                </div>
                <span className="text-dark-500 text-xs">{check.lastChecked}</span>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </>
  );
}
