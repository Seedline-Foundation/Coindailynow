export interface CountryLanguageConfig {
  defaultLanguage: string;
  alternativeLanguages: { code: string; name: string; nativeName: string }[];
}

export const COUNTRY_LANGUAGE_MAP: Record<string, CountryLanguageConfig> = {
  NG: {
    defaultLanguage: 'en',
    alternativeLanguages: [
      { code: 'ig', name: 'Igbo', nativeName: 'Asusu Igbo' },
      { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
      { code: 'yo', name: 'Yoruba', nativeName: 'Ede Yoruba' },
      { code: 'pcm', name: 'Nigerian Pidgin', nativeName: 'Naija' },
    ],
  },
  KE: {
    defaultLanguage: 'en',
    alternativeLanguages: [{ code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' }],
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
  BR: { defaultLanguage: 'pt', alternativeLanguages: [{ code: 'en', name: 'English', nativeName: 'English' }] },
  PY: { defaultLanguage: 'es', alternativeLanguages: [{ code: 'en', name: 'English', nativeName: 'English' }] },
  CL: { defaultLanguage: 'es', alternativeLanguages: [{ code: 'en', name: 'English', nativeName: 'English' }] },
  TT: { defaultLanguage: 'en', alternativeLanguages: [] },
  BB: { defaultLanguage: 'en', alternativeLanguages: [] },
  LC: { defaultLanguage: 'en', alternativeLanguages: [] },
};

export const DEFAULT_COUNTRY_CODE = 'NG';
export const DEFAULT_COUNTRY_SLUG = 'ng';

export const COUNTRY_ROUTE_MAP: Record<string, string> = {
  NG: 'ng',
  KE: 'ke',
  ZA: 'za',
  GH: 'gh',
  BR: 'br',
  PY: 'py',
  CL: 'cl',
  TT: 'tt',
  BB: 'bb',
  LC: 'lc',
};

export const ROUTE_TO_COUNTRY_MAP: Record<string, string> = Object.entries(COUNTRY_ROUTE_MAP).reduce(
  (acc, [countryCode, slug]) => {
    acc[slug] = countryCode;
    return acc;
  },
  {} as Record<string, string>
);

export const COUNTRY_MENU = [
  { code: 'NG', slug: 'ng', label: 'Nigeria' },
  { code: 'KE', slug: 'ke', label: 'Kenya' },
  { code: 'ZA', slug: 'za', label: 'South Africa' },
  { code: 'GH', slug: 'gh', label: 'Ghana' },
  { code: 'BR', slug: 'br', label: 'Brazil' },
  { code: 'PY', slug: 'py', label: 'Paraguay' },
  { code: 'CL', slug: 'cl', label: 'Chile' },
  { code: 'TT', slug: 'tt', label: 'Trinidad & Tobago' },
  { code: 'BB', slug: 'bb', label: 'Barbados' },
  { code: 'LC', slug: 'lc', label: 'Saint Lucia' },
];

export const DEFAULT_LANGUAGE_CONFIG: CountryLanguageConfig = {
  defaultLanguage: 'en',
  alternativeLanguages: [],
};

export const GLOBAL_LANGUAGES: { code: string; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Francais' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues' },
];

export const SUPPORTED_LANGUAGE_CODES = new Set([
  'en', 'fr', 'de', 'es', 'pt', 'ar', 'sw', 'ha', 'yo', 'ig', 'am', 'zu', 'xh', 'af', 'sn', 'om', 'pcm',
]);

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Francais',
  es: 'Espanol',
  pt: 'Portugues',
  de: 'Deutsch',
  ar: 'Arabic',
  sw: 'Kiswahili',
  ha: 'Hausa',
  yo: 'Yoruba',
  ig: 'Igbo',
  am: 'Amharic',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  af: 'Afrikaans',
  sn: 'chiShona',
  om: 'Oromoo',
  pcm: 'Nigerian Pidgin',
};

export function mergeWithGlobalLanguages(
  countryAlternatives: { code: string; name: string; nativeName: string }[],
  activeLang: string
): { code: string; name: string; nativeName: string }[] {
  const seen = new Set<string>([activeLang]);
  const merged: { code: string; name: string; nativeName: string }[] = [];

  for (const lang of countryAlternatives) {
    if (!seen.has(lang.code)) {
      seen.add(lang.code);
      merged.push(lang);
    }
  }
  for (const lang of GLOBAL_LANGUAGES) {
    if (!seen.has(lang.code)) {
      seen.add(lang.code);
      merged.push(lang);
    }
  }
  return merged;
}

export function getLanguageConfigForCountry(countryCode: string): CountryLanguageConfig {
  return COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()] || DEFAULT_LANGUAGE_CONFIG;
}

export function normalizeCountryCode(countryCode?: string | null): string {
  if (!countryCode) return DEFAULT_COUNTRY_CODE;
  const normalized = countryCode.toUpperCase();
  return COUNTRY_LANGUAGE_MAP[normalized] ? normalized : DEFAULT_COUNTRY_CODE;
}

export function countryCodeToRoute(countryCode?: string | null): string {
  const code = normalizeCountryCode(countryCode);
  return COUNTRY_ROUTE_MAP[code] || DEFAULT_COUNTRY_SLUG;
}

export function routeToCountryCode(routeCountry?: string | null): string {
  if (!routeCountry) return DEFAULT_COUNTRY_CODE;
  return ROUTE_TO_COUNTRY_MAP[routeCountry.toLowerCase()] || DEFAULT_COUNTRY_CODE;
}

export async function detectCountryFromIP(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return DEFAULT_COUNTRY_CODE;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return DEFAULT_COUNTRY_CODE;
    const data = await response.json();
    return normalizeCountryCode(data.countryCode);
  } catch {
    return DEFAULT_COUNTRY_CODE;
  }
}
