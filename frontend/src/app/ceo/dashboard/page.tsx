'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Users, FileText, DollarSign, Activity, Globe,
  BarChart2, Zap, ArrowUpRight, ArrowDownRight, LogOut, Settings
} from 'lucide-react';

interface KpiCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const KPIS: KpiCard[] = [
  { label: 'Total Revenue', value: '$142,800', change: '+18.4%', up: true, icon: DollarSign, color: 'text-emerald-400' },
  { label: 'Active Users', value: '84,320', change: '+11.2%', up: true, icon: Users, color: 'text-blue-400' },
  { label: 'Articles Published', value: '3,410', change: '+6.7%', up: true, icon: FileText, color: 'text-violet-400' },
  { label: 'AI Tasks Processed', value: '12,590', change: '+23.1%', up: true, icon: Zap, color: 'text-amber-400' },
  { label: 'Subscriptions', value: '5,240', change: '+9.8%', up: true, icon: Activity, color: 'text-cyan-400' },
  { label: 'Markets Covered', value: '18', change: '+2', up: true, icon: Globe, color: 'text-pink-400' },
  { label: 'Avg. Session (min)', value: '4.8', change: '-0.3', up: false, icon: BarChart2, color: 'text-orange-400' },
  { label: 'Error Rate', value: '0.12%', change: '-0.04%', up: true, icon: TrendingUp, color: 'text-red-400' },
];

export default function CEODashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('ceo_token');
    if (!token) {
      router.push('/ceo/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('ceo_token');
    router.push('/ceo/login');
  };

  if (!mounted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white">CoinDaily</span>
            <span className="ml-2 text-xs text-blue-400 uppercase tracking-wider">CEO Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://jet.coindaily.online/super-admin/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            Staff / Super Admin
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            Executive Overview
          </h1>
          <p className="text-gray-400 mt-1">
            Platform performance — last 30 days &nbsp;·&nbsp;
            <span className="text-blue-400">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KPIS.map(kpi => (
            <div key={kpi.label} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change} vs last month
              </div>
            </div>
          ))}
        </div>

        {/* Two-column summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Revenue Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Premium Subscriptions', value: '$89,400', pct: 63 },
                { label: 'Affiliate & Ads', value: '$31,200', pct: 22 },
                { label: 'API Licensing', value: '$12,800', pct: 9 },
                { label: 'Other', value: '$9,400', pct: 6 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>{row.label}</span>
                    <span className="font-medium text-white">{row.value}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top markets */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Top Markets
            </h2>
            <div className="space-y-3">
              {[
                { country: 'Nigeria', flag: '🇳🇬', users: '31,200', share: '37%' },
                { country: 'Kenya', flag: '🇰🇪', users: '18,400', share: '22%' },
                { country: 'South Africa', flag: '🇿🇦', users: '15,100', share: '18%' },
                { country: 'Ghana', flag: '🇬🇭', users: '9,800', share: '12%' },
                { country: 'Other', flag: '🌍', users: '9,820', share: '11%' },
              ].map(row => (
                <div key={row.country} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span>{row.flag}</span>
                    {row.country}
                  </span>
                  <div className="text-right">
                    <span className="text-white font-medium">{row.users}</span>
                    <span className="text-gray-500 ml-2">({row.share})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Staff / Super Admin', href: 'https://jet.coindaily.online/super-admin/dashboard', color: 'bg-blue-600 hover:bg-blue-700', external: true },
              { label: 'User Dashboard', href: 'https://coindaily.online/user', color: 'bg-violet-600 hover:bg-violet-700', external: true },
              { label: 'Analytics', href: 'https://jet.coindaily.online/super-admin/analytics', color: 'bg-emerald-600 hover:bg-emerald-700', external: true },
              { label: 'Monetization', href: 'https://jet.coindaily.online/super-admin/monetization', color: 'bg-amber-600 hover:bg-amber-700', external: true },
              { label: 'Security', href: 'https://jet.coindaily.online/super-admin/security', color: 'bg-red-600 hover:bg-red-700', external: true },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${link.color}`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
