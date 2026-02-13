/**
 * Image Generation API Route
 * Uses SDXL via Automatic1111 WebUI API
 */

import { NextRequest, NextResponse } from 'next/server';

const SDXL_URL = process.env.SDXL_API_ENDPOINT || 'http://localhost:7860';

export async function POST(request: NextRequest) {
  try {
    const { prompt, negativePrompt, width, height } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Build crypto/Africa-focused negative prompt
    const defaultNegative = 'blurry, low quality, distorted, watermark, text, logo, cartoon, anime, illustration, 3d render';
    const fullNegative = negativePrompt ? `${negativePrompt}, ${defaultNegative}` : defaultNegative;

    const response = await fetch(`${SDXL_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `professional photograph, ${prompt}, high quality, detailed, 8k, photorealistic`,
        negative_prompt: fullNegative,
        width: width || 1024,
        height: height || 1024,
        steps: 30,
        cfg_scale: 7.5,
        sampler_name: 'DPM++ 2M Karras',
        seed: -1,
        enable_hr: false,
      })
    });

    if (!response.ok) {
      throw new Error(`SDXL API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      images: data.images, // Base64 encoded images
      parameters: data.parameters,
      model: 'SDXL 1.0'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
