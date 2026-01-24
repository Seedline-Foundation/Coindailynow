/**
 * Language Selector Component - Task 8.1
 * 
 * Dropdown selector for 15 African languages with:
 * - Persistent language preference (localStorage + backend)
 * - Auto-detect user location
 * - Beautiful UI with flags and native names
 * - Real-time translation switching
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';

// 13 Supported Languages (7 African + 6 European)
export const SUPPORTED_LANGUAGES = {
  // Global & African Languages
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  yo: { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  ig: { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: 'BA' },
  am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  zu: { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  
  // European Languages
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '��' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '��' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '��' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '��' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '��' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '��' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface LanguageSelectorProps {
  currentLanguage?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
  variant?: 'default' | 'compact' | 'minimal';
  showNativeName?: boolean;
  autoDetect?: boolean;
}

// Detect language from browser/location
const detectUserLanguage = (): LanguageCode => {
  // Try localStorage first
  const stored = localStorage.getItem('preferredLanguage');
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as LanguageCode;
  }

  // Try browser language
  const browserLang = navigator.language.toLowerCase().substring(0, 2);
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as LanguageCode;
  }

  // Try geolocation (if available)
  // This would be enhanced with actual GeoIP detection
  return 'en';
};

// Save preference to backend
const saveLanguagePreference = async (language: LanguageCode) => {
  try {
    const response = await fetch('/api/user/language-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ preferredLanguage: language }),
    });

    if (!response.ok) {
      console.warn('Failed to save language preference to backend');
    }
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage: externalLanguage,
  onLanguageChange,
  variant = 'default',
  showNativeName = true,
  autoDetect = true,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language on mount
  useEffect(() => {
    if (!isInitialized) {
      const detected = autoDetect ? detectUserLanguage() : 'en';
      setSelectedLanguage(externalLanguage || detected);
      setIsInitialized(true);
    }
  }, [autoDetect, externalLanguage, isInitialized]);

  // Handle language change
  const handleLanguageChange = (language: LanguageCode) => {
    setSelectedLanguage(language);
    setIsOpen(false);

    // Save to localStorage
    localStorage.setItem('preferredLanguage', language);

    // Save to backend (async, non-blocking)
    saveLanguagePreference(language);

    // Notify parent component
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  const currentLang = SUPPORTED_LANGUAGES[selectedLanguage];

  // Minimal variant (just flag + dropdown)
  if (variant === 'minimal') {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Select language"
        >
          <span className="text-xl">{currentLang.flag}</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as LanguageCode)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedLanguage === code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.nativeName}</span>
                  {selectedLanguage === code && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          aria-label="Select language"
        >
          <Globe className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xl">{currentLang.flag}</span>
          <span className="text-sm font-medium">{currentLang.code.toUpperCase()}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2">
                  SELECT LANGUAGE
                </p>
              </div>
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as LanguageCode)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedLanguage === code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {lang.nativeName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.name}
                    </div>
                  </div>
                  {selectedLanguage === code && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant (full featured)
  return (
    <div className="relative inline-block w-full max-w-xs">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Globe className="inline w-4 h-4 mr-1" />
        Language / Lugha / Langue
      </label>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        aria-label="Select language"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentLang.flag}</span>
          <div className="text-left">
            <div className="font-semibold text-gray-900 dark:text-white">
              {showNativeName ? currentLang.nativeName : currentLang.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentLang.name}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                SELECT YOUR PREFERRED LANGUAGE
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                All content will be translated to your choice
              </p>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as LanguageCode)}
                  className={`w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedLanguage === code
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {lang.nativeName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {lang.name}
                    </div>
                  </div>
                  {selectedLanguage === code && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        ACTIVE
                      </span>
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;

