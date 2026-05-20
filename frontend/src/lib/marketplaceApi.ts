/**
 * Browser client for the marketplace REST surface.
 * Pairs with backend/src/api/routes/v1Marketplace.routes.ts.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type ProductKind =
  | 'ARTICLE_BUNDLE'
  | 'COURSE'
  | 'TEMPLATE'
  | 'REPORT'
  | 'DATASET'
  | 'WEBINAR'
  | 'OTHER';

export interface MarketplaceProduct {
  id: string;
  slug: string;
  title: string;
  shortPitch: string;
  description: string;
  kind: ProductKind;
  priceJoy: string;
  priceUsd: string | null;
  coverImage: string | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  status: 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT' | 'PAUSED' | 'ARCHIVED';
  seller?: {
    displayName: string;
    slug: string;
    bio?: string;
    avatarUrl?: string;
    ratingAvg: number;
    ratingCount: number;
  };
}

export interface MarketplaceOrder {
  id: string;
  productId: string;
  buyerId: string;
  unitPriceJoy: string;
  platformFeeJoy: string;
  sellerNetJoy: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'DELIVERED' | 'REFUNDED' | 'CANCELLED' | 'DISPUTED';
  txReference: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
  buyerNotes: string | null;
  product?: { title: string; slug: string };
}

interface ListResponse {
  success: boolean;
  items: MarketplaceProduct[];
  total: number;
  error?: string;
}

interface OneResponse<T> {
  success: boolean;
  item?: T;
  error?: string;
}

interface OrderResponse {
  success: boolean;
  order: MarketplaceOrder;
  error?: string;
}

function authHeaders(token?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listProducts(opts: { kind?: ProductKind; limit?: number; offset?: number } = {}): Promise<{
  items: MarketplaceProduct[];
  total: number;
}> {
  const qs = new URLSearchParams();
  if (opts.kind) qs.set('kind', opts.kind);
  if (opts.limit) qs.set('limit', String(opts.limit));
  if (opts.offset) qs.set('offset', String(opts.offset));
  const res = await fetch(`${API}/api/v1/marketplace/products?${qs}`);
  if (!res.ok) throw new Error(`list ${res.status}`);
  const json = (await res.json()) as ListResponse;
  if (!json.success) throw new Error(json.error || 'list_failed');
  return { items: json.items, total: json.total };
}

export async function getProductBySlug(slug: string): Promise<MarketplaceProduct> {
  const res = await fetch(`${API}/api/v1/marketplace/products/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`detail ${res.status}`);
  const json = (await res.json()) as OneResponse<MarketplaceProduct>;
  if (!json.success || !json.item) throw new Error(json.error || 'not_found');
  return json.item;
}

export async function createOrder(
  productId: string,
  token: string,
  buyerNotes?: string,
): Promise<MarketplaceOrder> {
  const res = await fetch(`${API}/api/v1/marketplace/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ productId, buyerNotes }),
  });
  const json = (await res.json()) as OrderResponse;
  if (!res.ok || !json.success) throw new Error(json.error || 'order_failed');
  return json.order;
}

export async function confirmOrder(orderId: string, txReference: string, token: string): Promise<MarketplaceOrder> {
  const res = await fetch(`${API}/api/v1/marketplace/orders/${encodeURIComponent(orderId)}/confirm`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ txReference }),
  });
  const json = (await res.json()) as OrderResponse;
  if (!res.ok || !json.success) throw new Error(json.error || 'confirm_failed');
  return json.order;
}

export async function getDownload(orderId: string, token: string): Promise<{
  product: { id: string; title: string; slug: string };
  contentRefs: any | null;
  deliveryRefs: any | null;
}> {
  const res = await fetch(`${API}/api/v1/marketplace/orders/${encodeURIComponent(orderId)}/download`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const json = await res.json();
  return json;
}

export async function postReview(
  productId: string,
  rating: number,
  token: string,
  payload: { title?: string; body?: string } = {},
) {
  const res = await fetch(`${API}/api/v1/marketplace/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ rating, ...payload }),
  });
  if (!res.ok) throw new Error(`review ${res.status}`);
  return res.json();
}
