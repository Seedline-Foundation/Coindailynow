/**
 * One-shot: add the ClipsAI deploy checklist to Today TO DO templates.
 * Idempotent — running twice won't create duplicates.
 *
 * Run: npx tsx backend/scripts/add-clipsai-deploy-task.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TASK = {
  id: 'deploy-clipsai-service',
  title: 'Deploy ClipsAI service on Contabo (port 8100)',
  description: [
    'Long-running FastAPI wrapper around the ClipsAI Python library that slices long videos into 30-90s social clips (fed to the video pipeline\'s cutClips step).',
    '',
    'Run on Contabo (ssh root@167.86.99.97):',
    '  1. apt install -y python3.10 python3.10-venv ffmpeg',
    '  2. python3.10 -m venv /opt/sygn-clipsai && source /opt/sygn-clipsai/bin/activate',
    '  3. pip install clipsai fastapi uvicorn[standard] requests boto3',
    '  4. scp ai-services/clipsai-service/main.py root@167.86.99.97:/opt/sygn-clipsai/main.py',
    '  5. pm2 start "bash -c \'source /opt/sygn-clipsai/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8100\'" --name sygn-clipsai && pm2 save',
    '',
    'Verify: curl -s localhost:8100/health should return {"status":"healthy","models_loaded":true}',
    'Local dev: add -L 8100:127.0.0.1:8100 to your SSH tunnel, set CLIPSAI_URL=http://localhost:8100 in backend/.env, restart backend.',
    '',
    'Full guide + Whisper model sizing + troubleshooting: ai-services/clipsai-service/README.md',
  ].join('\n'),
  category: 'infrastructure',
  priority: 'high' as const,
  completed: false,
};

async function main() {
  const KEY = 'dailytasks.templates';
  const row = await prisma.systemConfiguration.findUnique({ where: { key: KEY } });

  let templates: any[] = [];
  if (row?.value) {
    try {
      const parsed = JSON.parse(row.value);
      templates = Array.isArray(parsed) ? parsed : (parsed.templates || parsed.tasks || []);
    } catch {
      console.warn('Existing templates row is malformed JSON; starting fresh.');
    }
  }

  // Dedupe by id
  const existing = templates.findIndex((t: any) => t?.id === TASK.id);
  if (existing >= 0) {
    templates[existing] = { ...templates[existing], ...TASK };
    console.log(`Updated existing task "${TASK.id}"`);
  } else {
    templates.push(TASK);
    console.log(`Added new task "${TASK.id}"`);
  }

  const value = JSON.stringify(templates);

  await prisma.systemConfiguration.upsert({
    where: { key: KEY },
    update: { value, updatedAt: new Date() },
    create: {
      id: 'cfg_dailytasks_templates',
      key: KEY,
      value,
      description: 'Daily task templates - Today TO DO',
      updatedAt: new Date(),
    },
  });

  console.log(`\nTemplates now contains ${templates.length} task(s).`);
  console.log(`Visit /super-admin/today-todo to see it.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
