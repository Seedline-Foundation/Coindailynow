/**
 * Translation API Route
 * Uses NLLB-200 for 15 African languages
 */

import { NextRequest, NextResponse } from 'next/server';

const NLLB_URL = process.env.NLLB_API_ENDPOINT || 'http://localhost:8080';

// NLLB-200 language codes for African languages
const LANGUAGE_CODES: Record<string, string> = {
  'english': 'eng_Latn',
  'hausa': 'hau_Latn',
  'yoruba': 'yor_Latn',
  'igbo': 'ibo_Latn',
  'swahili': 'swh_Latn',
  'amharic': 'amh_Ethi',
  'zulu': 'zul_Latn',
  'shona': 'sna_Latn',
  'afrikaans': 'afr_Latn',
  'somali': 'som_Latn',
  'oromo': 'orm_Latn',
  'arabic': 'arb_Arab',
  'french': 'fra_Latn',
  'portuguese': 'por_Latn',
  'wolof': 'wol_Latn',
  'kinyarwanda': 'kin_Latn'
};

export async function POST(request: NextRequest) {
  try {
    const { text, sourceLanguage, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    const srcLang = LANGUAGE_CODES[sourceLanguage?.toLowerCase()] || 'eng_Latn';
    const tgtLang = LANGUAGE_CODES[targetLanguage?.toLowerCase()];

    if (!tgtLang) {
      return NextResponse.json(
        { error: `Unsupported target language: ${targetLanguage}. Supported: ${Object.keys(LANGUAGE_CODES).join(', ')}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${NLLB_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_lang: srcLang,
        target_lang: tgtLang,
        max_length: 512,
        num_beams: 4
      })
    });

    if (!response.ok) {
      throw new Error(`NLLB API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      translation: data.translation || data.translated_text,
      sourceLanguage: sourceLanguage || 'english',
      targetLanguage,
      model: 'NLLB-200 (600M)'
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    supportedLanguages: Object.keys(LANGUAGE_CODES),
    model: 'facebook/nllb-200-distilled-600M'
  });
}
