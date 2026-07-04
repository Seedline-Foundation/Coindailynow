/**
 * Super-admin storage routes — Contabo bucket management dashboard.
 *
 * Buckets: simages (images), svid (videos), sdocs (documents). Upload,
 * list with filters, per-bucket stats, counted downloads, delete. All
 * endpoints restricted to SUPER_ADMIN | CEO.
 *
 * Mounted at /api/admin/storage.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { uploadAndRegister } from '../../services/mediaStorageService';
import {
  BUCKETS,
  AssetKind,
  kindForMime,
  deleteObject,
  getObjectStream,
  isConfigured,
} from '../../services/storage/contaboStorage';

const router = Router();
router.use(authMiddleware as any);
router.use(requireRole(['SUPER_ADMIN', 'CEO']) as any);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB — svid takes raw video files
});

const KINDS: AssetKind[] = ['IMAGE', 'VIDEO', 'DOCUMENT'];

// ─── GET / — list assets ────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { kind, source, q } = req.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const pageSize = Math.min(100, parseInt(String(req.query.pageSize || '50'), 10) || 50);

    const where: any = { status: 'ACTIVE' };
    if (kind && KINDS.includes(kind as AssetKind)) where.kind = kind;
    if (source) where.source = source;
    if (q) {
      where.OR = [
        { filename: { contains: q, mode: 'insensitive' } },
        { key: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, assets] = await Promise.all([
      prisma.storageAsset.count({ where }),
      prisma.storageAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({ success: true, total, page, pageSize, assets });
  } catch (e: any) {
    logger.error('[Storage] List failed', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── GET /stats — per-bucket dashboard numbers ──────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.storageAsset.groupBy({
      by: ['kind'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
      _sum: { sizeBytes: true, downloadCount: true },
    });

    const stats = KINDS.map((kind) => {
      const g = groups.find((x) => x.kind === kind);
      return {
        kind,
        bucket: BUCKETS[kind],
        files: g?._count._all ?? 0,
        totalBytes: g?._sum.sizeBytes ?? 0,
        downloads: g?._sum.downloadCount ?? 0,
      };
    });

    res.json({ success: true, configured: isConfigured(), stats });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── POST /upload — multipart upload to the right bucket ────────────────────
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!isConfigured()) {
      res.status(503).json({ success: false, error: 'Contabo storage not configured (CONTABO_ACCESS_KEY / CONTABO_SECRET_KEY)' });
      return;
    }
    const file = (req as any).file as { buffer: Buffer; originalname: string; mimetype: string } | undefined;
    if (!file) {
      res.status(400).json({ success: false, error: 'file field required (multipart/form-data)' });
      return;
    }

    const requestedKind = String(req.body.kind || '').toUpperCase();
    const kind: AssetKind = KINDS.includes(requestedKind as AssetKind)
      ? (requestedKind as AssetKind)
      : kindForMime(file.mimetype);

    const prefixByKind: Record<AssetKind, string> = {
      IMAGE: 'admin-uploads/images',
      VIDEO: 'admin-uploads/videos',
      DOCUMENT: 'admin-uploads/docs',
    };

    const asset = await uploadAndRegister(file.buffer, {
      contentType: file.mimetype,
      prefix: req.body.prefix || prefixByKind[kind],
      filename: file.originalname,
      kind,
      source: 'SUPER_ADMIN_UPLOAD',
      uploadedById: (req as any).user?.id,
    });

    res.json({ success: true, asset });
  } catch (e: any) {
    logger.error('[Storage] Upload failed', { error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── GET /:id/download — stream + count ─────────────────────────────────────
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const asset = await prisma.storageAsset.findUnique({ where: { id: req.params.id } });
    if (!asset || asset.status !== 'ACTIVE') {
      res.status(404).json({ success: false, error: 'Asset not found' });
      return;
    }

    const { body, contentType, contentLength } = await getObjectStream(
      asset.kind as AssetKind,
      asset.key,
    );

    prisma.storageAsset
      .update({ where: { id: asset.id }, data: { downloadCount: { increment: 1 } } })
      .catch(() => undefined);

    res.setHeader('Content-Type', contentType || asset.mimeType);
    if (contentLength) res.setHeader('Content-Length', String(contentLength));
    res.setHeader('Content-Disposition', `attachment; filename="${asset.filename.replace(/"/g, '')}"`);
    body.pipe(res);
  } catch (e: any) {
    logger.error('[Storage] Download failed', { id: req.params.id, error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── GET /files/:key — proxy for private document URLs ─────────────────────
router.get('/files/*', async (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent((req.params as any)[0] || '');
    if (!key) {
      res.status(400).json({ success: false, error: 'key required' });
      return;
    }
    const { body, contentType, contentLength } = await getObjectStream('DOCUMENT', key);
    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    if (contentLength) res.setHeader('Content-Length', String(contentLength));
    body.pipe(res);
  } catch (e: any) {
    res.status(404).json({ success: false, error: 'Not found' });
  }
});

// ─── DELETE /:id — remove from bucket, keep tombstone row ───────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await prisma.storageAsset.findUnique({ where: { id: req.params.id } });
    if (!asset || asset.status !== 'ACTIVE') {
      res.status(404).json({ success: false, error: 'Asset not found' });
      return;
    }

    await deleteObject(asset.kind as AssetKind, asset.key);
    await prisma.storageAsset.update({
      where: { id: asset.id },
      data: { status: 'DELETED' },
    });

    res.json({ success: true });
  } catch (e: any) {
    logger.error('[Storage] Delete failed', { id: req.params.id, error: e.message });
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
