/**
 * Supported Languages Configuration - Task 8.1
 * 
 * Centralized language configuration for both frontend and backend.
 * 13 languages: 7 African + 6 European
 */

export const SUPPORTED_LANGUAGES = {
  // Global & African Languages
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  yo: { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  ig: { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  zu: { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  
  // European Languages
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Language regions for better organization
export const LANGUAGE_REGIONS = {
  african: ['sw', 'ha', 'yo', 'ig', 'am', 'zu'] as LanguageCode[],
  european: ['es', 'pt', 'it', 'de', 'fr', 'ru'] as LanguageCode[],
  global: ['en'] as LanguageCode[],
};

// Country to language mapping for auto-detection
export const COUNTRY_LANGUAGE_MAP: Record<string, LanguageCode> = {
  // African countries
  KE: 'sw', // Kenya - Swahili
  TZ: 'sw', // Tanzania - Swahili
  NG: 'ha', // Nigeria - Hausa (could also be yo or ig)
  ET: 'am', // Ethiopia - Amharic
  ZA: 'zu', // South Africa - Zulu
  
  // European countries
  ES: 'es', // Spain - Spanish
  MX: 'es', // Mexico - Spanish
  PT: 'pt', // Portugal - Portuguese
  BR: 'pt', // Brazil - Portuguese
  IT: 'it', // Italy - Italian
  DE: 'de', // Germany - German
  AT: 'de', // Austria - German
  FR: 'fr', // France - French
  RU: 'ru', // Russia - Russian
  
  // Default English-speaking countries
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en',
};

export default SUPPORTED_LANGUAGES;
