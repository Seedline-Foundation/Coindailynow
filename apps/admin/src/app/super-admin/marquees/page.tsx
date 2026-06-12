'use client';

import MarqueeAdmin from '@/components/admin/MarqueeAdmin';

export default function SuperAdminMarqueesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Marquee Ticker</h1>
        <p className="text-gray-400 text-sm mt-1">Manage header/footer tickers and breaking news flashes.</p>
      </div>
      <MarqueeAdmin />
    </div>
  );
}
