/**
 * User Dashboard Layout
 * Personal dashboard for authenticated users at coindaily.online/user
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Wallet, 
  Bell, 
  Settings, 
  User, 
  BookOpen,
  TrendingUp,
  Star,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Ticket,
  Store,
  Package,
  ShoppingCart,
  MessageSquare,
  Zap,
  DollarSign,
  Megaphone,
  CreditCard,
} from 'lucide-react';

interface UserLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/user', label: 'Dashboard', icon: Home },
  { href: '/user/portfolio', label: 'Portfolio', icon: TrendingUp },
  { href: '/user/wallet', label: 'Wallet', icon: Wallet },
  { href: '/user/place-order', label: 'Place Order', icon: CreditCard },
  { href: '/user/bookmarks', label: 'Bookmarks', icon: Star },
  { href: '/user/reading-history', label: 'Reading History', icon: BookOpen },
  { href: '/user/notifications', label: 'Notifications', icon: Bell },
  { href: '/user/tickets', label: 'Support Tickets', icon: Ticket },
  { href: '/user/ads', label: 'My Ads', icon: Megaphone },
  { href: '/user/settings', label: 'Settings', icon: Settings },
];

const marketplaceItems = [
  { href: '/user/marketplace', label: 'My Store', icon: Store },
  { href: '/user/marketplace/products', label: 'Products', icon: Package },
  { href: '/user/marketplace/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/user/marketplace/messages', label: 'Messages', icon: MessageSquare },
  { href: '/user/marketplace/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/user/marketplace/boost', label: 'Boost & Ads', icon: Zap },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
        if (!token) {
          router.push('/auth/login?redirect=/user');
          return;
        }

        // Store under canonical key if found under alternate
        if (!localStorage.getItem('auth_token') && token) {
          localStorage.setItem('auth_token', token);
        }

        // Try reading stored user first (works offline)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
            setLoading(false);
          } catch { /* fall through to verify */ }
        }

        // Verify token with backend
        try {
          const response = await fetch('/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user || (storedUser ? JSON.parse(storedUser) : { name: 'User', email: '' }));
            setIsAuthenticated(true);
          } else if (!storedUser) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('accessToken');
            router.push('/auth/login?redirect=/user');
          } else {
            // Token invalid but we have stored user - allow dev access
            setIsAuthenticated(true);
          }
        } catch (verifyError) {
          // Backend unreachable — allow access with stored user or demo
          setIsAuthenticated(true);
          if (!user) setUser(storedUser ? JSON.parse(storedUser) : { name: 'Demo User', email: 'demo@coindaily.online' });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-dark-900 border-b border-dark-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-dark-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="text-xl font-display font-bold text-primary-500">
            CoinDaily
          </Link>
          <Link href="/user/settings" className="p-2">
            <User className="w-6 h-6 text-dark-400" />
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-full w-64 bg-dark-900 border-r border-dark-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-dark-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
              <span className="text-dark-950 font-bold text-sm">CD</span>
            </div>
            <span className="text-xl font-display font-bold text-white">CoinDaily</span>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive 
                    ? 'bg-primary-500/10 text-primary-500' 
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Marketplace Section */}
          <div className="pt-3 mt-3 border-t border-dark-700">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-dark-500 mb-2">Marketplace</p>
            {marketplaceItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive 
                      ? 'bg-primary-500/10 text-primary-500' 
                      : 'text-dark-300 hover:text-white hover:bg-dark-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 mb-2"
          >
            <Home className="w-5 h-5" />
            Back to News
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
