/**
 * Contabo Object Storage service (S3-compatible).
 *
 * Three buckets, routed by asset kind:
 *   IMAGE    -> simages   (public-read objects, served via CDN)
 *   VIDEO    -> svid      (public-read objects, served via CDN)
 *   DOCUMENT -> sdocs     (private; downloads proxied through the backend)
 *
 * Env:
 *   CONTABO_S3_ENDPOINT   e.g. https://eu2.contabostorage.com
 *   CONTABO_S3_REGION     default eu2
 *   CONTABO_ACCESS_KEY    S3 access key (Contabo panel > Object Storage > Security)
 *   CONTABO_SECRET_KEY    S3 secret key
 *   CONTABO_TENANT_ID     tenant id used in Contabo public URLs
 *                         (https://eu2.contabostorage.com/<tenantId>:<bucket>/<key>)
 *   CONTABO_BUCKET_IMAGES / CONTABO_BUCKET_DOCS / CONTABO_BUCKET_VIDEOS
 *   CONTABO_PUBLIC_READ   'false' to stop setting public-read ACLs (default true)
 *   CDN_BASE_URL          optional CDN host mapped onto the images bucket
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { logger } from '../../utils/logger';

export type AssetKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

const ENDPOINT = (process.env.CONTABO_S3_ENDPOINT || 'https://eu2.contabostorage.com').replace(/\/$/, '');
const REGION = process.env.CONTABO_S3_REGION || 'eu2';
const TENANT_ID = process.env.CONTABO_TENANT_ID || '';
const PUBLIC_READ = process.env.CONTABO_PUBLIC_READ !== 'false';

export const BUCKETS: Record<AssetKind, string> = {
  IMAGE: process.env.CONTABO_BUCKET_IMAGES || 'simages',
  VIDEO: process.env.CONTABO_BUCKET_VIDEOS || 'svid',
  DOCUMENT: process.env.CONTABO_BUCKET_DOCS || 'sdocs',
};

/** Documents are never public regardless of CONTABO_PUBLIC_READ. */
const KIND_IS_PUBLIC: Record<AssetKind, boolean> = {
  IMAGE: PUBLIC_READ,
  VIDEO: PUBLIC_READ,
  DOCUMENT: false,
};

let _client: S3Client | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.CONTABO_ACCESS_KEY && process.env.CONTABO_SECRET_KEY);
}

function getClient(): S3Client {
  if (_client) return _client;
  if (!isConfigured()) {
    throw new Error('Contabo storage not configured (CONTABO_ACCESS_KEY / CONTABO_SECRET_KEY missing)');
  }
  _client = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
      accessKeyId: process.env.CONTABO_ACCESS_KEY as string,
      secretAccessKey: process.env.CONTABO_SECRET_KEY as string,
    },
    forcePathStyle: true,
  });
  return _client;
}

export function kindForMime(mime: string): AssetKind {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('video/')) return 'VIDEO';
  return 'DOCUMENT';
}

/**
 * Public URL for an object. Images prefer CDN_BASE_URL when set; otherwise the
 * Contabo public-share form (requires CONTABO_TENANT_ID + public sharing
 * enabled on the bucket). Documents get a backend proxy path instead.
 */
export function publicUrl(kind: AssetKind, key: string): string {
  if (kind === 'DOCUMENT') {
    const base = (process.env.BACKEND_PUBLIC_URL || 'http://localhost:4000').replace(/\/$/, '');
    return `${base}/api/admin/storage/files/${encodeURIComponent(key)}`;
  }
  const cdn = process.env.CDN_BASE_URL || process.env.CLOUDFLARE_CDN_URL;
  if (kind === 'IMAGE' && cdn) return `${cdn.replace(/\/$/, '')}/${key}`;
  const bucket = BUCKETS[kind];
  return TENANT_ID
    ? `${ENDPOINT}/${TENANT_ID}:${bucket}/${key}`
    : `${ENDPOINT}/${bucket}/${key}`;
}

export interface StoredObject {
  bucket: string;
  key: string;
  url: string;
  sizeBytes: number;
  contentType: string;
  kind: AssetKind;
}

export async function uploadBuffer(
  buffer: Buffer,
  key: string,
  contentType: string,
  kind?: AssetKind,
): Promise<StoredObject> {
  const resolvedKind = kind ?? kindForMime(contentType);
  const bucket = BUCKETS[resolvedKind];

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...(KIND_IS_PUBLIC[resolvedKind] ? { ACL: 'public-read' } : {}),
    }),
  );

  const url = publicUrl(resolvedKind, key);
  logger.info('[ContaboStorage] Uploaded', { bucket, key, bytes: buffer.length });
  return { bucket, key, url, sizeBytes: buffer.length, contentType, kind: resolvedKind };
}

export async function deleteObject(kind: AssetKind, key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKETS[kind], Key: key }));
  logger.info('[ContaboStorage] Deleted', { bucket: BUCKETS[kind], key });
}

export async function objectExists(kind: AssetKind, key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: BUCKETS[kind], Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Stream an object (used to proxy private documents through the backend). */
export async function getObjectStream(
  kind: AssetKind,
  key: string,
): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: BUCKETS[kind], Key: key }),
  );
  return {
    body: res.Body as Readable,
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}
