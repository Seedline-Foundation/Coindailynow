/**
 * SENDPRESS Partnership Service
 * Manages partnerships between publishers and distribution sites
 * 
 * Partnership Types:
 * - affiliate: Pre-existing syndication (no payment required)
 * - paid: Standard paid distribution
 * - hybrid: Mix of free affiliates + paid extended network
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export type PartnershipType = 'affiliate' | 'paid' | 'hybrid';
export type PartnershipStatus = 'pending' | 'active' | 'suspended' | 'terminated';

export interface CreatePartnershipRequest {
    originatingPublisherId: string;
    distributingSiteId: string;
    type: PartnershipType;
    terms: PartnershipTerms;
}

export interface PartnershipTerms {
    billing: 'monthly' | 'per_publication' | 'hybrid';
    monthlyFee?: number;          // JOY tokens
    perPublicationRate?: number;   // JOY per PR
    minPublications?: number;      // Minimum PRs per month
    maxPublications?: number;      // Cap on PRs
    exclusivity?: boolean;
    autoRenewal?: boolean;
    startDate?: string;
    endDate?: string;
}

export interface Partnership {
    id: string;
    originatingPublisherId: string;
    distributingSiteId: string;
    type: PartnershipType;
    terms: PartnershipTerms;
    status: PartnershipStatus;
    createdAt: string;
    updatedAt: string;
}

class PartnershipService {
    /**
     * Create a new partnership
     */
    async createPartnership(request: CreatePartnershipRequest): Promise<Partnership> {
        // Validate publisher exists
        const { data: publisher } = await supabase
            .from('press_publishers')
            .select('id, status')
            .eq('id', request.originatingPublisherId)
            .eq('status', 'active')
            .single();
        
        if (!publisher) {
            throw new Error('Publisher not found or inactive');
        }
        
        // Validate site exists and is verified
        const { data: site } = await supabase
            .from('press_sites')
            .select('id, domain, status, owner_email')
            .eq('id', request.distributingSiteId)
            .eq('status', 'verified')
            .single();
        
        if (!site) {
            throw new Error('Site not found or not verified');
        }
        
        // Check for existing partnership
        const { data: existing } = await supabase
            .from('press_partnerships')
            .select('id, status')
            .eq('originating_publisher_id', request.originatingPublisherId)
            .eq('distributing_site_id', request.distributingSiteId)
            .in('status', ['pending', 'active'])
            .single();
        
        if (existing) {
            throw new Error('Partnership already exists');
        }
        
        // Create partnership
        const { data: partnership, error } = await supabase
            .from('press_partnerships')
            .insert({
                originating_publisher_id: request.originatingPublisherId,
                distributing_site_id: request.distributingSiteId,
                partnership_type: request.type,
                terms: request.terms,
                status: 'pending'
            })
            .select('*')
            .single();
        
        if (error) throw error;
        
        // Notify site owner
        await this.notifyPartnershipRequest(site, partnership);
        
        return this.mapPartnership(partnership);
    }
    
    /**
     * Accept a partnership request
     */
    async acceptPartnership(partnershipId: string, siteOwnerId: string): Promise<Partnership> {
        // Verify ownership
        const { data: partnership } = await supabase
            .from('press_partnerships')
            .select(`
                *,
                distributing_site:press_sites!distributing_site_id(id, owner_id)
            `)
            .eq('id', partnershipId)
            .eq('status', 'pending')
            .single();
        
        if (!partnership) {
            throw new Error('Partnership not found or not pending');
        }
        
        if (partnership.distributing_site?.owner_id !== siteOwnerId) {
            throw new Error('Not authorized to accept this partnership');
        }
        
        // Update status
        const { data: updated, error } = await supabase
            .from('press_partnerships')
            .update({
                status: 'active',
                accepted_at: new Date().toISOString()
            })
            .eq('id', partnershipId)
            .select('*')
            .single();
        
        if (error) throw error;
        
        // Notify publisher
        await this.notifyPartnershipAccepted(partnershipId);
        
        return this.mapPartnership(updated);
    }
    
    /**
     * Reject a partnership request
     */
    async rejectPartnership(partnershipId: string, siteOwnerId: string, reason?: string): Promise<void> {
        const { data: partnership } = await supabase
            .from('press_partnerships')
            .select(`
                *,
                distributing_site:press_sites!distributing_site_id(id, owner_id)
            `)
            .eq('id', partnershipId)
            .eq('status', 'pending')
            .single();
        
        if (!partnership) {
            throw new Error('Partnership not found');
        }
        
        if (partnership.distributing_site?.owner_id !== siteOwnerId) {
            throw new Error('Not authorized');
        }
        
        await supabase
            .from('press_partnerships')
            .update({
                status: 'terminated',
                terminated_reason: reason || 'Rejected by site owner'
            })
            .eq('id', partnershipId);
        
        // Notify publisher
        await this.notifyPartnershipRejected(partnershipId, reason);
    }
    
    /**
     * Suspend a partnership
     */
    async suspendPartnership(partnershipId: string, reason: string): Promise<void> {
        await supabase
            .from('press_partnerships')
            .update({
                status: 'suspended',
                suspended_reason: reason,
                suspended_at: new Date().toISOString()
            })
            .eq('id', partnershipId);
    }
    
    /**
     * Reactivate a suspended partnership
     */
    async reactivatePartnership(partnershipId: string): Promise<Partnership> {
        const { data, error } = await supabase
            .from('press_partnerships')
            .update({
                status: 'active',
                suspended_reason: null,
                suspended_at: null,
                reactivated_at: new Date().toISOString()
            })
            .eq('id', partnershipId)
            .eq('status', 'suspended')
            .select('*')
            .single();
        
        if (error) throw error;
        return this.mapPartnership(data);
    }
    
    /**
     * Get partnerships for a publisher
     */
    async getPublisherPartnerships(
        publisherId: string,
        options?: { status?: PartnershipStatus; type?: PartnershipType }
    ): Promise<Partnership[]> {
        let query = supabase
            .from('press_partnerships')
            .select(`
                *,
                distributing_site:press_sites!distributing_site_id(id, domain, tier, dh_score)
            `)
            .eq('originating_publisher_id', publisherId);
        
        if (options?.status) {
            query = query.eq('status', options.status);
        }
        if (options?.type) {
            query = query.eq('partnership_type', options.type);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return (data || []).map(p => this.mapPartnership(p));
    }
    
    /**
     * Get partnerships for a site
     */
    async getSitePartnerships(
        siteId: string,
        options?: { status?: PartnershipStatus }
    ): Promise<Partnership[]> {
        let query = supabase
            .from('press_partnerships')
            .select(`
                *,
                originating_publisher:press_publishers!originating_publisher_id(id, name, wallet_address)
            `)
            .eq('distributing_site_id', siteId);
        
        if (options?.status) {
            query = query.eq('status', options.status);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return (data || []).map(p => this.mapPartnership(p));
    }
    
    /**
     * Import existing syndication partners as affiliates
     */
    async importAffiliates(
        publisherId: string,
        affiliateDomains: string[]
    ): Promise<{ imported: number; failed: string[] }> {
        const failed: string[] = [];
        let imported = 0;
        
        for (const domain of affiliateDomains) {
            try {
                // Find or create site
                let { data: site } = await supabase
                    .from('press_sites')
                    .select('id')
                    .eq('domain', domain.toLowerCase())
                    .single();
                
                if (!site) {
                    // Create site record for affiliate
                    const { data: created, error } = await supabase
                        .from('press_sites')
                        .insert({
                            domain: domain.toLowerCase(),
                            status: 'pending', // Needs verification
                            is_affiliate_import: true
                        })
                        .select('id')
                        .single();
                    
                    if (error) throw error;
                    site = created;
                }
                
                // Create affiliate partnership
                await supabase
                    .from('press_partnerships')
                    .upsert({
                        originating_publisher_id: publisherId,
                        distributing_site_id: site.id,
                        partnership_type: 'affiliate',
                        terms: {
                            billing: 'per_publication',
                            perPublicationRate: 0, // Free for affiliates
                            autoRenewal: true
                        },
                        status: 'active'
                    }, {
                        onConflict: 'originating_publisher_id,distributing_site_id'
                    });
                
                imported++;
            } catch (error) {
                console.error(`Failed to import affiliate ${domain}:`, error);
                failed.push(domain);
            }
        }
        
        return { imported, failed };
    }
    
    /**
     * Get partnership statistics for a publisher
     */
    async getPartnershipStats(publisherId: string): Promise<{
        totalPartnerships: number;
        affiliates: number;
        paid: number;
        byTier: Record<string, number>;
        totalReach: number;
    }> {
        const { data: partnerships } = await supabase
            .from('press_partnerships')
            .select(`
                partnership_type,
                distributing_site:press_sites!distributing_site_id(tier, traffic_estimate)
            `)
            .eq('originating_publisher_id', publisherId)
            .eq('status', 'active');
        
        const stats = {
            totalPartnerships: 0,
            affiliates: 0,
            paid: 0,
            byTier: {} as Record<string, number>,
            totalReach: 0
        };
        
        for (const p of partnerships || []) {
            stats.totalPartnerships++;
            
            if (p.partnership_type === 'affiliate') {
                stats.affiliates++;
            } else {
                stats.paid++;
            }
            
            const tier = p.distributing_site?.tier || 'unknown';
            stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
            
            stats.totalReach += p.distributing_site?.traffic_estimate || 0;
        }
        
        return stats;
    }
    
    /**
     * Update partnership terms
     */
    async updateTerms(
        partnershipId: string,
        newTerms: Partial<PartnershipTerms>
    ): Promise<Partnership> {
        const { data: existing } = await supabase
            .from('press_partnerships')
            .select('terms')
            .eq('id', partnershipId)
            .single();
        
        if (!existing) {
            throw new Error('Partnership not found');
        }
        
        const mergedTerms = { ...existing.terms, ...newTerms };
        
        const { data, error } = await supabase
            .from('press_partnerships')
            .update({ terms: mergedTerms })
            .eq('id', partnershipId)
            .select('*')
            .single();
        
        if (error) throw error;
        return this.mapPartnership(data);
    }
    
    /**
     * Notify site owner of partnership request
     */
    private async notifyPartnershipRequest(site: any, partnership: any): Promise<void> {
        if (site.owner_email) {
            console.log(`[PartnershipService] Would notify ${site.owner_email} of partnership request`);
            // TODO: Send email notification
        }
    }
    
    /**
     * Notify publisher of accepted partnership
     */
    private async notifyPartnershipAccepted(partnershipId: string): Promise<void> {
        console.log(`[PartnershipService] Partnership ${partnershipId} accepted`);
        // TODO: Send notification
    }
    
    /**
     * Notify publisher of rejected partnership
     */
    private async notifyPartnershipRejected(partnershipId: string, reason?: string): Promise<void> {
        console.log(`[PartnershipService] Partnership ${partnershipId} rejected: ${reason}`);
        // TODO: Send notification
    }
    
    /**
     * Map database record to Partnership interface
     */
    private mapPartnership(data: any): Partnership {
        return {
            id: data.id,
            originatingPublisherId: data.originating_publisher_id,
            distributingSiteId: data.distributing_site_id,
            type: data.partnership_type,
            terms: data.terms,
            status: data.status,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

export const partnershipService = new PartnershipService();
export default partnershipService;
