/**
 * LanguageSwitcher - Multi-language Content Switching Component
 * CoinDaily Platform - Task 21 Implementation
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArticleTranslation, SUPPORTED_LANGUAGES, Language } from '../../types/article';

interface LanguageSwitcherProps {
  translations: ArticleTranslation[];
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  showQualityIndicators?: boolean;
  showTranslationMeta?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  translations,
  currentLanguage,
  onLanguageChange,
  showQualityIndicators = false,
  showTranslationMeta = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get available languages with metadata
  const availableLanguages = translations.map(translation => {
    const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === translation.languageCode);
    return {
      translation,
      languageInfo: languageInfo || {
        code: translation.languageCode,
        name: translation.languageCode.toUpperCase(),
        nativeName: translation.languageCode.toUpperCase(),
        flag: '🌐',
        isRTL: false
      }
    };
  }).sort((a, b) => {
    // English first, then alphabetical
    if (a.translation.languageCode === 'en') return -1;
    if (b.translation.languageCode === 'en') return 1;
    return a.languageInfo.name.localeCompare(b.languageInfo.name);
  });

  const currentLanguageData = availableLanguages.find(
    lang => lang.translation.languageCode === currentLanguage
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, languageCode?: string) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (languageCode) {
          onLanguageChange(languageCode);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Focus next item
          const currentIndex = availableLanguages.findIndex(
            lang => lang.translation.languageCode === currentLanguage
          );
          const nextIndex = (currentIndex + 1) % availableLanguages.length;
          const nextLanguage = availableLanguages[nextIndex];
          if (nextLanguage) {
            onLanguageChange(nextLanguage.translation.languageCode);
          }
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const currentIndex = availableLanguages.findIndex(
            lang => lang.translation.languageCode === currentLanguage
          );
          const prevIndex = currentIndex === 0 ? availableLanguages.length - 1 : currentIndex - 1;
          const prevLanguage = availableLanguages[prevIndex];
          if (prevLanguage) {
            onLanguageChange(prevLanguage.translation.languageCode);
          }
        }
        break;
    }
  };

  // Quality score color
  const getQualityColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Translation type indicator
  const getTranslationTypeIcon = (translation: ArticleTranslation): string => {
    if (!translation.aiGenerated) return '👤'; // Human
    if (translation.humanReviewed) return '🤖👤'; // AI + Human
    return '🤖'; // AI only
  };

  const getTranslationTypeText = (translation: ArticleTranslation): string => {
    if (!translation.aiGenerated) return 'Human';
    if (translation.humanReviewed) return 'AI + Human';
    return 'AI';
  };

  if (availableLanguages.length <= 1) {
    return null; // Don't show switcher if only one language available
  }

  return (
    <div className={`language-switcher relative ${className}`} ref={dropdownRef}>
      {/* Current Language Button */}
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        role="combobox"
        aria-label="Select article language"
      >
        <div className="flex items-center">
          <span className="text-2xl mr-3">
            {currentLanguageData?.languageInfo.flag || '🌐'}
          </span>
          <div>
            <span className="font-medium text-gray-900">
              {currentLanguageData?.languageInfo.name || 'Unknown'}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              ({currentLanguageData?.languageInfo.nativeName || currentLanguage})
            </span>
            
            {showQualityIndicators && currentLanguageData?.translation.qualityScore && (
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  getQualityColor(currentLanguageData.translation.qualityScore)
                }`}
              >
                {currentLanguageData.translation.qualityScore}%
              </span>
            )}
          </div>
        </div>
        
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          <ul role="listbox" aria-label="Available languages">
            {availableLanguages.map(({ translation, languageInfo }) => (
              <li
                key={translation.languageCode}
                role="option"
                aria-selected={translation.languageCode === currentLanguage}
                className={`cursor-pointer select-none ${
                  translation.languageCode === currentLanguage
                    ? 'bg-green-50 text-green-900'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                <button
                  className="w-full px-4 py-3 text-left focus:outline-none focus:bg-gray-50"
                  onClick={() => {
                    onLanguageChange(translation.languageCode);
                    setIsOpen(false);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, translation.languageCode)}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{languageInfo.flag}</span>
                      <div>
                        <span className="font-medium">{languageInfo.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({languageInfo.nativeName})
                        </span>
                        
                        {showTranslationMeta && (
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400 mr-2">
                              {getTranslationTypeIcon(translation)}
                            </span>
                            <span className="text-xs text-gray-600">
                              {getTranslationTypeText(translation)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {showQualityIndicators && translation.qualityScore && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            getQualityColor(translation.qualityScore)
                          }`}
                        >
                          {translation.qualityScore}%
                        </span>
                      )}
                      
                      {translation.languageCode === currentLanguage && (
                        <svg
                          className="w-4 h-4 text-green-600 ml-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentLanguageData && (
          `Current language: ${currentLanguageData.languageInfo.name}`
        )}
      </div>
    </div>
  );
};
