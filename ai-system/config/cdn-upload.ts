/**
 * CDN Upload Utility — Contabo Object Storage (S3-compatible) + Cloudflare CDN
 *
 * Env vars:
 *   CONTABO_S3_ENDPOINT    – S3 endpoint (default https://eu2.contabostorage.com)
 *   CONTABO_S3_REGION      – region (default eu2)
 *   CONTABO_ACCESS_KEY     – S3 access key
 *   CONTABO_SECRET_KEY     – S3 secret key
 *   CONTABO_BUCKET_IMAGES  – images bucket (default simages)
 *   CONTABO_TENANT_ID      – tenant id for Contabo public URLs
 *   CDN_BASE_URL           – public CDN base (default: https://cdn.sygn.live)
 *   LOCAL_UPLOAD_URL       – base URL returned for local fallback files
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ENDPOINT = (process.env.CONTABO_S3_ENDPOINT || 'https://eu2.contabostorage.com').replace(/\/$/, '');

const CDN_BASE_URL = (
  process.env.CDN_BASE_URL ||
  process.env.CLOUDFLARE_CDN_URL ||
  'https://cdn.sygn.live'
).replace(/\/$/, '');

let _s3: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (_s3) return _s3;

  const keyId = process.env.CONTABO_ACCESS_KEY;
  const secret = process.env.CONTABO_SECRET_KEY;

  if (!keyId || !secret) return null;

  _s3 = new S3Client({
    endpoint: ENDPOINT,
    region: process.env.CONTABO_S3_REGION || 'eu2',
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: secret,
    },
    forcePathStyle: true,
  });

  return _s3;
}

function uniqueKey(prefix: string, contentType: string): string {
  const ts = Date.now();
  const rand = crypto.randomBytes(6).toString('hex');
  const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  return `${prefix}/${ts}-${rand}.${ext}`;
}

/**
 * Upload an image to the Contabo images bucket (public-read) and return its
 * CDN URL. Falls back to writing into a local `uploads/` directory when
 * credentials are not configured.
 *
 * @param imageData - Raw image bytes or a base64-encoded string (data-URL prefixes are stripped automatically)
 * @param filename  - Desired filename (used only for key prefix / extension hints)
 * @param contentType - MIME type, e.g. `image/png`
 * @returns Public CDN URL or local fallback URL
 */
export async function uploadToCDN(
  imageData: Buffer | string,
  filename: string,
  contentType: string,
): Promise<string> {
  let buffer: Buffer;

  if (typeof imageData === 'string') {
    const match = imageData.match(/^data:[^;]+;base64,(.+)$/);
    buffer = Buffer.from(match ? match[1] : imageData, 'base64');
  } else {
    buffer = imageData;
  }

  const prefix = path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, '_');
  const key = uniqueKey(`ai-images/${prefix}`, contentType);

  const client = getS3Client();
  const bucket = process.env.CONTABO_BUCKET_IMAGES || 'simages';

  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );
    if (process.env.CDN_BASE_URL || process.env.CLOUDFLARE_CDN_URL) {
      return `${CDN_BASE_URL}/${key}`;
    }
    const tenant = process.env.CONTABO_TENANT_ID;
    return tenant ? `${ENDPOINT}/${tenant}:${bucket}/${key}` : `${ENDPOINT}/${bucket}/${key}`;
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'ai-images');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const localName = path.basename(key);
  const localPath = path.join(uploadsDir, localName);
  fs.writeFileSync(localPath, buffer);

  const localBase = (process.env.LOCAL_UPLOAD_URL || 'http://localhost:4000/uploads').replace(
    /\/$/,
    '',
  );
  return `${localBase}/ai-images/${localName}`;
}
