-- =========================================================================================
-- SUPABASE RLS SECURITY FIX - Run this in Supabase SQL Editor
-- =========================================================================================
-- This script:
-- 1. Enables RLS on ALL tables in the public schema
-- 2. Creates service_role policies so your backend (using service_role key) keeps working
-- 3. Adds specific policies for public content and user-owned data
-- =========================================================================================

-- STEP 1: Enable RLS on ALL tables and grant service_role full access
DO $$ 
DECLARE 
    tbl RECORD; 
BEGIN 
    FOR tbl IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE '_prisma%'
        AND tablename NOT LIKE 'pg_%'
    ) LOOP 
        -- Enable RLS on the table
        EXECUTE format('ALTER TABLE "public".%I ENABLE ROW LEVEL SECURITY', tbl.tablename); 
        
        -- Force RLS for table owners too (important for Supabase)
        EXECUTE format('ALTER TABLE "public".%I FORCE ROW LEVEL SECURITY', tbl.tablename);
        
        -- Drop existing service_role policy if exists, then create new one
        EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON "public".%I', tbl.tablename);
        EXECUTE format('CREATE POLICY "service_role_all" ON "public".%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl.tablename);
        
        RAISE NOTICE 'Secured table: %', tbl.tablename;
    END LOOP; 
END $$;

-- =========================================================================================
-- STEP 2: PUBLIC CONTENT POLICIES (Read-Only for anonymous/authenticated users)
-- =========================================================================================

-- Articles: Only published articles are publicly readable
DROP POLICY IF EXISTS "public_read_articles" ON "Article";
CREATE POLICY "public_read_articles" ON "Article" 
    FOR SELECT TO anon, authenticated 
    USING (status = 'PUBLISHED');

-- Categories: All categories are publicly readable
DROP POLICY IF EXISTS "public_read_categories" ON "Category";
CREATE POLICY "public_read_categories" ON "Category" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- Tags: All tags are publicly readable
DROP POLICY IF EXISTS "public_read_tags" ON "Tag";
CREATE POLICY "public_read_tags" ON "Tag" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- Marquee: Only active marquees are publicly readable
DROP POLICY IF EXISTS "public_read_marquees" ON "Marquee";
CREATE POLICY "public_read_marquees" ON "Marquee" 
    FOR SELECT TO anon, authenticated 
    USING ("isActive" = true);

-- MarqueeItem: Publicly readable (tied to Marquee display)
DROP POLICY IF EXISTS "public_read_marquee_items" ON "MarqueeItem";
CREATE POLICY "public_read_marquee_items" ON "MarqueeItem" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- MarqueeStyle: Publicly readable
DROP POLICY IF EXISTS "public_read_marquee_styles" ON "MarqueeStyle";
CREATE POLICY "public_read_marquee_styles" ON "MarqueeStyle" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- Token (Crypto tokens): Publicly readable market data
DROP POLICY IF EXISTS "public_read_tokens" ON "Token";
CREATE POLICY "public_read_tokens" ON "Token" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- MarketData: Publicly readable
DROP POLICY IF EXISTS "public_read_market_data" ON "MarketData";
CREATE POLICY "public_read_market_data" ON "MarketData" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- SubscriptionPlan: Publicly readable (for pricing pages)
DROP POLICY IF EXISTS "public_read_subscription_plans" ON "SubscriptionPlan";
CREATE POLICY "public_read_subscription_plans" ON "SubscriptionPlan" 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- =========================================================================================
-- STEP 3: USER-OWNED DATA POLICIES (Users can only access their own data)
-- NOTE: Using (select auth.uid()) instead of auth.uid() for performance optimization
--       This prevents re-evaluation per row (auth_rls_initplan warning fix)
-- =========================================================================================

-- User Profile: Users can read/update their own profile
DROP POLICY IF EXISTS "users_own_profile" ON "User";
CREATE POLICY "users_own_profile" ON "User" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = id)
    WITH CHECK ((select auth.uid())::text = id);

