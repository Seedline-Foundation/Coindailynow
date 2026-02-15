/**
 * SENDPRESS - Domain Height (DH) Scoring Service
 * Calculates composite DH score from DR, DA, UR, Relevance, and Traffic
 * 
 * Formula: DH = (B + A + P) × R × T
 * - B = Backbone (DR Score from Ahrefs)
 * - A = Armor (DA Score from Moz)
 * - P = Floorplan (UR / 2)
 * - R = Relevance Coefficient (0.0 - 1.0)
 * - T = Traffic Validity (0.0 - 1.0)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Tier definitions
export const DH_TIERS = {
    REJECT: { min: 0, max: 19, name: 'reject', payMultiplier: 0 },
    BRONZE: { min: 20, max: 39, name: 'bronze', payMultiplier: 1.0 },
    SILVER: { min: 40, max: 59, name: 'silver', payMultiplier: 1.75 },
    GOLD: { min: 60, max: 79, name: 'gold', payMultiplier: 4.0 },
    PLATINUM: { min: 80, max: 100, name: 'platinum', payMultiplier: 10.0 }
} as const;

export interface DHMetrics {
    drScore: number;      // Domain Rating (0-100)
    daScore: number;      // Domain Authority (0-100)
    urScore: number;      // URL Rating (0-100)
    relevance: number;    // Relevance coefficient (0.0-1.0)
    traffic: number;      // Traffic validity (0.0-1.0)
    backlinksCount?: number;
    referringDomains?: number;
    trafficEstimate?: number;
}

export interface DHResult {
    dhScore: number;
    tier: string;
    payMultiplier: number;
    breakdown: {
        baseline: number;
        drContribution: number;
        daContribution: number;
        urContribution: number;
        relevanceMultiplier: number;
        trafficMultiplier: number;
    };
    warnings: string[];
}

/**
 * Calculate Domain Height score
 */
export function calculateDH(metrics: DHMetrics): DHResult {
    const warnings: string[] = [];
    
    // Validate inputs
    const dr = Math.max(0, Math.min(100, metrics.drScore || 0));
    const da = Math.max(0, Math.min(100, metrics.daScore || 0));
    const ur = Math.max(0, Math.min(100, metrics.urScore || 0));
    const relevance = Math.max(0, Math.min(1, metrics.relevance || 1));
    const traffic = Math.max(0, Math.min(1, metrics.traffic || 1));
    
    // Red flag detection: High DR + Low DA = potential paid link farm
    if (dr > 40 && da < dr * 0.5) {
        warnings.push('Warning: High DR with low DA may indicate paid link profile');
    }
    
    // Low traffic warning
    if (traffic < 0.3) {
        warnings.push('Warning: Low traffic validity may indicate inactive site');
    }
    
    // Low relevance warning
    if (relevance < 0.3) {
        warnings.push('Warning: Low relevance score reduces placement value');
    }
    
    // Calculate baseline: B + A + P (where P = UR/2)
    const urContribution = ur / 2;
    const baseline = dr + da + urContribution;
    
    // Apply multipliers
    const rawDH = baseline * relevance * traffic;
    
    // Normalize to 0-100 scale (baseline max is ~250)
    const normalizedDH = Math.min(rawDH / 2.5, 100);
    
    // Round to 2 decimal places
    const dhScore = Math.round(normalizedDH * 100) / 100;
    
    // Determine tier
    const tier = getTierFromScore(dhScore);
    const payMultiplier = getPayMultiplier(tier);
    
    return {
        dhScore,
        tier,
        payMultiplier,
        breakdown: {
            baseline,
            drContribution: dr,
            daContribution: da,
            urContribution,
            relevanceMultiplier: relevance,
            trafficMultiplier: traffic
        },
        warnings
    };
}

/**
 * Get tier name from DH score
 */
export function getTierFromScore(dhScore: number): string {
    if (dhScore < 20) return 'reject';
    if (dhScore < 40) return 'bronze';
    if (dhScore < 60) return 'silver';
    if (dhScore < 80) return 'gold';
    return 'platinum';
}

/**
 * Get pay multiplier for a tier
 */
