/**
 * SENDPRESS Distribution Service
 * Handles PR distribution to partner network with escrow payments
 * 
 * Responsibilities:
 * - Process distribution requests
 * - Handle hybrid distribution (affiliates + extended network)
 * - Manage escrow and payments
 * - Track distribution status
 */

import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { calculateDH, getTierFromScore, getPayMultiplier } from './DHScoringService';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Distribution escrow contract ABI (simplified)
const ESCROW_ABI = [
    'function lockCredits(bytes32 distributionId, address[] partners, uint256[] amounts)',
    'function release(bytes32 distributionId)',
    'function refund(bytes32 distributionId)'
];

export interface DistributionRequest {
    publisherId: string;
    prContent: {
        title: string;
        content: string;
        summary?: string;
        mediaUrls?: string[];
        categories: string[];
    };
    strategy: DistributionStrategy;
}

export interface DistributionStrategy {
    usePreExisting: boolean;         // Use affiliate partners (no payment)
    preExistingPartnerIds?: string[];
    extendToTiers: TierTarget[];     // Extended network (paid)
    targetSiteIds?: string[];        // Specific sites to target
    budget: number;                  // Max budget in JOY
    priority: 'speed' | 'reach' | 'balanced';
}

export interface TierTarget {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    count: number;
    maxBudget?: number;
}

export interface DistributionResult {
    distributionId: string;
    prId: string;
    status: 'pending' | 'processing' | 'verified' | 'completed' | 'failed';
    targetSites: TargetSite[];
    escrowId?: string;
    totalCost: number;
    estimatedCompletion: Date;
}

export interface TargetSite {
    siteId: string;
    domain: string;
    tier: string;
    price: number;
    isAffiliate: boolean;
    status: 'pending' | 'distributed' | 'verified' | 'failed';
}

class DistributionService {
    private escrowContract: ethers.Contract | null = null;
    
    /**
     * Initialize escrow contract connection
     */
    async initEscrow(): Promise<void> {
        if (process.env.ESCROW_CONTRACT_ADDRESS && process.env.POLYGON_RPC_URL) {
            const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
            this.escrowContract = new ethers.Contract(
                process.env.ESCROW_CONTRACT_ADDRESS,
                ESCROW_ABI,
                provider
            );
        }
    }
    
    /**
     * Process a new distribution request
     */
    async processDistribution(request: DistributionRequest): Promise<DistributionResult> {
        // 1. Validate publisher
        const publisher = await this.validatePublisher(request.publisherId);
        if (!publisher) {
            throw new Error('Invalid publisher');
        }
        
        // 2. Create PR record
        const prId = await this.createPR(request.publisherId, request.prContent);
        
        // 3. Select target sites
        const targetSites = await this.selectTargetSites(request.strategy, request.publisherId);
        
        // 4. Calculate costs
        const costBreakdown = this.calculateCosts(targetSites);
        
        // 5. Verify publisher balance
        if (costBreakdown.totalCost > publisher.balance) {
            throw new Error(`Insufficient balance. Required: ${costBreakdown.totalCost} JOY, Available: ${publisher.balance} JOY`);
        }
        
        // 6. Create distribution record
        const distributionId = crypto.randomUUID();
        
        await supabase
            .from('press_distributions')
            .insert({
                id: distributionId,
                publisher_id: request.publisherId,
                pr_id: prId,
                target_sites: targetSites.map(s => s.siteId),
                total_cost: costBreakdown.totalCost,
                affiliate_cost: costBreakdown.affiliateCost,
                extended_cost: costBreakdown.extendedCost,
                status: 'pending'
            });
        
        // 7. Lock funds in escrow (if there are paid distributions)
        let escrowId: string | undefined;
        if (costBreakdown.extendedCost > 0) {
            escrowId = await this.lockEscrow(
                distributionId,
                targetSites.filter(s => !s.isAffiliate)
            );
        }
        
        // 8. Queue distribution jobs
        await this.queueDistributions(distributionId, targetSites);
        
        return {
            distributionId,
            prId,
            status: 'processing',
            targetSites,
            escrowId,
            totalCost: costBreakdown.totalCost,
            estimatedCompletion: this.estimateCompletion(targetSites)
        };
    }
    
    /**
     * Validate publisher exists and is active
     */
    private async validatePublisher(publisherId: string): Promise<any> {
        const { data } = await supabase
            .from('press_publishers')
            .select('*')
            .eq('id', publisherId)
            .eq('status', 'active')
            .single();
        
        return data;
    }
    
