'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const sidebarLinks = [
  { href: '/user', label: 'Dashboard', icon: '📊' },
  { href: '/user/bookmarks', label: 'Bookmarks', icon: '🔖' },
  { href: '/user/reading-history', label: 'Reading History', icon: '📚' },
  { href: '/user/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/user/settings', label: 'Settings', icon: '⚙️' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/?login=true');
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  if (authenticated === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <nav className="bg-dark-900 border border-dark-700 rounded-xl p-4 lg:sticky lg:top-24">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-3">
              My Account
            </h2>
            <ul className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-500/10 text-primary-400'
                          : 'text-gray-400 hover:text-white hover:bg-dark-800'
                      }`}
                    >
                      <span className="text-lg">{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 pt-4 border-t border-dark-700">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  router.push('/');
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full"
              >
                <span className="text-lg">🚪</span>
                Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