export function getPayMultiplier(tier: string): number {
    switch (tier) {
        case 'reject': return 0;
        case 'bronze': return 1.0;
        case 'silver': return 1.75;
        case 'gold': return 4.0;
        case 'platinum': return 10.0;
        default: return 0;
    }
}

/**
 * Calculate relevance coefficient based on content analysis
 */
export function calculateRelevance(
    siteCategories: string[],
    prCategories: string[]
): number {
    if (!siteCategories.length || !prCategories.length) {
        return 0.5; // Medium relevance if categories unknown
    }
    
    const siteSet = new Set(siteCategories.map(c => c.toLowerCase()));
    const prSet = new Set(prCategories.map(c => c.toLowerCase()));
    
    // Check for exact matches
    let matches = 0;
    for (const cat of prSet) {
        if (siteSet.has(cat)) {
            matches++;
        }
    }
    
    // Calculate overlap ratio
    const overlap = matches / Math.max(siteSet.size, prSet.size);
    
    // Map to relevance coefficient
    if (overlap >= 0.7) return 1.0;   // High relevance
    if (overlap >= 0.4) return 0.7;   // Medium-high relevance
    if (overlap >= 0.2) return 0.5;   // Medium relevance
    if (overlap > 0) return 0.3;      // Low relevance
    return 0.1;                       // Very low relevance
}

/**
 * Calculate traffic validity based on estimated traffic
 */
export function calculateTrafficValidity(trafficEstimate: number): number {
    if (trafficEstimate <= 0) return 0.1;        // Zero traffic
    if (trafficEstimate < 100) return 0.2;       // Very low
    if (trafficEstimate < 500) return 0.4;       // Low
    if (trafficEstimate < 1000) return 0.5;      // Below average
    if (trafficEstimate < 5000) return 0.7;      // Average
    if (trafficEstimate < 20000) return 0.85;    // Good
    if (trafficEstimate < 100000) return 0.95;   // High
    return 1.0;                                   // Very high
}

/**
 * Update site's DH score in database
 */
export async function updateSiteDHScore(
    siteId: string, 
    metrics: DHMetrics
): Promise<DHResult> {
    const result = calculateDH(metrics);
    
    // Update site record
    await supabase
        .from('press_sites')
        .update({
            dh_score: result.dhScore,
            dr_score: metrics.drScore,
            da_score: metrics.daScore,
            ur_score: metrics.urScore,
            relevance_score: metrics.relevance,
            traffic_score: metrics.traffic,
            tier: result.tier,
            updated_at: new Date().toISOString()
        })
        .eq('id', siteId);
    
    // Store metrics history
    await supabase
        .from('press_dh_metrics')
        .insert({
            site_id: siteId,
            backlinks_count: metrics.backlinksCount || 0,
            referring_domains: metrics.referringDomains || 0,
            traffic_estimate: metrics.trafficEstimate || 0,
            dr_score: metrics.drScore,
            da_score: metrics.daScore,
            ur_score: metrics.urScore,
            relevance_coefficient: metrics.relevance,
            traffic_validity: metrics.traffic,
            dh_score: result.dhScore,
            tier: result.tier,
            data_source: 'scoring_service'
        });
    
    return result;
}

/**
 * Get pricing for a site based on DH tier
 */
export function getSitePricing(dhScore: number, basePrice: number = 10): {
    priceJoy: number;
    tier: string;
    multiplier: number;
} {
    const tier = getTierFromScore(dhScore);
    const multiplier = getPayMultiplier(tier);
    
    return {
        priceJoy: basePrice * multiplier,
        tier,
        multiplier
    };
}

/**
 * Batch calculate DH scores for multiple sites
 */
export async function batchCalculateDH(
    siteMetrics: Array<{ siteId: string; metrics: DHMetrics }>
): Promise<Array<{ siteId: string; result: DHResult }>> {
    const results: Array<{ siteId: string; result: DHResult }> = [];
    
    for (const { siteId, metrics } of siteMetrics) {
        const result = await updateSiteDHScore(siteId, metrics);
        results.push({ siteId, result });
    }
    
    return results;
}

export default {
    calculateDH,
    getTierFromScore,
    getPayMultiplier,
    calculateRelevance,
    calculateTrafficValidity,
    updateSiteDHScore,
    getSitePricing,
    batchCalculateDH,
    DH_TIERS
};
