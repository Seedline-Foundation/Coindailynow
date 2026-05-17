'use client';

/**
 * GAP-3-1: CFIS dashboard embedded in jet super-admin area.
 */
const CFIS_URL =
  process.env.NEXT_PUBLIC_CFIS_URL ||
  process.env.NEXT_PUBLIC_FINANCE_SYSTEM_URL ||
  'http://localhost:3005';

export default function AdminFinancePage() {
  const dashboardSrc = `${CFIS_URL.replace(/\/$/, '')}/dashboard`;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white">CFIS — Financial Intelligence</h1>
        <p className="text-gray-400 text-sm mt-1">
          CoinDaily Financial Intelligence System. Opens the live CFIS dashboard (TOTP required on CFIS host).
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href={dashboardSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          Open CFIS in new tab
        </a>
      </div>
      <iframe
        title="CFIS Dashboard"
        src={dashboardSrc}
        className="w-full flex-1 min-h-[600px] rounded-xl border border-gray-700 bg-gray-900"
        allow="fullscreen"
      />
    </div>
  );
}
