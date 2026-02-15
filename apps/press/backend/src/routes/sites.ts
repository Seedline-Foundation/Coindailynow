/**
 * SENDPRESS Backend - Site Routes
 * Handles site registration, positions, and verification
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

/**
 * POST /api/press/sites
 * Register a new site
 */
router.post('/sites', async (req, res) => {
    try {
        const { domain, walletAddress, ownerEmail, ownerName } = req.body;
        
        if (!domain) {
            return res.status(400).json({ error: 'Domain is required' });
        }
        
        // Normalize domain
        const normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
        
        // Check if domain already exists
        const { data: existing } = await supabase
            .from('press_sites')
            .select('id')
            .eq('domain', normalizedDomain)
            .single();
            
        if (existing) {
            return res.status(409).json({ error: 'Domain already registered' });
        }
        
        // Generate site secret
        const siteSecret = crypto.randomBytes(32).toString('hex');
        
        // Create site
        const { data: site, error } = await supabase
            .from('press_sites')
            .insert({
                domain: normalizedDomain,
                wallet_address: walletAddress,
                owner_email: ownerEmail,
                owner_name: ownerName,
                site_secret: siteSecret,
                status: 'pending'
            })
            .select()
            .single();
            
        if (error) {
            console.error('Failed to create site:', error);
            return res.status(500).json({ error: 'Failed to register site' });
        }
        
        res.status(201).json({
            siteId: site.id,
            siteSecret: siteSecret,
            domain: site.domain,
            status: site.status
        });
    } catch (error) {
        console.error('Site registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/sites/:id
 * Get site details
 */
router.get('/sites/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data: site, error } = await supabase
            .from('press_sites')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error || !site) {
            return res.status(404).json({ error: 'Site not found' });
        }
        
        // Don't expose site secret
        const { site_secret, ...publicData } = site;
        
        res.json(publicData);
    } catch (error) {
        console.error('Get site error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/press/sites/:id/positions
 * Create or update a position on a site
 */
router.post('/sites/:id/positions', async (req, res) => {
    try {
        const { id } = req.params;
        const { selectorOrSlug, displayType, maxWords, mediaTypes, priceJoy } = req.body;
        
        if (!selectorOrSlug) {
            return res.status(400).json({ error: 'Selector or slug is required' });
        }
        
        // Verify site exists and caller has access
        const siteSecret = req.headers['x-site-secret'];
        const { data: site } = await supabase
            .from('press_sites')
            .select('id, site_secret')
            .eq('id', id)
            .single();
            
        if (!site) {
            return res.status(404).json({ error: 'Site not found' });
        }
        
        if (site.site_secret !== siteSecret) {
            return res.status(403).json({ error: 'Invalid site secret' });
        }
        
        // Upsert position
        const { data: position, error } = await supabase
            .from('press_positions')
            .upsert({
                site_id: id,
                selector_or_slug: selectorOrSlug,
                display_type: displayType || 'card',
                max_words: maxWords || 500,
                media_types: mediaTypes || ['image'],
                price_joy: priceJoy,
                available: true
            }, {
                onConflict: 'site_id,selector_or_slug'
            })
            .select()
            .single();
            
        if (error) {
            console.error('Failed to create position:', error);
            return res.status(500).json({ error: 'Failed to create position' });
        }
        
        res.status(201).json(position);
    } catch (error) {
        console.error('Create position error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/sites/:id/positions
 * Get all positions for a site
 */
router.get('/sites/:id/positions', async (req, res) => {
    try {
        const { id } = req.params;
        const { available } = req.query;
        
        let query = supabase
            .from('press_positions')
            .select('*')
            .eq('site_id', id);
            
        if (available === 'true') {
            query = query.eq('available', true);
        }
        
        const { data: positions, error } = await query;
        
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch positions' });
        }
        
        res.json(positions || []);
    } catch (error) {
        console.error('Get positions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/sites/:id/verify
 * Trigger verification for a site (spawns AI check + DH scoring)
 */
router.get('/sites/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get site
        const { data: site, error } = await supabase
            .from('press_sites')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error || !site) {
            return res.status(404).json({ error: 'Site not found' });
        }
        
        // Queue verification job (would integrate with AI service)
        // For now, create a verification record
        const { data: verification } = await supabase
            .from('press_verifications')
            .insert({
                site_id: id,
                verification_type: 'site',
                result: 'pending'
            })
            .select()
            .single();
        
        // Update site status
        await supabase
            .from('press_sites')
            .update({ status: 'pending' })
            .eq('id', id);
        
        res.json({
            verificationId: verification?.id,
            status: 'queued',
            message: 'Verification has been queued. You will be notified when complete.'
        });
    } catch (error) {
        console.error('Verify site error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/press/sites
 * List sites with filters
 */
router.get('/sites', async (req, res) => {
    try {
        const { status, tier, minDh, maxDh, limit = 50, offset = 0 } = req.query;
        
        let query = supabase
            .from('press_sites')
            .select('id, domain, dh_score, tier, status, created_at', { count: 'exact' })
            .eq('status', 'verified');
            
        if (status) {
            query = query.eq('status', status);
        }
        
        if (tier) {
            query = query.eq('tier', tier);
        }
        
        if (minDh) {
            query = query.gte('dh_score', parseFloat(minDh as string));
        }
        
        if (maxDh) {
            query = query.lte('dh_score', parseFloat(maxDh as string));
        }
        
        query = query
            .order('dh_score', { ascending: false })
            .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);
        
        const { data: sites, error, count } = await query;
        
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch sites' });
        }
        
        res.json({
            sites: sites || [],
            total: count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });
    } catch (error) {
        console.error('List sites error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
