/**
 * Sync frontend /public image assets into the Contabo simages bucket.
 *
 * Mirrors frontend/public/images and frontend/public/icons (plus og-image.*)
 * under the `public/` key prefix and registers each file as a StorageAsset
 * (source PUBLIC_SYNC) so they show up in the super-admin storage dashboard.
 *
 * Files stay in the repo — sw.js, manifest.json, robots.txt, and favicons
 * must be served same-origin, and Next.js still serves /public locally. This
 * gives you a CDN-hosted copy of every static image for reuse.
 *
 * Usage (from backend/):  npx ts-node scripts/sync-public-assets.ts
 * Requires CONTABO_ACCESS_KEY / CONTABO_SECRET_KEY in the env.
 */

import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { uploadBuffer, isConfigured } from '../src/services/storage/contaboStorage';

const FRONTEND_PUBLIC = path.resolve(__dirname, '../../frontend/public');

const SYNC_ROOTS = ['images', 'icons'];
const SYNC_FILES = ['og-image.png', 'og-image.svg', 'favicon.ico'];

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  if (!isConfigured()) {
    console.error('CONTABO_ACCESS_KEY / CONTABO_SECRET_KEY not set — aborting.');
    process.exit(1);
  }

  const files: string[] = [];
  for (const root of SYNC_ROOTS) {
    const dir = path.join(FRONTEND_PUBLIC, root);
    if (fs.existsSync(dir)) files.push(...walk(dir));
  }
  for (const f of SYNC_FILES) {
    const full = path.join(FRONTEND_PUBLIC, f);
    if (fs.existsSync(full)) files.push(full);
  }

  let uploaded = 0;
  let skipped = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME[ext];
    if (!contentType) {
      skipped++;
      continue;
    }

    const rel = path.relative(FRONTEND_PUBLIC, file).split(path.sep).join('/');
    const key = `public/${rel}`;

    const existing = await prisma.storageAsset.findFirst({
      where: { key, status: 'ACTIVE' },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const buffer = fs.readFileSync(file);
    const stored = await uploadBuffer(buffer, key, contentType, 'IMAGE');

    await prisma.storageAsset.upsert({
      where: { bucket_key: { bucket: stored.bucket, key: stored.key } },
      create: {
        bucket: stored.bucket,
        key: stored.key,
        url: stored.url,
        filename: path.basename(file),
        mimeType: contentType,
        sizeBytes: buffer.length,
        kind: 'IMAGE',
        source: 'PUBLIC_SYNC',
        status: 'ACTIVE',
      },
      update: { url: stored.url, sizeBytes: buffer.length, status: 'ACTIVE' },
    });

    uploaded++;
    console.log(`  ↑ ${key} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nDone. Uploaded ${uploaded}, skipped ${skipped} (already synced or non-image).`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
