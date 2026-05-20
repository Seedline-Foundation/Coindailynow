-- Marketplace (Creator Economy Digital Products) — Wave 1, MKT-0-1.
-- Off-chain MVP. On-chain JOY escrow comes in Wave 2.

CREATE TYPE "MarketplaceProductKind" AS ENUM (
  'ARTICLE_BUNDLE',
  'COURSE',
  'TEMPLATE',
  'REPORT',
  'DATASET',
  'WEBINAR',
  'OTHER'
);

CREATE TYPE "MarketplaceProductStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'PAUSED',
  'ARCHIVED'
);

CREATE TYPE "MarketplaceOrderStatus" AS ENUM (
  'PENDING_PAYMENT',
  'PAID',
  'DELIVERED',
  'REFUNDED',
  'CANCELLED',
  'DISPUTED'
);

CREATE TABLE "marketplace_seller_profiles" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "bio" TEXT,
  "avatarUrl" TEXT,
  "payoutAddress" TEXT,
  "payoutMethod" TEXT DEFAULT 'OFF_CHAIN',
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "approvedBy" TEXT,
  "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL DEFAULT 0,
  "totalRevenue" DECIMAL(20,6) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_seller_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "marketplace_seller_profiles_userId_key"
  ON "marketplace_seller_profiles"("userId");
CREATE UNIQUE INDEX "marketplace_seller_profiles_slug_key"
  ON "marketplace_seller_profiles"("slug");

ALTER TABLE "marketplace_seller_profiles"
  ADD CONSTRAINT "marketplace_seller_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "marketplace_products" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "kind" "MarketplaceProductKind" NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "shortPitch" VARCHAR(280) NOT NULL,
  "description" TEXT NOT NULL,
  "priceJoy" DECIMAL(20,6) NOT NULL,
  "priceUsd" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'JOY',
  "coverImage" TEXT,
  "galleryJson" TEXT,
  "contentRefs" TEXT,
  "status" "MarketplaceProductStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectedReason" TEXT,
  "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ratingCount" INTEGER NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "boostBudget" DECIMAL(20,6) NOT NULL DEFAULT 0,
  "boostSpent" DECIMAL(20,6) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_products_slug_key" ON "marketplace_products"("slug");
CREATE INDEX "marketplace_products_status_idx" ON "marketplace_products"("status");
CREATE INDEX "marketplace_products_sellerId_idx" ON "marketplace_products"("sellerId");
CREATE INDEX "marketplace_products_kind_idx" ON "marketplace_products"("kind");

ALTER TABLE "marketplace_products"
  ADD CONSTRAINT "marketplace_products_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "marketplace_seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "marketplace_orders" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "unitPriceJoy" DECIMAL(20,6) NOT NULL,
  "platformFeeBps" INTEGER NOT NULL DEFAULT 1000,
  "platformFeeJoy" DECIMAL(20,6) NOT NULL,
  "sellerNetJoy" DECIMAL(20,6) NOT NULL,
  "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "txReference" TEXT,
  "paidAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "refundedAt" TIMESTAMP(3),
  "refundReason" TEXT,
  "deliveryRefs" TEXT,
  "buyerNotes" TEXT,
  "sellerNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_orders_txReference_key"
  ON "marketplace_orders"("txReference");
CREATE INDEX "marketplace_orders_buyerId_idx" ON "marketplace_orders"("buyerId");
CREATE INDEX "marketplace_orders_productId_idx" ON "marketplace_orders"("productId");
CREATE INDEX "marketplace_orders_status_idx" ON "marketplace_orders"("status");

ALTER TABLE "marketplace_orders"
  ADD CONSTRAINT "marketplace_orders_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketplace_orders"
  ADD CONSTRAINT "marketplace_orders_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "marketplace_reviews" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "title" VARCHAR(200),
  "body" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_reviews_productId_buyerId_key"
  ON "marketplace_reviews"("productId", "buyerId");
CREATE INDEX "marketplace_reviews_productId_idx" ON "marketplace_reviews"("productId");

ALTER TABLE "marketplace_reviews"
  ADD CONSTRAINT "marketplace_reviews_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_reviews"
  ADD CONSTRAINT "marketplace_reviews_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
