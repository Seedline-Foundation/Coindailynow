import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/ai-status - AI system health check
 * Pings the AI endpoints to check if they're online
 */
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const aiUrl = process.env.NEXT_PUBLIC_AI_URL || 'https://ai.coindaily.online';
  const services = [
    { name: 'Ollama3 (Content)', endpoint: `${aiUrl}/api/tags`, key: 'ollama' },
    { name: 'Image Generator', endpoint: `${aiUrl}/api/generate-image`, key: 'image' },
    { name: 'Moderation AI', endpoint: `${aiUrl}/api/moderate`, key: 'moderation' },
    { name: 'Translation Agent', endpoint: `${aiUrl}/api/translate`, key: 'translation' },
  ];

  const results = await Promise.all(
    services.map(async (svc) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(svc.endpoint, {
          method: 'HEAD',
          signal: controller.signal,
        }).catch(() => null);
        clearTimeout(timeout);

        return {
          name: svc.name,
          key: svc.key,
          status: res && res.ok ? 'online' : res ? 'degraded' : 'offline',
          endpoint: new URL(svc.endpoint).hostname,
        };
      } catch {
        return {
          name: svc.name,
          key: svc.key,
          status: 'offline' as const,
          endpoint: aiUrl.replace('https://', ''),
        };
      }
    })
  );

  return NextResponse.json({ services: results });
}
