'use client';

import Link from 'next/link';

/**
 * Lightweight admin/public shell header (authors & marketing pages in jet admin).
 */
export default function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/admin" className="font-semibold text-gray-900 dark:text-white">
          CoinDaily Admin
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <Link href="/authors" className="hover:text-blue-600">
            Authors
          </Link>
          <Link href="/super-admin/dashboard" className="hover:text-blue-600">
            Super Admin
          </Link>
          <Link href="/login" className="hover:text-blue-600">
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
