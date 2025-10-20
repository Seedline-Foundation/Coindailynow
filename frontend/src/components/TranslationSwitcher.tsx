/**
 * Translation Switcher Component - Task 7.2
 * Allows instant switching between 15 African languages with quality indicators
 */

'use client';

import React, { useState } from 'react';
import { Languages, CheckCircle2, AlertCircle, Flag } from 'lucide-react';

export interface TranslationData {
  articleId: string;
  languageCode: string;
  title: string;
  excerpt: string;
  content: string;
  qualityScore: number;
  qualityIndicator: 'high' | 'medium' | 'low';
  aiGenerated: boolean;
  humanReviewed: boolean;
  translationStatus: string;
}

interface TranslationSwitcherProps {
  currentLanguage: string;
  availableLanguages: string[];
  onLanguageChange: (languageCode: string) => Promise<void>;
  currentTranslation?: TranslationData | null;
  isLoading?: boolean;
  className?: string;
}

// Language metadata
const LANGUAGE_INFO: Record<string, { name: string; region: string; flag: string }> = {
  en: { name: 'English', region: 'Primary', flag: '🇬🇧' },
  sw: { name: 'Swahili', region: 'East Africa', flag: '🇰🇪' },
  fr: { name: 'French', region: 'West/Central Africa', flag: '🇫🇷' },
  ar: { name: 'Arabic', region: 'North Africa', flag: '🇪🇬' },
  pt: { name: 'Portuguese', region: 'Lusophone Africa', flag: '🇵🇹' },
  am: { name: 'Amharic', region: 'Ethiopia', flag: '🇪🇹' },
  ha: { name: 'Hausa', region: 'West Africa', flag: '🇳🇬' },
  ig: { name: 'Igbo', region: 'Nigeria', flag: '🇳🇬' },
  yo: { name: 'Yoruba', region: 'Nigeria', flag: '🇳🇬' },
  zu: { name: 'Zulu', region: 'South Africa', flag: '🇿🇦' },
  af: { name: 'Afrikaans', region: 'South Africa', flag: '🇿🇦' },
  so: { name: 'Somali', region: 'Horn of Africa', flag: '🇸🇴' },
  om: { name: 'Oromo', region: 'Ethiopia', flag: '🇪🇹' },
  ti: { name: 'Tigrinya', region: 'Ethiopia/Eritrea', flag: '🇪🇷' },
  xh: { name: 'Xhosa', region: 'South Africa', flag: '🇿🇦' },
  sn: { name: 'Shona', region: 'Zimbabwe', flag: '🇿🇼' },
};

export const TranslationSwitcher: React.FC<TranslationSwitcherProps> = ({
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  currentTranslation,
  isLoading = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const getQualityColor = (indicator: string) => {
    switch (indicator) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    setIsOpen(false);
    await onLanguageChange(languageCode);
  };

  const currentLangInfo = LANGUAGE_INFO[currentLanguage] || {
    name: currentLanguage,
    region: 'Unknown',
    flag: '🌍',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Languages className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-700">
          {currentLangInfo.flag} {currentLangInfo.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Select Language ({availableLanguages.length} available)
              </div>
              <div className="space-y-1">
                {availableLanguages.map((langCode) => {
                  const info = LANGUAGE_INFO[langCode] || {
                    name: langCode,
                    region: 'Unknown',
                    flag: '🌍',
                  };
                  const isCurrent = langCode === currentLanguage;

                  return (
                    <button
                      key={langCode}
                      onClick={() => handleLanguageSelect(langCode)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{info.flag}</span>
                        <div className="text-left">
                          <div className="font-medium">{info.name}</div>
                          <div className="text-xs text-gray-500">{info.region}</div>
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Translation Quality Indicator */}
      {currentTranslation && (
        <div className="mt-3 space-y-2">
          {/* Quality Score */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${getQualityColor(
              currentTranslation.qualityIndicator
            )}`}
          >
            <div className="flex items-center gap-2">
              {currentTranslation.qualityIndicator === 'high' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <div>
                <div className="text-sm font-medium">Translation Quality</div>
                <div className="text-xs opacity-75">
                  Score: {currentTranslation.qualityScore}/100
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium uppercase">
                {currentTranslation.qualityIndicator}
              </div>
            </div>
          </div>

          {/* Translation Info */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {currentTranslation.aiGenerated && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  AI-Generated
                </span>
              )}
              {currentTranslation.humanReviewed && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Human Reviewed
                </span>
              )}
            </div>
            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Flag className="w-4 h-4" />
              <span className="text-xs">Report Issue</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-3 flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading translation...</span>
        </div>
      )}
    </div>
  );
};

export default TranslationSwitcher;
