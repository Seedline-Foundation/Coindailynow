'use client';

import { useGeo } from '@/lib/GeoContext';
import { LANGUAGE_NAMES } from '@/lib/geo';
import { useState } from 'react';

export default function LanguageBanner() {
  const { activeLanguage, alternativeLanguages, setLanguage, isLoading } = useGeo();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || dismissed || alternativeLanguages.length === 0) {
    return null;
  }

  const currentLangName = LANGUAGE_NAMES[activeLanguage] || 'English';

  return (
    <div className="bg-dark-900/80 border-b border-dark-800 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400">
            Reading in <span className="text-white font-medium">{currentLangName}</span>
          </span>
          <span className="text-gray-600">.</span>
          <span className="text-gray-400">Read in</span>
          {alternativeLanguages.map((lang, i) => (
            <span key={lang.code}>
              <button
                onClick={() => setLanguage(lang.code)}
                className="text-primary-400 hover:text-primary-300 font-medium underline underline-offset-2 transition-colors"
              >
                {lang.nativeName}
              </button>
              {i < alternativeLanguages.length - 1 && (
                <span className="text-gray-600">{i === alternativeLanguages.length - 2 ? ' or ' : ', '}</span>
              )}
            </span>
          ))}
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
          aria-label="Dismiss language suggestion"
        >
          x
        </button>
      </div>
    </div>
  );
}
