/**
 * Translation API Route
 * Proxies translation requests to the backend NLLB translation service.
 * Used by LanguageContext.translateContent() for full-page translation.
 */

import { NextRequest, NextResponse } from 'next/server';

// NLLB language code mapping (ISO 639 → NLLB code)
const NLLB_LANG_MAP: Record<string, string> = {
  ha: 'hau_Latn',
  yo: 'yor_Latn',
  ig: 'ibo_Latn',
  sw: 'swh_Latn',
  am: 'amh_Ethi',
  zu: 'zul_Latn',
  ar: 'arb_Arab',
  fr: 'fra_Latn',
  pt: 'por_Latn',
  es: 'spa_Latn',
  pcm: 'pcm_Latn',
  af: 'afr_Latn',
  so: 'som_Latn',
  om: 'orm_Latn',
  sn: 'sna_Latn',
  xh: 'xho_Latn',
  ti: 'tir_Ethi',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const NLLB_URL = process.env.NLLB_API_ENDPOINT || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing text or targetLanguage' },
        { status: 400 }
      );
    }

    // If English, return as-is
    if (targetLanguage === 'en') {
      return NextResponse.json({ translatedText: text });
    }

    const nllbCode = NLLB_LANG_MAP[targetLanguage];
    if (!nllbCode) {
      return NextResponse.json(
        { error: `Unsupported language: ${targetLanguage}` },
        { status: 400 }
      );
    }

    // Try NLLB service directly
    try {
      const nllbRes = await fetch(`${NLLB_URL}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: 'eng_Latn',
          target_lang: nllbCode,
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (nllbRes.ok) {
        const data = await nllbRes.json();
        return NextResponse.json({
          translatedText: data.translated_text || data.translation || text,
        });
      }
    } catch {
      // NLLB direct call failed, try backend proxy
    }

    // Fallback: try backend translation endpoint
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: nllbCode }),
        signal: AbortSignal.timeout(10_000),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json({
          translatedText: data.translatedText || data.data?.translatedText || text,
        });
      }
    } catch {
      // Backend also failed
    }

    // Ultimate fallback: return original text
    return NextResponse.json({ translatedText: text });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}
