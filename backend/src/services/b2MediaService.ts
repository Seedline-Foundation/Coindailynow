/**
 * Media upload — B2 today; swap to AWS S3 when buckets are provisioned (set AWS_S3_BUCKET).
 * AI-1-2: CDN integration deferred until AWS credentials are added.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

interface B2Auth {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
}

async function b2Authorize(): Promise<B2Auth> {
  const keyId = process.env.B2_KEY_ID || process.env.BACKBLAZE_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_APPLICATION_KEY;
  if (!keyId || !appKey) {
    throw new Error('B2 credentials not configured');
  }

  const credentials = Buffer.from(`${keyId}:${appKey}`).toString('base64');
  const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`B2 authorize failed: ${res.status}`);
  const data = (await res.json()) as B2Auth & { apiUrl: string };
  return data;
}

export async function uploadBufferToB2(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const bucketId = process.env.B2_BUCKET_ID || process.env.BACKBLAZE_BUCKET_ID;
  const bucketName = process.env.B2_BUCKET_NAME || process.env.BACKBLAZE_BUCKET_NAME;
  if (!bucketId || !bucketName) {
    throw new Error('B2_BUCKET_ID and B2_BUCKET_NAME required');
  }

  const auth = await b2Authorize();

  const uploadUrlRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId }),
  });
  if (!uploadUrlRes.ok) throw new Error('B2 get_upload_url failed');
  const { uploadUrl, authorizationToken: uploadAuth } = (await uploadUrlRes.json()) as {
    uploadUrl: string;
    authorizationToken: string;
  };

  const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: uploadAuth,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
      'Content-Length': String(buffer.length),
    },
    body: new Uint8Array(buffer),
  });
  if (!uploadRes.ok) throw new Error(`B2 upload failed: ${uploadRes.status}`);

  const cdnBase =
    process.env.CDN_BASE_URL ||
    process.env.CLOUDFLARE_CDN_URL ||
    `${auth.downloadUrl}/file/${bucketName}`;

  const publicUrl = `${cdnBase.replace(/\/$/, '')}/${fileName}`;
  logger.info('[B2] Uploaded', { fileName, publicUrl: publicUrl.slice(0, 80) });
  return publicUrl;
}

export async function uploadBase64ImageToCdn(
  dataUrlOrBase64: string,
  keyPrefix = 'ai-images',
): Promise<string> {
  let base64 = dataUrlOrBase64;
  let contentType = 'image/png';
  const match = dataUrlOrBase64.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    contentType = match[1];
    base64 = match[2];
  }

  const buffer = Buffer.from(base64, 'base64');
  const ext = contentType.includes('jpeg') ? 'jpg' : 'png';
  const fileName = `${keyPrefix}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

  try {
    return await uploadBufferToB2(buffer, fileName, contentType);
  } catch (e: any) {
    logger.warn('[B2] Upload failed, returning data URL fallback', { error: e.message });
    return dataUrlOrBase64.startsWith('http') ? dataUrlOrBase64 : dataUrlOrBase64;
  }
}
