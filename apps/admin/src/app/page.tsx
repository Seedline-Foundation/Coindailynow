'use client';

import Link from 'next/link';
import { Shield, LogIn, Lock } from 'lucide-react';

/**
 * Staff Landing Page - jet.coindaily.online
 * 
 * This is the page staff see when they:
 * - Navigate to jet.coindaily.online
 * - Log out from the admin panel
 * 
 * Contains the login button to access the admin portal.
 */
export default function StaffLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10 mb-4">
            <Shield className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2">
            CoinDaily Admin
          </h1>
          <p className="text-dark-400 text-sm">
            Secure Administrative Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-dark-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">
              Authorized Personnel Only
            </h2>
            <p className="text-dark-400 text-sm">
              This portal is restricted to authorized staff members with whitelisted IP addresses.
            </p>
          </div>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-lg transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Staff Login
          </Link>

          <div className="mt-6 pt-6 border-t border-dark-700">
            <p className="text-center text-xs text-dark-500">
              All access attempts are logged and monitored.
              <br />
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-dark-500 text-xs">
            © {new Date().getFullYear()} CoinDaily. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
