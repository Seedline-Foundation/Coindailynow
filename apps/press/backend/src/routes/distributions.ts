/**
 * SENDPRESS Backend - Distribution Routes
 * Handles PR distribution orders and payments
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';

const router = Router();

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/press/prs
 * Register a new PR for distribution
 */
router.post('/prs', async (req, res) => {
    try {
        const { publisherId, title, summary, content, url, image, ctaUrl, ctaText } = req.body;
        
        if (!publisherId || !title || !content) {
            return res.status(400).json({ error: 'Publisher ID, title, and content are required' });
        }
        
        // Verify publisher exists
        const { data: publisher } = await supabase
            .from('press_publishers')
            .select('id, status')
            .eq('id', publisherId)
            .single();
            
        if (!publisher) {
            return res.status(404).json({ error: 'Publisher not found' });
        }
        
        if (publisher.status !== 'active') {
            return res.status(403).json({ error: 'Publisher account is not active' });
        }
        
        // Calculate word count
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        
        // Generate canonical hash
        const canonicalHash = ethers.keccak256(ethers.toUtf8Bytes(title + content));
        
        // Create PR
        const { data: pr, error } = await supabase
            .from('press_releases')
            .insert({
                publisher_id: publisherId,
                title,
                summary,
                content,
                url,
                canonical_hash: canonicalHash,
                word_count: wordCount,
                media_meta: { image, ctaUrl, ctaText },
                status: 'pending'
            })
            .select()
            .single();
            
        if (error) {
            console.error('Failed to create PR:', error);
            return res.status(500).json({ error: 'Failed to create PR' });
        }
        
        res.status(201).json(pr);
    } catch (error) {
        console.error('Create PR error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/prs/:id
 * Get PR details
 */
router.get('/prs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: pr, error } = await supabase
            .from('press_releases')
            .select(`
                *,
                publisher:press_publishers(id, company_name)
            `)
            .eq('id', id)
            .single();
            
        if (error || !pr) {
            return res.status(404).json({ error: 'PR not found' });
        }
        
        // Format response for SDK
        const response = {
            id: pr.id,
            title: pr.title,
            summary: pr.summary,
            content: pr.content,
            url: pr.url,
            wordCount: pr.word_count,
            image: pr.media_meta?.image,
            ctaUrl: pr.media_meta?.ctaUrl,
            ctaText: pr.media_meta?.ctaText,
            sourceName: pr.publisher?.company_name || 'SENDPRESS',
            publishedAt: pr.created_at,
            status: pr.status
        };
        
        res.json(response);
    } catch (error) {
        console.error('Get PR error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/press/distributions
 * Create a distribution order (locks credits)
 */
router.post('/distributions', async (req, res) => {
    try {
        const { prId, publisherId, targetSites, targetTiers, budget } = req.body;
        
        if (!prId || !publisherId) {
            return res.status(400).json({ error: 'PR ID and Publisher ID are required' });
        }
        
        // Verify PR exists and belongs to publisher
        const { data: pr } = await supabase
            .from('press_releases')
            .select('id, publisher_id, status')
            .eq('id', prId)
            .single();
            
        if (!pr) {
            return res.status(404).json({ error: 'PR not found' });
        }
        
        if (pr.publisher_id !== publisherId) {
            return res.status(403).json({ error: 'PR does not belong to this publisher' });
        }
        
        // Get target sites (either specific sites or by tier)
        let sites: any[] = [];
        
        if (targetSites && targetSites.length > 0) {
            const { data } = await supabase
                .from('press_sites')
                .select('id, domain, dh_score, tier, wallet_address')
                .in('id', targetSites)
                .eq('status', 'verified');
            sites = data || [];
        } else if (targetTiers && targetTiers.length > 0) {
            const { data } = await supabase
                .from('press_sites')
                .select('id, domain, dh_score, tier, wallet_address')
                .in('tier', targetTiers)
                .eq('status', 'verified')
                .order('dh_score', { ascending: false })
                .limit(100);
            sites = data || [];
        }
        
        if (sites.length === 0) {
            return res.status(400).json({ error: 'No valid target sites found' });
        }
        
        // Calculate cost based on tiers
        const tierPricing: Record<string, number> = {
            bronze: 10,
            silver: 25,
            gold: 75,
            platinum: 200
        };
        
        let totalCost = 0;
        const siteShares: Record<string, number> = {};
        
        for (const site of sites) {
            const price = tierPricing[site.tier] || 10;
            totalCost += price;
            siteShares[site.id] = price;
        }
        
        // Check if publisher has sufficient balance
        const { data: publisher } = await supabase
            .from('press_publishers')
            .select('joy_balance')
            .eq('id', publisherId)
            .single();
            
        if (!publisher || publisher.joy_balance < totalCost) {
            return res.status(400).json({ 
                error: 'Insufficient JOY balance',
                required: totalCost,
                available: publisher?.joy_balance || 0
            });
        }
        
        // Create distribution
        const distributionId = uuidv4();
        const { data: distribution, error } = await supabase
            .from('press_distributions')
            .insert({
                id: distributionId,
                pr_id: prId,
                publisher_id: publisherId,
                target_sites: sites.map(s => s.id),
                target_tiers: targetTiers || [],
                credits_locked: totalCost,
                status: 'pending'
            })
            .select()
            .single();
            
        if (error) {
            console.error('Failed to create distribution:', error);
            return res.status(500).json({ error: 'Failed to create distribution' });
        }
        
        // Update publisher balance (lock credits)
        await supabase
            .from('press_publishers')
            .update({ joy_balance: publisher.joy_balance - totalCost })
            .eq('id', publisherId);
        
        res.status(201).json({
            distributionId: distribution.id,
            status: 'pending',
            creditsLocked: totalCost,
            targetSiteCount: sites.length,
            estimatedCost: totalCost
        });
    } catch (error) {
        console.error('Create distribution error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/distributions/:id
 * Get distribution status and verification records
 */
router.get('/distributions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: distribution, error } = await supabase
            .from('press_distributions')
            .select(`
                *,
                pr:press_releases(id, title),
                verifications:press_verifications(*)
            `)
            .eq('id', id)
            .single();
            
        if (error || !distribution) {
            return res.status(404).json({ error: 'Distribution not found' });
        }
        
        res.json(distribution);
    } catch (error) {
        console.error('Get distribution error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/press/partnerships
 * Register a partnership between sites
 */
router.post('/partnerships', async (req, res) => {
    try {
        const { originSiteId, partnerSiteId, agreementType, terms, notificationEndpoint } = req.body;
        
        if (!originSiteId || !partnerSiteId) {
            return res.status(400).json({ error: 'Both site IDs are required' });
        }
        
        // Verify both sites exist
        const { data: sites } = await supabase
            .from('press_sites')
            .select('id')
            .in('id', [originSiteId, partnerSiteId]);
            
        if (!sites || sites.length !== 2) {
            return res.status(404).json({ error: 'One or both sites not found' });
        }
        
        // Create partnership
        const { data: partnership, error } = await supabase
            .from('press_partnerships')
            .insert({
                origin_site_id: originSiteId,
                partner_site_id: partnerSiteId,
                agreement_type: agreementType || 'paid',
                terms: terms || {},
                notification_endpoint: notificationEndpoint,
                status: 'pending'
            })
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(409).json({ error: 'Partnership already exists' });
            }
            console.error('Failed to create partnership:', error);
            return res.status(500).json({ error: 'Failed to create partnership' });
        }
        
        res.status(201).json(partnership);
    } catch (error) {
        console.error('Create partnership error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/press/metrics
 * Receive batched metrics from SDK
 */
router.post('/metrics', async (req, res) => {
    try {
        const { siteId, metrics, signature } = req.body;
        
        if (!siteId || !metrics || !Array.isArray(metrics)) {
            return res.status(400).json({ error: 'Invalid metrics payload' });
        }
        
        // TODO: Verify signature
        // TODO: Store metrics in analytics table
        
        // For now, just acknowledge
        res.json({ received: metrics.length });
    } catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