    /**
     * Create PR record with canonical hash
     */
    private async createPR(publisherId: string, content: DistributionRequest['prContent']): Promise<string> {
        const canonicalHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(content))
            .digest('hex');
        
        const { data, error } = await supabase
            .from('press_releases')
            .insert({
                publisher_id: publisherId,
                title: content.title,
                content: content.content,
                summary: content.summary,
                media_urls: content.mediaUrls || [],
                categories: content.categories,
                canonical_hash: canonicalHash,
                status: 'pending'
            })
            .select('id')
            .single();
        
        if (error) throw error;
        return data.id;
    }
    
    /**
     * Select target sites based on distribution strategy
     */
    private async selectTargetSites(
        strategy: DistributionStrategy,
        publisherId: string
    ): Promise<TargetSite[]> {
        const targetSites: TargetSite[] = [];
        
        // 1. Add pre-existing partners (affiliates) - no payment
        if (strategy.usePreExisting) {
            const affiliates = await this.getAffiliatePartners(publisherId);
            
            for (const affiliate of affiliates) {
                // Skip if not in preExistingPartnerIds list (if specified)
                if (strategy.preExistingPartnerIds?.length && 
                    !strategy.preExistingPartnerIds.includes(affiliate.id)) {
                    continue;
                }
                
                targetSites.push({
                    siteId: affiliate.id,
                    domain: affiliate.domain,
                    tier: affiliate.tier,
                    price: 0, // Free for affiliates
                    isAffiliate: true,
                    status: 'pending'
                });
            }
        }
        
        // 2. Add specific sites if targeted
        if (strategy.targetSiteIds?.length) {
            const { data: sites } = await supabase
                .from('press_sites')
                .select('*')
                .in('id', strategy.targetSiteIds)
                .eq('status', 'verified');
            
            for (const site of sites || []) {
                if (!targetSites.find(s => s.siteId === site.id)) {
                    targetSites.push({
                        siteId: site.id,
                        domain: site.domain,
                        tier: site.tier,
                        price: this.getSitePrice(site.tier),
                        isAffiliate: false,
                        status: 'pending'
                    });
                }
            }
        }
        
        // 3. Add extended network sites by tier
        for (const tierTarget of strategy.extendToTiers) {
            const { data: tierSites } = await supabase
                .from('press_sites')
                .select('*')
                .eq('tier', tierTarget.tier)
                .eq('status', 'verified')
                .not('id', 'in', `(${targetSites.map(s => s.siteId).join(',')})`)
                .limit(tierTarget.count);
            
            for (const site of tierSites || []) {
                const price = this.getSitePrice(site.tier);
                
                // Check budget constraint
                const currentTotal = targetSites.reduce((sum, s) => sum + s.price, 0);
                if (currentTotal + price > strategy.budget) {
                    break;
                }
                
                targetSites.push({
                    siteId: site.id,
                    domain: site.domain,
                    tier: site.tier,
                    price,
                    isAffiliate: false,
                    status: 'pending'
                });
            }
        }
        
        return targetSites;
    }
    
    /**
     * Get affiliate partners for a publisher
     */
    private async getAffiliatePartners(publisherId: string): Promise<any[]> {
        const { data } = await supabase
            .from('press_partnerships')
            .select(`
                distributing_site:press_sites!distributing_site_id(id, domain, tier, status)
            `)
            .eq('originating_publisher_id', publisherId)
            .eq('partnership_type', 'affiliate')
            .eq('status', 'active');
        
        return (data || [])
            .map(p => p.distributing_site)
            .filter(site => site?.status === 'verified');
    }
    
    /**
     * Get price for a site based on tier
     */
    private getSitePrice(tier: string): number {
        const basePrice = 10; // Base price in JOY
        const multiplier = getPayMultiplier(tier);
        return basePrice * multiplier;
    }
    
    /**
     * Calculate cost breakdown
     */
    private calculateCosts(targetSites: TargetSite[]): {
        totalCost: number;
        affiliateCost: number;
        extendedCost: number;
    } {
        const affiliateCost = 0; // Affiliates are free
        const extendedCost = targetSites
            .filter(s => !s.isAffiliate)
            .reduce((sum, s) => sum + s.price, 0);
        
        return {
            totalCost: affiliateCost + extendedCost,
            affiliateCost,
            extendedCost
        };
    }
    
    /**
     * Lock funds in escrow contract
     */
    private async lockEscrow(
        distributionId: string,
        paidSites: TargetSite[]
    ): Promise<string> {
        if (!this.escrowContract) {
            console.log('[DistributionService] Escrow contract not configured, skipping on-chain lock');
            return '';
        }
        
        try {
            // Get site wallet addresses
            const { data: sites } = await supabase
                .from('press_sites')
                .select('id, wallet_address')
                .in('id', paidSites.map(s => s.siteId));
            
            const partners = paidSites.map(s => {
                const site = sites?.find(st => st.id === s.siteId);
                return site?.wallet_address || ethers.ZeroAddress;
            });
            
            const amounts = paidSites.map(s => 
                ethers.parseUnits(s.price.toString(), 18)
            );
            
            const distributionIdBytes = ethers.id(distributionId);
            
            // Note: In production, this would need a signer
            console.log('[DistributionService] Would lock escrow:', {
                distributionId: distributionIdBytes,
                partners,
                amounts: amounts.map(a => a.toString())
            });
            
            return distributionIdBytes;
        } catch (error) {
            console.error('[DistributionService] Escrow lock error:', error);
            throw error;
        }
    }
    
    /**
     * Queue distribution jobs for processing
     */
    private async queueDistributions(
        distributionId: string,
        targetSites: TargetSite[]
    ): Promise<void> {
        // In production, this would use a job queue (Bull, etc.)
        console.log(`[DistributionService] Queued ${targetSites.length} distributions for ${distributionId}`);
        
        // Update distribution status
        await supabase
            .from('press_distributions')
            .update({ status: 'processing' })
            .eq('id', distributionId);
    }
    
    /**
     * Estimate completion time based on tier priorities
     */
    private estimateCompletion(targetSites: TargetSite[]): Date {
        // T1 (platinum/gold): 30 seconds
        // T2 (silver): 5 minutes
        // T3 (bronze): 30 minutes
        
        const hasPlatinum = targetSites.some(s => s.tier === 'platinum');
        const hasGold = targetSites.some(s => s.tier === 'gold');
        const hasSilver = targetSites.some(s => s.tier === 'silver');
        
        let maxSeconds = 0;
        if (hasPlatinum || hasGold) maxSeconds = Math.max(maxSeconds, 30);
        if (hasSilver) maxSeconds = Math.max(maxSeconds, 300);
        maxSeconds = Math.max(maxSeconds, 1800); // Bronze baseline
        
        return new Date(Date.now() + maxSeconds * 1000);
    }
    
    /**
     * Mark distribution as verified and release payment
     */
    async markVerified(distributionId: string, siteId: string): Promise<void> {
        // Update site status in distribution
        const { data: dist } = await supabase
            .from('press_distributions')
            .select('*')
            .eq('id', distributionId)
            .single();
        
        if (!dist) return;
        
        // Check if all sites are verified
        const allVerified = await this.checkAllSitesVerified(distributionId);
        
        if (allVerified) {
            // Release escrow
            await this.releaseEscrow(distributionId);
            
            // Update distribution status
            await supabase
                .from('press_distributions')
                .update({ status: 'completed' })
                .eq('id', distributionId);
        }
    }
    
    /**
     * Check if all distribution sites are verified
     */
    private async checkAllSitesVerified(distributionId: string): Promise<boolean> {
        const { data: verifications } = await supabase
            .from('press_verifications')
            .select('*')
            .eq('distribution_id', distributionId)
            .eq('verification_type', 'placement')
            .eq('result', 'passed');
        
        const { data: dist } = await supabase
            .from('press_distributions')
            .select('target_sites')
            .eq('id', distributionId)
            .single();
        
        if (!dist || !verifications) return false;
        
        return verifications.length >= dist.target_sites.length;
    }
    
    /**
     * Release escrow funds to partners
     */
    private async releaseEscrow(distributionId: string): Promise<void> {
        if (!this.escrowContract) {
            console.log('[DistributionService] Escrow release: contract not configured');
            return;
        }
        
        try {
            const distributionIdBytes = ethers.id(distributionId);
            console.log('[DistributionService] Would release escrow:', distributionIdBytes);
        } catch (error) {
            console.error('[DistributionService] Escrow release error:', error);
        }
    }
    
    /**
     * Get distribution status
     */
    async getDistributionStatus(distributionId: string): Promise<any> {
        const { data: dist } = await supabase
            .from('press_distributions')
            .select(`
                *,
                press_releases(id, title, status),
                press_publishers(id, name, wallet_address)
            `)
            .eq('id', distributionId)
            .single();
        
        if (!dist) return null;
        
        // Get verification status for each site
        const { data: verifications } = await supabase
            .from('press_verifications')
            .select('site_id, result, confidence')
            .eq('distribution_id', distributionId)
            .eq('verification_type', 'placement');
        
        return {
            ...dist,
            verifications: verifications || []
        };
    }
}

export const distributionService = new DistributionService();
export default distributionService;
