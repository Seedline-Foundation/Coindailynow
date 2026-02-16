'use client';

import { useGeo } from '@/lib/GeoContext';
import { LANGUAGE_NAMES } from '@/lib/geo';
import { useState, useRef, useEffect } from 'react';

/**
 * LanguageSwitcher — small dropdown in the header top-right
 * Shows current language flag and allows switching.
 */
export default function LanguageSwitcher() {
  const { activeLanguage, alternativeLanguages, setLanguage, isLoading } = useGeo();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading) return null;

  const currentName = LANGUAGE_NAMES[activeLanguage] || 'English';
  const allOptions = [
    { code: activeLanguage, name: currentName, nativeName: currentName },
    ...alternativeLanguages.filter(l => l.code !== activeLanguage),
  ];

  // If only one language, no need to show switcher
  if (allOptions.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-dark-800 transition-colors border border-dark-700"
        aria-label="Switch language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
        <span className="hidden sm:inline">{currentName}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {allOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                lang.code === activeLanguage
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <span>{lang.nativeName}</span>
              {lang.code === activeLanguage && (
                <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
