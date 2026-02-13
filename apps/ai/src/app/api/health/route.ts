/**
 * Health Check API Route
 * Returns status of all AI services
 */

import { NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const DEEPSEEK_URL = process.env.DEEPSEEK_API_URL || 'http://localhost:11434';
const NLLB_URL = process.env.NLLB_API_ENDPOINT || 'http://localhost:8080';
const SDXL_URL = process.env.SDXL_API_ENDPOINT || 'http://localhost:7860';

async function checkService(url: string, name: string): Promise<{ name: string; status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      method: 'GET'
    });
    clearTimeout(timeout);
    
    const latency = Date.now() - start;
    return { 
      name, 
      status: response.ok ? 'healthy' : 'unhealthy',
      latency
    };
  } catch (error) {
    return { 
      name, 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkService(`${OLLAMA_URL}/api/tags`, 'Ollama (Llama 3.1)'),
    checkService(`${DEEPSEEK_URL}/api/tags`, 'DeepSeek R1'),
    checkService(`${NLLB_URL}/health`, 'NLLB-200 Translation'),
    checkService(`${SDXL_URL}/sdapi/v1/options`, 'SDXL Image Gen'),
  ]);

  const allHealthy = checks.every(c => c.status === 'healthy');

  return NextResponse.json({
    status: allHealthy ? 'operational' : 'degraded',
    timestamp: new Date().toISOString(),
    services: checks,
    environment: {
      ollama: OLLAMA_URL,
      deepseek: DEEPSEEK_URL,
      nllb: NLLB_URL,
      sdxl: SDXL_URL
    }
  });
}
