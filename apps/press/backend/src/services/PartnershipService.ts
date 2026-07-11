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
import nodemailer from 'nodemailer';

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
            .select('id, status, company_name, contact_email')
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
        await this.notifyPartnershipRequest(site, partnership, publisher);
        
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
            
            const distSite = p.distributing_site as any;
            const tier = distSite?.tier || 'unknown';
            stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
            
            stats.totalReach += distSite?.traffic_estimate || 0;
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
    private async notifyPartnershipRequest(site: any, partnership: any, publisher: any): Promise<void> {
        if (!site.owner_email) {
            console.log('[PartnershipService] No owner email available for site:', site.domain);
            return;
        }

        console.log(`[PartnershipService] Notifying ${site.owner_email} of partnership request from publisher ${publisher?.company_name || publisher?.id}`);

        try {
            // Configure SMTP transporter
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: process.env.SMTP_USER ? {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                } : undefined,
            });

            const publisherName = publisher?.company_name || 'A publisher';
            const siteDomain = site.domain || 'your site';
            const partnershipType = partnership?.partnership_type || partnership?.type || 'standard';
            const terms = partnership?.terms || {};

            const subject = `New Partnership Request on SendPress - ${siteDomain}`;

            // Build terms display string
            let termsDetails = '';
            if (terms.billing) {
                termsDetails += `<li><strong>Billing:</strong> ${terms.billing}</li>`;
            }
            if (terms.monthlyFee !== undefined) {
                termsDetails += `<li><strong>Monthly Fee:</strong> ${terms.monthlyFee} JOY</li>`;
            }
            if (terms.perPublicationRate !== undefined) {
                termsDetails += `<li><strong>Per Publication Rate:</strong> ${terms.perPublicationRate} JOY</li>`;
            }
            if (terms.startDate) {
                termsDetails += `<li><strong>Start Date:</strong> ${terms.startDate}</li>`;
            }
            if (terms.endDate) {
                termsDetails += `<li><strong>End Date:</strong> ${terms.endDate}</li>`;
            }

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>New Partnership Request - SendPress</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                            color: #ffffff;
                            padding: 25px;
                            border-radius: 8px 8px 0 0;
                            text-align: center;
                        }
                        .content {
                            background-color: #f9fafb;
                            padding: 25px;
                            border: 1px solid #e5e7eb;
                            border-top: none;
                            border-radius: 0 0 8px 8px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #2563eb;
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            margin: 20px 0;
                        }
                        .details-box {
                            background-color: #ffffff;
                            border-left: 4px solid #2563eb;
                            padding: 15px;
                            margin: 15px 0;
                            border-radius: 0 4px 4px 0;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        }
                        .details-box ul {
                            margin: 0;
                            padding-left: 20px;
                        }
                        .footer {
                            text-align: center;
                            color: #6b7280;
                            font-size: 0.85em;
                            margin-top: 25px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0; font-size: 24px;">🤝 New Partnership Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>A new partnership request has been generated for your distribution site <strong>${siteDomain}</strong> on SendPress.</p>

                        <div class="details-box">
                            <h3 style="margin-top: 0; color: #1e3a8a;">Partnership Details</h3>
                            <ul>
                                <li><strong>Publisher:</strong> ${publisherName}</li>
                                <li><strong>Partnership Type:</strong> ${partnershipType}</li>
                                ${termsDetails}
                            </ul>
                        </div>

                        <p>Please log in to your SendPress publisher/partner dashboard to review and manage this request.</p>

                        <div style="text-align: center;">
                            <a href="https://press.sygn.live/dashboard" class="button">Go to Dashboard</a>
                        </div>

                        <p>Best regards,<br>The SendPress Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply directly to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} SendPress. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `;

            const text = `
New Partnership Request - SendPress

Hello,

A new partnership request has been generated for your distribution site ${siteDomain} on SendPress.

Partnership Details:
- Publisher: ${publisherName}
- Partnership Type: ${partnershipType}
${terms.billing ? `- Billing: ${terms.billing}\n` : ''}${terms.monthlyFee !== undefined ? `- Monthly Fee: ${terms.monthlyFee} JOY\n` : ''}${terms.perPublicationRate !== undefined ? `- Per Publication Rate: ${terms.perPublicationRate} JOY\n` : ''}${terms.startDate ? `- Start Date: ${terms.startDate}\n` : ''}${terms.endDate ? `- End Date: ${terms.endDate}\n` : ''}
Please log in to your dashboard at https://press.sygn.live/dashboard to review and manage this request.

Best regards,
The SendPress Team
            `.trim();

            const from = process.env.SMTP_FROM || process.env.EMAIL_FROM_ADDRESS || 'noreply@sygn.live';

            await transporter.sendMail({
                from,
                to: site.owner_email,
                subject,
                text,
                html,
            });

            console.log(`[PartnershipService] Notification email sent successfully to ${site.owner_email}`);
        } catch (err) {
            console.error('[PartnershipService] Failed to send email notification:', err);
            // Gracefully catch error so partnership creation doesn't fail
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
