/**
 * Media upload facade — Contabo Object Storage (replaces the old Backblaze B2
 * service). Every upload is registered as a StorageAsset row so the
 * super-admin storage dashboard can track state, URLs, and download counts,
 * and so AI-generated media can be found and reused.
 */

import crypto from 'crypto';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import {
  uploadBuffer,
  kindForMime,
  isConfigured,
  AssetKind,
} from './storage/contaboStorage';

export type AssetSource =
  | 'SUPER_ADMIN_UPLOAD'
  | 'AI_SYSTEM'
  | 'IENGINE'
  | 'VENGINE'
  | 'PUBLIC_SYNC'
  | 'APP';

function extFor(contentType: string): string {
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('avif')) return 'avif';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('webm')) return 'webm';
  if (contentType.includes('pdf')) return 'pdf';
  return 'bin';
}

export function sourceForPrefix(prefix: string): AssetSource {
  if (prefix.startsWith('iengine')) return 'IENGINE';
  if (prefix.startsWith('vengine') || prefix.startsWith('video')) return 'VENGINE';
  if (prefix.startsWith('ai-')) return 'AI_SYSTEM';
  return 'APP';
}

export interface UploadedAsset {
  id: string | null;
  url: string;
  bucket: string;
  key: string;
  kind: AssetKind;
  sizeBytes: number;
}

/**
 * Upload a raw buffer and register it. Never throws on the DB write — storage
 * success is what callers depend on.
 */
export async function uploadAndRegister(
  buffer: Buffer,
  opts: {
    contentType: string;
    prefix?: string;
    filename?: string;
    kind?: AssetKind;
    source?: AssetSource;
    uploadedById?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<UploadedAsset> {
  const kind = opts.kind ?? kindForMime(opts.contentType);
  const prefix = (opts.prefix || 'uploads').replace(/^\/+|\/+$/g, '');
  const safeName = (opts.filename || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const key = `${prefix}/${safeName ? `${safeName}-` : ''}${unique}.${extFor(opts.contentType)}`;

  const stored = await uploadBuffer(buffer, key, opts.contentType, kind);

  let id: string | null = null;
  try {
    const row = await prisma.storageAsset.create({
      data: {
        bucket: stored.bucket,
        key: stored.key,
        url: stored.url,
        filename: opts.filename || key.split('/').pop() || key,
        mimeType: opts.contentType,
        sizeBytes: stored.sizeBytes,
        kind,
        source: opts.source ?? sourceForPrefix(prefix),
        status: 'ACTIVE',
        uploadedById: opts.uploadedById ?? null,
        metadata: (opts.metadata as any) ?? undefined,
      },
    });
    id = row.id;
  } catch (e: any) {
    logger.warn('[MediaStorage] Asset registered in bucket but DB record failed', {
      key: stored.key,
      error: e.message,
    });
  }

  return { id, url: stored.url, bucket: stored.bucket, key: stored.key, kind, sizeBytes: stored.sizeBytes };
}

/**
 * Upload a base64 image / data URL. Drop-in replacement for the old
 * b2MediaService.uploadBase64ImageToCdn — same signature, same
 * return-the-input fallback when storage is unavailable so the AI pipeline
 * keeps flowing (callers should treat data-URL returns as "not stored").
 */
export async function uploadBase64ImageToCdn(
  dataUrlOrBase64: string,
  keyPrefix = 'ai-images',
  uploadedById?: string,
): Promise<string> {
  let base64 = dataUrlOrBase64;
  let contentType = 'image/png';
  const match = dataUrlOrBase64.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (match) {
    contentType = match[1];
    base64 = match[2];
  }

  if (!isConfigured()) {
    logger.warn('[MediaStorage] Contabo not configured; returning input unchanged');
    return dataUrlOrBase64;
  }

  try {
    const buffer = Buffer.from(base64, 'base64');
    const asset = await uploadAndRegister(buffer, {
      contentType,
      prefix: keyPrefix,
      kind: 'IMAGE',
      uploadedById,
    });
    return asset.url;
  } catch (e: any) {
    logger.warn('[MediaStorage] Upload failed, returning input unchanged', { error: e.message });
    return dataUrlOrBase64;
  }
}
