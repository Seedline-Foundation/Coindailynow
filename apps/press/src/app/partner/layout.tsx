'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  DollarSign,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Layers,
} from 'lucide-react';

/**
 * Partner Dashboard Layout - press.coindaily.online/partner
 *
 * Sidebar layout for distributing-site partners who earn JOY
 * by hosting press releases on their websites.
 */

const PARTNER_NAV = [
  { name: 'Overview', href: '/partner', icon: LayoutDashboard },
  { name: 'Press Releases', href: '/partner/releases', icon: FileText },
  { name: 'Positions', href: '/partner/positions', icon: Layers },
  { name: 'Earnings', href: '/partner/earnings', icon: DollarSign },
  { name: 'Analytics', href: '/partner/analytics', icon: BarChart3 },
  { name: 'Site Health', href: '/partner/health', icon: Shield },
  { name: 'Settings', href: '/partner/settings', icon: Settings },
];

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-dark-900 border-r border-dark-700
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-dark-700">
          <Link href="/partner" className="flex items-center gap-2">
            <Globe className="w-8 h-8 text-primary-500" />
            <span className="font-display font-bold text-lg text-white">SENDPRESS</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {PARTNER_NAV.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors group"
            >
              <item.icon className="w-5 h-5 text-dark-500 group-hover:text-primary-500" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <a
            href="https://discord.gg/coindaily"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors text-sm mb-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Help Center
          </a>
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-dark-500">Connected Wallet</p>
            <p className="text-sm text-dark-300 truncate">0x7a3b...9f2e</p>
          </div>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
            <LogOut className="w-5 h-5" />
            <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
          <div className="flex items-center justify-between h-full px-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-dark-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-dark-400 hover:text-white">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">P</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
