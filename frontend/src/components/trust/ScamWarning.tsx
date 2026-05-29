'use client';

import React from 'react';
import { ShieldAlert, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';

interface ScamWarningProps {
  projectName?: string;
  riskFactors?: string[];
  severity?: 'warning' | 'critical';
}

export default function ScamWarning({
  projectName = 'This Project',
  riskFactors = [
    'Liquidity keys are not locked, creating high rug-pull vulnerability.',
    'Founder wallet holds over 45% of the total circulating token supply.',
    'Smart contract remains un-audited by recognized third-party security firms.'
  ],
  severity = 'warning'
}: ScamWarningProps) {
  
  const isCritical = severity === 'critical';
  const borderClass = isCritical ? 'border-red-500/35 bg-red-950/20' : 'border-amber-500/25 bg-amber-950/10';
  const textClass = isCritical ? 'text-red-400 font-extrabold' : 'text-amber-400 font-extrabold';
  const icon = isCritical ? <ShieldAlert className="h-6 w-6 text-red-500 shrink-0" /> : <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />;

  return (
    <div className={`border rounded-2xl p-5 md:p-6 ${borderClass} flex flex-col md:flex-row gap-5 items-start relative overflow-hidden shadow-lg shadow-black/10`}>
      
      {/* Icon and Title */}
      <div className="flex gap-4 items-start w-full">
        {icon}
        <div className="space-y-3 w-full">
          <div>
            <h4 className={`text-base ${textClass}`}>
              Security Notice: Unverified or High-Risk Project ({projectName})
            </h4>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              CoinDaily's automated contract analyzer and security desk have identified multiple risk markers for the mentioned tokens or platform:
            </p>
          </div>

          {/* Risk Factors List */}
          <ul className="space-y-2 text-xs text-gray-300 list-disc pl-4 leading-relaxed font-normal">
            {riskFactors.map((factor, index) => (
              <li key={index}>{factor}</li>
            ))}
          </ul>

          {/* Action Links */}
          <div className="flex flex-wrap gap-4 pt-2 text-[10px] uppercase font-bold tracking-wider items-center">
            <a
              href="/scam-watch"
              className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5"
            >
              <span>Browse Security Database</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            
            <a
              href="/user/help?tab=chat"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Ask AI Concierge for details</span>
              <HelpCircle className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
      
    </div>
  );
}
