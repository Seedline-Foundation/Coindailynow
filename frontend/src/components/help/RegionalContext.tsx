'use client';

import React, { useState, useEffect } from 'react';
import { Globe, DollarSign, RefreshCw, Landmark } from 'lucide-react';
import { fetchProfile } from '../../lib/userApi';

interface RegionalContextProps {
  articleTitle: string;
}

const EXCHANGE_RATES: Record<string, { rate: number; currency: string; symbol: string; localeName: string }> = {
  NG: { rate: 1520, currency: 'NGN', symbol: '₦', localeName: 'Nigerian Naira' },
  KE: { rate: 132, currency: 'KES', symbol: 'KSh', localeName: 'Kenyan Shilling' },
  ZA: { rate: 18.5, currency: 'ZAR', symbol: 'R', localeName: 'South African Rand' },
  GH: { rate: 14.8, currency: 'GHS', symbol: 'GH₵', localeName: 'Ghanaian Cedi' },
  BR: { rate: 5.15, currency: 'BRL', symbol: 'R$', localeName: 'Brazilian Real' },
  PY: { rate: 7420, currency: 'PYG', symbol: '₲', localeName: 'Paraguayan Guaraní' },
  CL: { rate: 920, currency: 'CLP', symbol: '$', localeName: 'Chilean Peso' },
  TT: { rate: 6.75, currency: 'TTD', symbol: 'TT$', localeName: 'Trinidad & Tobago Dollar' },
  BB: { rate: 2.0, currency: 'BBD', symbol: 'Bds$', localeName: 'Barbados Dollar' },
  LC: { rate: 2.7, currency: 'XCD', symbol: 'EC$', localeName: 'East Caribbean Dollar' }
};

export default function RegionalContext({ articleTitle }: RegionalContextProps) {
  const [countryCode, setCountryCode] = useState<string>('NG');
  const [loading, setLoading] = useState(true);
  const [usdAmount, setUsdAmount] = useState<string>('100');

  useEffect(() => {
    async function getCountry() {
      try {
        const res = await fetchProfile();
        if (res?.data?.country) {
          setCountryCode(res.data.country.toUpperCase());
        }
      } catch (err) {
        console.warn('Failed to load user country context, fallback to NG', err);
      } finally {
        setLoading(false);
      }
    }
    getCountry();
  }, []);

  const config = EXCHANGE_RATES[countryCode] || EXCHANGE_RATES.NG;

  // Localized narrative impact builder
  const getLocalizedImpact = () => {
    switch (countryCode) {
      case 'NG':
        return `How this affects Naira (NGN) P2P stablecoin liquidity: Global adjustments will directly shift rates on local exchanges like Quidax and Yellow Card. Expect minor fluctuations in NGN/USDT premiums.`;
      case 'KE':
        return `How this impacts Kenyan Shilling (KES) mobile conversions: Protocol transaction adjustments might alter rates on cash-out routes to M-Pesa. Keep an eye on secondary transaction fees.`;
      case 'ZA':
        return `How this affects South African Rand (ZAR) compliance: Under SARB frameworks, local validation changes may require updated tax reporting. CASPs are advising caution on high leverage swaps.`;
      case 'BR':
        return `How this impacts Brazilian Real (BRL) settlements: Integration shifts will influence instant-settlement PIX channels on exchanges. Pix-to-USDT routes remain operational with flat rates.`;
      case 'PY':
      case 'CL':
        return `How this affects Latin American Peso/Remittance routes: Increased network transaction volumes may delay low-fee stablecoin cross-border remittances. Try using Solana-based USDT/USDC for fastest clearance.`;
      case 'TT':
      case 'BB':
      case 'LC':
        return `How this affects Caribbean digital banking: Fintech integrations in the Eastern Caribbean will see higher volumes. Double check deposit routes into local credit unions.`;
      default:
        return `This global event has mild ripple effects on emerging markets. Ensure you check P2P premiums before initiating large-volume conversions.`;
    }
  };

  const convertedValue = (parseFloat(usdAmount) || 0) * config.rate;

  const flagEmoji = (code: string) => {
    const flags: Record<string, string> = {
      NG: '🇳🇬', KE: '🇰🇪', ZA: '🇿🇦', GH: '🇬🇭',
      BR: '🇧🇷', PY: '🇵🇾', CL: '🇨🇱',
      TT: '🇹🇹', BB: '🇧🇧', LC: '🇱🇨'
    };
    return flags[code] || '🌐';
  };

  return (
    <div className="bg-[#12121a] border border-[#2a2a3e] rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a3e]/50 pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-amber-400" />
          <h4 className="font-bold text-sm text-white">Regional Intelligence</h4>
        </div>
        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold px-2 py-0.5 rounded-full">
          {flagEmoji(countryCode)} {countryCode} MARKET
        </span>
      </div>

      {/* Local Impact Text */}
      <div className="bg-[#0a0a0f] border border-[#1f1f30] rounded-xl p-3.5 space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1">
          <Landmark className="h-3 w-3" /> Local Market Analysis
        </span>
        <p className="text-xs text-gray-300 leading-relaxed font-normal">
          {getLocalizedImpact()}
        </p>
      </div>

      {/* Mini Currency Converter */}
      <div className="space-y-3.5 pt-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
          💱 Local Rate Converter
        </span>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[10px] text-gray-500 font-bold">USD</span>
            <input
              type="number"
              value={usdAmount}
              onChange={e => setUsdAmount(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[#2a2a3e] rounded-xl pl-9 pr-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[10px] text-gray-500 font-bold">{config.currency}</span>
            <div className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl pl-11 pr-2 py-2 text-xs text-amber-400 font-extrabold truncate">
              {config.symbol}{convertedValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <span className="text-[9px] text-gray-500 flex items-center gap-1 justify-end font-semibold">
          <RefreshCw className="h-2 w-2" /> Exchange rate: 1 USD = {config.symbol}{config.rate} {config.currency}
        </span>
      </div>
    </div>
  );
}
