/**
 * IP Geolocation & Language Detection Service
 * Detects user's country from IP and resolves the default + alternative languages.
 * Uses the free ip-api.com service (no API key needed, 45 req/min for non-commercial).
 * On the server side (Next.js middleware/RSC), we read x-forwarded-for or request IP.
 * On the client side, we call our own /api/geo endpoint.
 */

// ============================================================================
// Country → Language Mapping (default + alternatives)
// ============================================================================

export interface CountryLanguageConfig {
  defaultLanguage: string;
  alternativeLanguages: { code: string; name: string; nativeName: string }[];
}

/**
 * Comprehensive country→language map for all countries we cover.
 * Key = ISO 3166-1 alpha-2 country code (uppercase).
 */
export const COUNTRY_LANGUAGE_MAP: Record<string, CountryLanguageConfig> = {
  // ─── Africa ───
  NG: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo' },
      { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
      { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá' },
    ],
  },
  KE: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
    ],
  },
  ZA: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
      { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
      { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa' },
    ],
  },
  GH: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  ZM: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  ZW: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
    ],
  },
  TZ: {
    defaultLanguage: 'sw',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  ET: {
    defaultLanguage: 'am',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
    ],
  },
  SN: {
    defaultLanguage: 'fr',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  TN: {
    defaultLanguage: 'ar',
    alternativeLanguages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  EG: {
    defaultLanguage: 'ar',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  MA: {
    defaultLanguage: 'ar',
    alternativeLanguages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  MR: {
    defaultLanguage: 'ar',
    alternativeLanguages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ],
  },

  // ─── Americas ───
  US: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ],
  },
  CA: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ],
  },
  BR: {
    defaultLanguage: 'pt',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  CL: {
    defaultLanguage: 'es',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  VE: {
    defaultLanguage: 'es',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  PY: {
    defaultLanguage: 'es',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  PA: {
    defaultLanguage: 'es',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  BB: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  LC: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  TT: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },

  // ─── Europe ───
  GB: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  DE: {
    defaultLanguage: 'de',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  FR: {
    defaultLanguage: 'fr',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  ES: {
    defaultLanguage: 'es',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },

  // ─── Middle East & Asia ───
  AE: {
    defaultLanguage: 'ar',
    alternativeLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
    ],
  },
  IL: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  MY: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },
  IR: {
    defaultLanguage: 'en',
    alternativeLanguages: [],
  },

  // ─── Pacific ───
  VU: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'fr', name: 'French', nativeName: 'Français' },
    ],
  },
};

// Fallback for unknown countries
export const DEFAULT_LANGUAGE_CONFIG: CountryLanguageConfig = {
  defaultLanguage: 'en',
  alternativeLanguages: [],
};

/**
 * Languages that are ALWAYS available to every visitor, regardless of country.
 * These appear in the LanguageSwitcher dropdown for everyone.
 */
export const GLOBAL_LANGUAGES: { code: string; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

/**
 * All language codes the site supports (for validating browser language).
 */
export const SUPPORTED_LANGUAGE_CODES = new Set([
  'en', 'fr', 'de', 'es', 'pt',
  'ar', 'sw', 'ha', 'yo', 'ig', 'am', 'zu', 'xh', 'af', 'sn', 'om',
  'it', 'ru',
]);

/**
 * Merge country-specific alternatives with global languages, no duplicates.
 */
export function mergeWithGlobalLanguages(
  countryAlternatives: { code: string; name: string; nativeName: string }[],
  activeLang: string
): { code: string; name: string; nativeName: string }[] {
  const seen = new Set<string>();
  seen.add(activeLang); // don't include the active language as an "alternative"
  const merged: { code: string; name: string; nativeName: string }[] = [];

  // Country-specific first (higher relevance)
  for (const lang of countryAlternatives) {
    if (!seen.has(lang.code)) {
      seen.add(lang.code);
      merged.push(lang);
    }
  }
  // Then global languages
  for (const lang of GLOBAL_LANGUAGES) {
    if (!seen.has(lang.code)) {
      seen.add(lang.code);
      merged.push(lang);
    }
  }

  return merged;
}

// Language code → display name map
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  ar: 'العربية',
  sw: 'Kiswahili',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  am: 'አማርኛ',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  sn: 'chiShona',
  om: 'Oromoo',
  it: 'Italiano',
  ru: 'Русский',
};

/**
 * Resolve language config for a country code
 */
export function getLanguageConfigForCountry(countryCode: string): CountryLanguageConfig {
  return COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()] || DEFAULT_LANGUAGE_CONFIG;
}

/**
 * Detect country from IP using ip-api.com (free, no key needed).
 * Call this server-side only (Next.js API route or middleware).
 */
export async function detectCountryFromIP(ip: string): Promise<string> {
  // Localhost / private IPs → default
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'US'; // default for local dev
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (!response.ok) return 'US';
    const data = await response.json();
    return data.countryCode || 'US';
  } catch {
    return 'US';
  }
}
