import { NextResponse } from 'next/server';
import {
  detectCountryFromIP,
  getLanguageConfigForCountry,
  mergeWithGlobalLanguages,
  SUPPORTED_LANGUAGE_CODES,
  normalizeCountryCode,
} from '@/lib/geo';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const browserLang = searchParams.get('browserLang')?.split('-')[0]?.toLowerCase() || '';

  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';

  const headerCountry =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code');

  const countryCode = headerCountry ? normalizeCountryCode(headerCountry) : await detectCountryFromIP(ip);
  const languageConfig = getLanguageConfigForCountry(countryCode);

  const cookieLang = request.headers
    .get('cookie')
    ?.split(';')
    .find((c) => c.trim().startsWith('lang='))
    ?.split('=')[1]
    ?.trim();

  let activeLanguage = languageConfig.defaultLanguage;
  if (cookieLang && SUPPORTED_LANGUAGE_CODES.has(cookieLang)) {
    activeLanguage = cookieLang;
  } else if (browserLang && SUPPORTED_LANGUAGE_CODES.has(browserLang)) {
    activeLanguage = browserLang;
  }

  const alternativeLanguages = mergeWithGlobalLanguages(languageConfig.alternativeLanguages, activeLanguage);

  return NextResponse.json(
    {
      countryCode,
      ipLanguage: languageConfig.defaultLanguage,
      browserLanguage: browserLang || null,
      activeLanguage,
      alternativeLanguages,
    },
    { headers: { 'Cache-Control': 'private, max-age=3600' } }
  );
}
