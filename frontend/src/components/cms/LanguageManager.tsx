/**
 * Language Manager Component - Multi-language content management
 * Features: Translation status, language switching, batch translation requests, African languages support
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  GlobeAltIcon, 
  LanguageIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  ArticleTranslation, 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageCode 
} from '../../services/cmsService';

interface LanguageManagerProps {
  articleId?: string;
  translations: ArticleTranslation[];
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  onRequestTranslation: (languages: string[]) => Promise<void>;
}

interface TranslationStatusProps {
  translation: ArticleTranslation;
  language: { code: string; name: string; flag: string };
  onView: () => void;
}

const TranslationStatus: React.FC<TranslationStatusProps> = ({ 
  translation, 
  language, 
  onView 
}) => {
  const getStatusIcon = () => {
    switch (translation.status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-accent-600" />;
      case 'IN_PROGRESS':
        return <ArrowPathIcon className="h-5 w-5 text-primary-600 animate-spin" />;
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-orange-600" />;
      case 'REJECTED':
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getStatusColor = () => {
    switch (translation.status) {
      case 'COMPLETED': return 'text-accent-600';
      case 'IN_PROGRESS': return 'text-primary-600';
      case 'PENDING': return 'text-orange-600';
      case 'REJECTED':
      case 'FAILED': return 'text-red-600';
      default: return 'text-neutral-400';
    }
  };

  const getStatusBgColor = () => {
    switch (translation.status) {
      case 'COMPLETED': return 'bg-accent-50 dark:bg-accent-900/20 border-accent-200 dark:border-accent-800';
      case 'IN_PROGRESS': return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
      case 'PENDING': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'REJECTED':
      case 'FAILED': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default: return 'bg-neutral-50 dark:bg-neutral-900/20 border-neutral-200 dark:border-neutral-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${getStatusBgColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={language.name}>
            {language.flag}
          </span>
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white">
              {language.name}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {language.code.toUpperCase()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {translation.status.toLowerCase().replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Translation details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Created:</span>
          <span className="text-neutral-900 dark:text-white">
            {new Date(translation.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-neutral-400">Updated:</span>
          <span className="text-neutral-900 dark:text-white">
            {new Date(translation.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {translation.reviewNotes && (
          <div className="mt-3 p-2 bg-white dark:bg-neutral-800 rounded border">
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Review Notes:</p>
            <p className="text-sm text-neutral-900 dark:text-white">
              {translation.reviewNotes}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {translation.status === 'COMPLETED' && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onView}
            className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View Translation</span>
          </button>
        </div>
      )}
    </div>
  );
};

const LanguageSelector: React.FC<{
  availableLanguages: typeof SUPPORTED_LANGUAGES[number][];
  selectedLanguages: string[];
  onLanguageToggle: (languageCode: string) => void;
  onRequestTranslation: () => void;
  isRequesting: boolean;
}> = ({ 
  availableLanguages, 
  selectedLanguages, 
  onLanguageToggle, 
  onRequestTranslation,
  isRequesting
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
          Request New Translation
        </h3>
        <LanguageIcon className="h-5 w-5 text-primary-600" />
      </div>

      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        Select languages to translate your article into. AI translation with cultural adaptation and crypto glossary support.
      </p>

      {/* Language grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {availableLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => onLanguageToggle(language.code)}
            className={`p-3 rounded-lg border transition-colors ${
              selectedLanguages.includes(language.code)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            <div className="text-center">
              <div className="text-xl mb-1" role="img" aria-label={language.name}>
                {language.flag}
              </div>
              <div className="text-xs font-medium">
                {language.name}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {language.code.toUpperCase()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {selectedLanguages.length === 0 
            ? 'Select languages to translate into'
            : `${selectedLanguages.length} language${selectedLanguages.length !== 1 ? 's' : ''} selected`
          }
        </div>
        
        <button
          onClick={onRequestTranslation}
          disabled={selectedLanguages.length === 0 || isRequesting}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
        >
          {isRequesting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          <span>
            {isRequesting ? 'Requesting...' : 'Request Translation'}
          </span>
        </button>
      </div>
    </div>
  );
};

export const LanguageManager: React.FC<LanguageManagerProps> = ({
  articleId,
  translations,
  supportedLanguages,
  onRequestTranslation
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

  // Get available languages (not yet translated)
  const availableLanguages = useMemo(() => {
    const existingLanguageCodes = translations.map(t => t.languageCode);
    return supportedLanguages.filter(lang => 
      lang.code !== 'en' && !existingLanguageCodes.includes(lang.code)
    );
  }, [translations, supportedLanguages]);

  // Handle language selection
  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageCode)
        ? prev.filter(code => code !== languageCode)
        : [...prev, languageCode]
    );
  };

  // Handle translation request
  const handleRequestTranslation = async () => {
    if (selectedLanguages.length === 0) return;

    setIsRequesting(true);
    try {
      await onRequestTranslation(selectedLanguages);
      setSelectedLanguages([]);
      setActiveTab('existing');
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle viewing translation
  const handleViewTranslation = (translation: ArticleTranslation) => {
    // This would open a modal or navigate to view the translation
    console.log('View translation:', translation);
  };

  if (!articleId) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
        <div className="text-center">
          <GlobeAltIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Save Article First
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Please save your article before managing translations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
              Multi-Language Management
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Manage translations for your article across {supportedLanguages.length} African languages
            </p>
          </div>
          <GlobeAltIcon className="h-8 w-8 text-primary-600" />
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {translations.length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Total Translations
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent-600">
              {translations.filter(t => t.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Completed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {translations.filter(t => ['PENDING', 'IN_PROGRESS'].includes(t.status)).length}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              In Progress
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="border-b border-neutral-200 dark:border-neutral-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('existing')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'existing'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Existing Translations ({translations.length})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'new'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <PlusIcon className="h-4 w-4 inline mr-1" />
              Request New ({availableLanguages.length} available)
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'existing' ? (
            // Existing translations
            <div>
              {translations.length === 0 ? (
                <div className="text-center py-8">
                  <LanguageIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    No Translations Yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Request translations to reach a wider African audience.
                  </p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="btn btn-primary"
                  >
                    Request Translation
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2" data-testid="translation-status">
                  {translations.map((translation) => {
                    const language = supportedLanguages.find(
                      lang => lang.code === translation.languageCode
                    ) || { code: translation.languageCode, name: translation.languageCode, flag: '🌍' };
                    
                    return (
                      <TranslationStatus
                        key={translation.id}
                        translation={translation}
                        language={language}
                        onView={() => handleViewTranslation(translation)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Request new translation
            <LanguageSelector
              availableLanguages={availableLanguages}
              selectedLanguages={selectedLanguages}
              onLanguageToggle={handleLanguageToggle}
              onRequestTranslation={handleRequestTranslation}
              isRequesting={isRequesting}
            />
          )}
        </div>
      </div>

      {/* African Languages Information */}
      <div className="bg-gradient-to-r from-orange-50 to-secondary-50 dark:from-orange-900/20 dark:to-secondary-900/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="text-2xl">🌍</div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              African Language Support
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
              Our AI translation system supports {supportedLanguages.length} languages with:
            </p>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
              <li>• Cultural adaptation for African contexts</li>
              <li>• Cryptocurrency and memecoin glossary integration</li>
              <li>• Local currency and exchange references</li>
              <li>• Human review for quality assurance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageManager;