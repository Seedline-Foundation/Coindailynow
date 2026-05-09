import { NextResponse } from 'next/server';
import {
  detectCountryFromIP,
  getLanguageConfigForCountry,
  mergeWithGlobalLanguages,
  SUPPORTED_LANGUAGE_CODES,
} from '@/lib/geo';

/**
 * GET /api/geo?browserLang=en
 *
 * Language resolution priority:
 *   1. Cookie override (user previously picked a language manually)
 *   2. Browser language (navigator.language sent by the client)
 *   3. IP-based country default
 *
 * This means: If browser says English but IP resolves to France,
 * the active language will be English (browser wins).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const browserLang = searchParams.get('browserLang')?.split('-')[0]?.toLowerCase() || '';

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';

  const countryCode = await detectCountryFromIP(ip);
  const languageConfig = getLanguageConfigForCountry(countryCode);

  // Cookie override (highest priority — user explicitly chose a language)
  const cookieLang = request.headers.get('cookie')
    ?.split(';')
    .find(c => c.trim().startsWith('lang='))
    ?.split('=')[1]
    ?.trim();

  // Resolve active language: cookie > browser > IP country default
  let activeLanguage = languageConfig.defaultLanguage;
  if (cookieLang && SUPPORTED_LANGUAGE_CODES.has(cookieLang)) {
    activeLanguage = cookieLang;
  } else if (browserLang && SUPPORTED_LANGUAGE_CODES.has(browserLang)) {
    activeLanguage = browserLang;
  }

  // Merge country-specific + global languages (de, fr, es, pt always present)
  const alternativeLanguages = mergeWithGlobalLanguages(
    languageConfig.alternativeLanguages,
    activeLanguage
  );

  return NextResponse.json({
    countryCode,
    ipLanguage: languageConfig.defaultLanguage,
    browserLanguage: browserLang || null,
    activeLanguage,
    alternativeLanguages,
  }, {
    headers: {
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
