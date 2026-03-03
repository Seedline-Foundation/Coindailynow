/**
 * CoinDaily — Canonical Language Configuration
 *
 * Single source of truth for all 18 supported languages:
 *   1 source language (English) + 17 NLLB translation targets.
 *
 * Every service — frontend, backend, ai-system — MUST import from here.
 * DO NOT define ad-hoc language lists elsewhere.
 */

export interface LanguageEntry {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  /** NLLB-200 BCP-47-style code used by the translation model */
  nllbCode: string | null;
  region: 'global' | 'west-africa' | 'east-africa' | 'horn-of-africa' | 'southern-africa' | 'north-africa' | 'european';
  direction: 'ltr' | 'rtl';
  countries: string[];
}

/**
 * 18 languages total — English (source) + 17 NLLB translation targets
 */
export const SUPPORTED_LANGUAGES: Record<string, LanguageEntry> = {
  // ─── Source Language ───────────────────────────────────────
  en: {
    code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧',
    nllbCode: 'eng_Latn', region: 'global', direction: 'ltr',
    countries: ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'USA', 'UK'],
  },

  // ─── West Africa ──────────────────────────────────────────
  ha: {
    code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬',
    nllbCode: 'hau_Latn', region: 'west-africa', direction: 'ltr',
    countries: ['Nigeria', 'Niger', 'Ghana'],
  },
  yo: {
    code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬',
    nllbCode: 'yor_Latn', region: 'west-africa', direction: 'ltr',
    countries: ['Nigeria', 'Benin'],
  },
  ig: {
    code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬',
    nllbCode: 'ibo_Latn', region: 'west-africa', direction: 'ltr',
    countries: ['Nigeria'],
  },
  pcm: {
    code: 'pcm', name: 'Pidgin', nativeName: 'Naijá', flag: '🇳🇬',
    nllbCode: 'pcm_Latn', region: 'west-africa', direction: 'ltr',
    countries: ['Nigeria'],
  },
  wol: {
    code: 'wol', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳',
    nllbCode: 'wol_Latn', region: 'west-africa', direction: 'ltr',
    countries: ['Senegal', 'Gambia'],
  },

  // ─── East Africa ──────────────────────────────────────────
  sw: {
    code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪',
    nllbCode: 'swh_Latn', region: 'east-africa', direction: 'ltr',
    countries: ['Kenya', 'Tanzania', 'Uganda'],
  },
  kin: {
    code: 'kin', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼',
    nllbCode: 'kin_Latn', region: 'east-africa', direction: 'ltr',
    countries: ['Rwanda'],
  },

  // ─── Horn of Africa ───────────────────────────────────────
  am: {
    code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹',
    nllbCode: 'amh_Ethi', region: 'horn-of-africa', direction: 'ltr',
    countries: ['Ethiopia'],
  },
  so: {
    code: 'so', name: 'Somali', nativeName: 'Soomali', flag: '🇸🇴',
    nllbCode: 'som_Latn', region: 'horn-of-africa', direction: 'ltr',
    countries: ['Somalia', 'Ethiopia', 'Kenya'],
  },
  om: {
    code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹',
    nllbCode: 'orm_Latn', region: 'horn-of-africa', direction: 'ltr',
    countries: ['Ethiopia'],
  },

  // ─── Southern Africa ──────────────────────────────────────
  zu: {
    code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦',
    nllbCode: 'zul_Latn', region: 'southern-africa', direction: 'ltr',
    countries: ['South Africa'],
  },
  af: {
    code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦',
    nllbCode: 'afr_Latn', region: 'southern-africa', direction: 'ltr',
    countries: ['South Africa'],
  },
  sn: {
    code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼',
    nllbCode: 'sna_Latn', region: 'southern-africa', direction: 'ltr',
    countries: ['Zimbabwe'],
  },

  // ─── North Africa ─────────────────────────────────────────
  ar: {
    code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬',
    nllbCode: 'arb_Arab', region: 'north-africa', direction: 'rtl',
    countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco'],
  },

  // ─── European / International ─────────────────────────────
  fr: {
    code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷',
    nllbCode: 'fra_Latn', region: 'european', direction: 'ltr',
    countries: ['Senegal', 'Mali', 'Cameroon', 'France'],
  },
  pt: {
    code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹',
    nllbCode: 'por_Latn', region: 'european', direction: 'ltr',
    countries: ['Angola', 'Mozambique', 'Cape Verde', 'Brazil', 'Portugal'],
  },
  es: {
    code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸',
    nllbCode: 'spa_Latn', region: 'european', direction: 'ltr',
    countries: ['Equatorial Guinea', 'Spain', 'Mexico'],
  },
};

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/** Ordered array for dropdowns / iteration */
export const LANGUAGE_LIST: LanguageEntry[] = Object.values(SUPPORTED_LANGUAGES);

/** Only translation targets (everything except English) */
export const TRANSLATION_TARGETS = LANGUAGE_LIST.filter(l => l.code !== 'en');

/** Quick code→name lookup */
export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  LANGUAGE_LIST.map(l => [l.code, l.name]),
);

/** Language codes grouped by region */
export const LANGUAGE_REGIONS = {
  global:           LANGUAGE_LIST.filter(l => l.region === 'global').map(l => l.code),
  'west-africa':    LANGUAGE_LIST.filter(l => l.region === 'west-africa').map(l => l.code),
  'east-africa':    LANGUAGE_LIST.filter(l => l.region === 'east-africa').map(l => l.code),
  'horn-of-africa': LANGUAGE_LIST.filter(l => l.region === 'horn-of-africa').map(l => l.code),
  'southern-africa':LANGUAGE_LIST.filter(l => l.region === 'southern-africa').map(l => l.code),
  'north-africa':   LANGUAGE_LIST.filter(l => l.region === 'north-africa').map(l => l.code),
  european:         LANGUAGE_LIST.filter(l => l.region === 'european').map(l => l.code),
};

/** Country → best-guess language code for auto-detection */
export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  NG: 'ig', KE: 'sw', TZ: 'sw', UG: 'sw',
  ET: 'am', ZA: 'zu', ZW: 'sn', RW: 'kin',
  SN: 'wol', SO: 'so', GH: 'en',
  EG: 'ar', LY: 'ar', TN: 'ar', DZ: 'ar', MA: 'ar',
  AO: 'pt', MZ: 'pt', CV: 'pt', BR: 'pt', PT: 'pt',
  CM: 'fr', ML: 'fr', FR: 'fr',
  GQ: 'es', ES: 'es', MX: 'es',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en',
};

/** Validate whether a code is a supported language */
export function isValidLanguage(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

export default SUPPORTED_LANGUAGES;
