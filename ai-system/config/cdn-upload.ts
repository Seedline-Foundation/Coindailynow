/**
 * CDN Upload Utility — Backblaze B2 via S3-compatible API + Cloudflare CDN
 *
 * Env vars:
 *   B2_APPLICATION_KEY_ID  – S3-compatible key ID
 *   B2_APPLICATION_KEY     – S3-compatible application key
 *   B2_BUCKET_NAME         – target bucket name
 *   B2_ENDPOINT            – S3-compatible endpoint (e.g. https://s3.us-west-004.backblazeb2.com)
 *   CDN_BASE_URL           – public CDN base (default: https://cdn.coindaily.online)
 *   LOCAL_UPLOAD_URL       – base URL returned for local fallback files
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CDN_BASE_URL = (
  process.env.CDN_BASE_URL ||
  process.env.CLOUDFLARE_CDN_URL ||
  'https://cdn.coindaily.online'
).replace(/\/$/, '');

let _s3: S3Client | null = null;

function getS3Client(): S3Client | null {
  if (_s3) return _s3;

  const keyId = process.env.B2_APPLICATION_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  const endpoint = process.env.B2_ENDPOINT;

  if (!keyId || !appKey || !endpoint) return null;

  _s3 = new S3Client({
    endpoint,
    region: process.env.B2_REGION || 'us-west-004',
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
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
 * Upload an image to CDN (Backblaze B2 via S3-compatible API → Cloudflare).
 *
 * Falls back to writing into a local `uploads/` directory when B2 credentials
 * are not configured.
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
  const bucket = process.env.B2_BUCKET_NAME;

  if (client && bucket) {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return `${CDN_BASE_URL}/${key}`;
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