-- Wallet: Users can only access their own wallet
DROP POLICY IF EXISTS "users_own_wallet" ON "Wallet";
CREATE POLICY "users_own_wallet" ON "Wallet" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- WalletTransaction: Users can view transactions for their wallets
DROP POLICY IF EXISTS "users_own_transactions" ON "WalletTransaction";
CREATE POLICY "users_own_transactions" ON "WalletTransaction" 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM "Wallet" 
            WHERE ("Wallet".id = "WalletTransaction"."fromWalletId" OR "Wallet".id = "WalletTransaction"."toWalletId")
            AND "Wallet"."userId" = (select auth.uid())::text
        )
    );

-- UserProfile: Users can only access their own profile
DROP POLICY IF EXISTS "users_own_user_profile" ON "UserProfile";
CREATE POLICY "users_own_user_profile" ON "UserProfile" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- Subscription: Users can only view their own subscription
DROP POLICY IF EXISTS "users_own_subscription" ON "Subscription";
CREATE POLICY "users_own_subscription" ON "Subscription" 
    FOR SELECT TO authenticated 
    USING ((select auth.uid())::text = "userId");

-- UserPreference: Users can manage their own preferences
DROP POLICY IF EXISTS "users_own_preferences" ON "UserPreference";
CREATE POLICY "users_own_preferences" ON "UserPreference" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- UserEngagement: Users can view their own engagement
DROP POLICY IF EXISTS "users_own_engagement" ON "UserEngagement";
CREATE POLICY "users_own_engagement" ON "UserEngagement" 
    FOR SELECT TO authenticated 
    USING ((select auth.uid())::text = "userId");

-- UserFeedback: Users can manage their own feedback
DROP POLICY IF EXISTS "users_own_feedback" ON "UserFeedback";
CREATE POLICY "users_own_feedback" ON "UserFeedback" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- PushSubscription: Users can manage their own push subscriptions
DROP POLICY IF EXISTS "users_own_push_subscription" ON "PushSubscription";
CREATE POLICY "users_own_push_subscription" ON "PushSubscription" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- Vote: Users can manage their own votes
DROP POLICY IF EXISTS "users_own_votes" ON "Vote";
CREATE POLICY "users_own_votes" ON "Vote" 
    FOR ALL TO authenticated 
    USING ((select auth.uid())::text = "userId")
    WITH CHECK ((select auth.uid())::text = "userId");

-- =========================================================================================
-- STEP 4: COMMUNITY CONTENT (Authenticated users can read, owners can modify)
-- =========================================================================================

-- CommunityPost: Anyone authenticated can read, owners can modify
DROP POLICY IF EXISTS "community_posts_read" ON "CommunityPost";
CREATE POLICY "community_posts_read" ON "CommunityPost" 
    FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "community_posts_write" ON "CommunityPost";
CREATE POLICY "community_posts_write" ON "CommunityPost" 
    FOR INSERT TO authenticated 
    WITH CHECK ((select auth.uid())::text = "authorId");

DROP POLICY IF EXISTS "community_posts_update" ON "CommunityPost";
CREATE POLICY "community_posts_update" ON "CommunityPost" 
    FOR UPDATE TO authenticated 
    USING ((select auth.uid())::text = "authorId")
    WITH CHECK ((select auth.uid())::text = "authorId");

-- =========================================================================================
-- STEP 5: FIX DUPLICATE INDEX ON PlatformSettings
-- =========================================================================================
-- PlatformSettings has duplicate indexes: PlatformSettings_id_key and PlatformSettings_pkey
-- Keep the primary key (pkey), drop the unique constraint index
DROP INDEX IF EXISTS "PlatformSettings_id_key";

-- =========================================================================================
-- VERIFICATION: List all tables with RLS status
-- =========================================================================================
-- Run this query separately to verify:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
