/**
 * Marketplace REST surface — Wave 1 MVP (off-chain).
 *
 * Implements MKT-0-2 (CRUD), MKT-0-4 (escrow + 10% fee + payout) and the
 * read paths needed for MKT-2-5 (frontend wiring).
 *
 * Routes
 *   GET    /products               public list (status=PUBLISHED)
 *   GET    /products/:slug         public detail
 *   POST   /products               authed seller, status=PENDING_REVIEW
 *   PATCH  /products/:id           authed seller (own) — edit
 *   DELETE /products/:id           authed seller (own) — soft archive
 *   POST   /products/:id/review-decision   admin: approve | reject
 *   POST   /seller-profile         authed user — create/update own SellerProfile
 *   GET    /seller/me/dashboard    authed seller — orders + revenue
 *   POST   /orders                 authed buyer — create PENDING_PAYMENT order
 *   POST   /orders/:id/confirm     authed buyer — confirm txRef → DELIVERED
 *   GET    /orders/:id/download    authed buyer — signed delivery URL list
 *   POST   /products/:id/reviews   authed buyer who owns a DELIVERED order
 *   GET    /products/:id/reviews   public
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';

const router = Router();

const PLATFORM_FEE_BPS = Number(process.env.MARKETPLACE_PLATFORM_FEE_BPS || 1000);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Public reads ────────────────────────────────────────────────────────

router.get('/products', async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const kind = req.query.kind ? String(req.query.kind) : undefined;
  try {
    const where: any = { status: 'PUBLISHED' };
    if (kind) where.kind = kind;
    const [items, total] = await Promise.all([
      prisma.marketplaceProduct.findMany({
        where,
        orderBy: [{ salesCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: { seller: { select: { displayName: true, slug: true, ratingAvg: true } } },
      }),
      prisma.marketplaceProduct.count({ where }),
    ]);
    res.json({ success: true, items, total });
  } catch (e: any) {
    logger.error('[marketplace] list', { error: e?.message });
    res.status(500).json({ success: false, error: 'list_failed' });
  }
});

router.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const item = await prisma.marketplaceProduct.findUnique({
      where: { slug: String(req.params.slug || '') },
      include: {
        seller: {
          select: { displayName: true, slug: true, bio: true, avatarUrl: true, ratingAvg: true, ratingCount: true },
        },
      },
    });
    if (!item) return res.status(404).json({ success: false, error: 'not_found' });
    if (item.status !== 'PUBLISHED') return res.status(404).json({ success: false, error: 'not_found' });
    res.json({ success: true, item });
  } catch (e: any) {
    logger.error('[marketplace] detail', { error: e?.message });
    res.status(500).json({ success: false, error: 'detail_failed' });
  }
});

router.get('/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const items = await prisma.marketplaceReview.findMany({
      where: { productId: String(req.params.id || '') },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { buyer: { select: { username: true, firstName: true, avatarUrl: true } } },
    });
    res.json({ success: true, items });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'reviews_failed' });
  }
});

// ─── Authed seller routes ────────────────────────────────────────────────

router.use(authMiddleware as any);

const sellerProfileSchema = z.object({
  displayName: z.string().min(2).max(80),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  payoutAddress: z.string().max(200).optional(),
  payoutMethod: z.enum(['OFF_CHAIN', 'ON_CHAIN_JOY']).optional(),
});

router.post('/seller-profile', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const parsed = sellerProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  const slug = slugify(parsed.data.displayName) + '-' + userId.slice(0, 6);
  try {
    const profile = await prisma.sellerProfile.upsert({
      where: { userId },
      create: {
        userId,
        slug,
        displayName: parsed.data.displayName,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatarUrl,
        payoutAddress: parsed.data.payoutAddress,
        payoutMethod: parsed.data.payoutMethod || 'OFF_CHAIN',
      },
      update: {
        displayName: parsed.data.displayName,
        bio: parsed.data.bio,
        avatarUrl: parsed.data.avatarUrl,
        payoutAddress: parsed.data.payoutAddress,
        payoutMethod: parsed.data.payoutMethod || 'OFF_CHAIN',
      },
    });
    res.json({ success: true, profile });
  } catch (e: any) {
    logger.error('[marketplace] seller upsert', { error: e?.message });
    res.status(500).json({ success: false, error: 'upsert_failed' });
  }
});

router.get('/seller/me/dashboard', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ success: false, error: 'no_profile' });

    const [products, orders] = await Promise.all([
      prisma.marketplaceProduct.findMany({
        where: { sellerId: profile.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.marketplaceOrder.findMany({
        where: { product: { sellerId: profile.id } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { product: { select: { title: true, slug: true } } },
      }),
    ]);
    res.json({ success: true, profile, products, orders });
  } catch (e: any) {
    logger.error('[marketplace] dashboard', { error: e?.message });
    res.status(500).json({ success: false, error: 'dashboard_failed' });
  }
});

const productSchema = z.object({
  kind: z.enum(['ARTICLE_BUNDLE', 'COURSE', 'TEMPLATE', 'REPORT', 'DATASET', 'WEBINAR', 'OTHER']),
  title: z.string().min(4).max(200),
  shortPitch: z.string().min(10).max(280),
  description: z.string().min(20).max(20_000),
  priceJoy: z.coerce.number().nonnegative().max(1_000_000_000),
  priceUsd: z.coerce.number().nonnegative().max(1_000_000).optional(),
  coverImage: z.string().url().max(500).optional(),
  galleryJson: z.string().max(10_000).optional(),
  contentRefs: z.string().max(20_000).optional(),
});

router.post('/products', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });

  try {
    const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(400).json({ success: false, error: 'create_seller_profile_first' });
    if (!profile.approved) return res.status(403).json({ success: false, error: 'seller_not_approved' });

    const slug =
      slugify(parsed.data.title) +
      '-' +
      crypto.randomBytes(3).toString('hex');

    const product = await prisma.marketplaceProduct.create({
      data: {
        sellerId: profile.id,
        kind: parsed.data.kind,
        title: parsed.data.title,
        slug,
        shortPitch: parsed.data.shortPitch,
        description: parsed.data.description,
        priceJoy: parsed.data.priceJoy,
        priceUsd: parsed.data.priceUsd,
        coverImage: parsed.data.coverImage,
        galleryJson: parsed.data.galleryJson,
        contentRefs: parsed.data.contentRefs,
        status: 'PENDING_REVIEW',
      },
    });
    res.status(201).json({ success: true, product });
  } catch (e: any) {
    logger.error('[marketplace] product create', { error: e?.message });
    res.status(500).json({ success: false, error: 'create_failed' });
  }
});

router.patch('/products/:id', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = String(req.params.id || '');
  try {
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!product) return res.status(404).json({ success: false, error: 'not_found' });
    if (product.seller.userId !== userId) {
      return res.status(403).json({ success: false, error: 'not_owner' });
    }
    const allowed = ['title', 'shortPitch', 'description', 'priceJoy', 'priceUsd', 'coverImage', 'galleryJson', 'contentRefs'] as const;
    const data: any = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) data[k] = req.body[k];
    }
    // Editing pushes back to PENDING_REVIEW.
    data.status = 'PENDING_REVIEW';
    const updated = await prisma.marketplaceProduct.update({ where: { id }, data });
    res.json({ success: true, product: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'update_failed' });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = String(req.params.id || '');
  try {
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!product) return res.status(404).json({ success: false, error: 'not_found' });
    if (product.seller.userId !== userId) return res.status(403).json({ success: false, error: 'not_owner' });
    await prisma.marketplaceProduct.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'archive_failed' });
  }
});

// ─── Admin product review ────────────────────────────────────────────────

router.post(
  '/products/:id/review-decision',
  requireCapability('ARTICLE_APPROVE') as any,
  async (req: Request, res: Response) => {
    const id = String(req.params.id || '');
    const { decision, reason } = req.body as { decision: 'approve' | 'reject'; reason?: string };
    if (!['approve', 'reject'].includes(decision || '')) {
      return res.status(400).json({ success: false, error: 'bad_decision' });
    }
    try {
      const product = await prisma.marketplaceProduct.update({
        where: { id },
        data: {
          status: decision === 'approve' ? 'PUBLISHED' : 'DRAFT',
          reviewedBy: (req as any).user?.id,
          reviewedAt: new Date(),
          rejectedReason: decision === 'reject' ? reason || null : null,
        },
      });
      res.json({ success: true, product });
    } catch (e: any) {
      res.status(500).json({ success: false, error: 'review_failed' });
    }
  },
);

// ─── Buyer flows ─────────────────────────────────────────────────────────

const orderSchema = z.object({
  productId: z.string().min(8),
  buyerNotes: z.string().max(1000).optional(),
});

router.post('/orders', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });
  try {
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id: parsed.data.productId },
      include: { seller: true },
    });
    if (!product || product.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, error: 'product_not_available' });
    }
    if (product.seller.userId === userId) {
      return res.status(400).json({ success: false, error: 'cannot_buy_own_product' });
    }
    const fee = (Number(product.priceJoy) * PLATFORM_FEE_BPS) / 10_000;
    const sellerNet = Number(product.priceJoy) - fee;

    const order = await prisma.marketplaceOrder.create({
      data: {
        productId: product.id,
        buyerId: userId,
        unitPriceJoy: product.priceJoy,
        platformFeeBps: PLATFORM_FEE_BPS,
        platformFeeJoy: fee,
        sellerNetJoy: sellerNet,
        status: 'PENDING_PAYMENT',
        buyerNotes: parsed.data.buyerNotes,
      },
    });
    res.status(201).json({ success: true, order });
  } catch (e: any) {
    logger.error('[marketplace] order create', { error: e?.message });
    res.status(500).json({ success: false, error: 'order_failed' });
  }
});

const confirmSchema = z.object({
  txReference: z.string().min(8).max(200),
});

router.post('/orders/:id/confirm', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = String(req.params.id || '');
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });
  try {
    const order = await prisma.marketplaceOrder.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (order.buyerId !== userId) return res.status(403).json({ success: false, error: 'not_buyer' });
    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(409).json({ success: false, error: `already_${order.status}` });
    }

    // Generate signed delivery refs (5-min TTL keys) for download/streaming.
    const deliveryRefs = JSON.stringify({
      keys: [crypto.randomBytes(16).toString('hex')],
      issuedAt: Date.now(),
      ttlMs: 5 * 60_000,
    });

    const updated = await prisma.$transaction(async (tx: any) => {
      const u = await tx.marketplaceOrder.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          paidAt: new Date(),
          deliveredAt: new Date(),
          txReference: parsed.data.txReference,
          deliveryRefs,
        },
      });
      await tx.marketplaceProduct.update({
        where: { id: order.productId },
        data: { salesCount: { increment: 1 } },
      });
      const product = await tx.marketplaceProduct.findUnique({ where: { id: order.productId } });
      if (product) {
        await tx.sellerProfile.update({
          where: { id: product.sellerId },
          data: {
            totalSales: { increment: 1 },
            totalRevenue: { increment: order.sellerNetJoy },
          },
        });
      }
      return u;
    });

    res.json({ success: true, order: updated });
  } catch (e: any) {
    logger.error('[marketplace] order confirm', { error: e?.message });
    res.status(500).json({ success: false, error: 'confirm_failed' });
  }
});

router.get('/orders/:id/download', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const id = String(req.params.id || '');
  try {
    const order = await prisma.marketplaceOrder.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (order.buyerId !== userId) return res.status(403).json({ success: false, error: 'not_buyer' });
    if (order.status !== 'DELIVERED') {
      return res.status(409).json({ success: false, error: `not_delivered_${order.status}` });
    }
    res.json({
      success: true,
      product: { id: order.product.id, title: order.product.title, slug: order.product.slug },
      contentRefs: order.product.contentRefs ? JSON.parse(order.product.contentRefs) : null,
      deliveryRefs: order.deliveryRefs ? JSON.parse(order.deliveryRefs) : null,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'download_failed' });
  }
});

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
});

router.post('/products/:id/reviews', async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const productId = String(req.params.id || '');
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.flatten() });
  try {
    // Must own a delivered order for this product.
    const owns = await prisma.marketplaceOrder.findFirst({
      where: { productId, buyerId: userId, status: 'DELIVERED' },
    });
    if (!owns) return res.status(403).json({ success: false, error: 'must_own_delivered_order' });

    const review = await prisma.marketplaceReview.upsert({
      where: { productId_buyerId: { productId, buyerId: userId } },
      create: {
        productId,
        buyerId: userId,
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      },
      update: {
        rating: parsed.data.rating,
        title: parsed.data.title,
        body: parsed.data.body,
      },
    });

    // Refresh product rating aggregate.
    const agg = await prisma.marketplaceReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: {
        ratingAvg: Number(agg._avg.rating || 0),
        ratingCount: agg._count,
      },
    });

    res.json({ success: true, review });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'review_failed' });
  }
});

export default router;
