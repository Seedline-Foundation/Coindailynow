/**
 * SENDPRESS Monitoring Agent
 * 24/7/365 monitoring of PR placements and partner site compliance
 * 
 * Responsibilities:
 * - Verify PRs are displayed correctly on partner sites
 * - Monitor site DH scores for changes
 * - Detect and report non-compliant sites
 * - Trigger payment releases on successful verification
 */

import { createClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';
import crypto from 'crypto';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

export interface PlacementVerification {
    distributionId: string;
    siteId: string;
    prId: string;
    verified: boolean;
    visible: boolean;
    contentMatch: boolean;
    domHash: string;
    screenshotUrl?: string;
    confidence: number;
    issues: string[];
}

export interface SiteComplianceCheck {
    siteId: string;
    domain: string;
    compliant: boolean;
    dhScore: number;
    previousDhScore: number;
    dhChange: number;
    issues: string[];
    recommendation: 'keep' | 'warn' | 'suspend';
}

class MonitoringAgent {
    private browser: Browser | null = null;
    private checkInterval: NodeJS.Timeout | null = null;
    
    async init(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('[MonitoringAgent] Initialized');
    }
    
    async close(): Promise<void> {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    
    /**
     * Start continuous monitoring
     */
    startContinuousMonitoring(intervalMinutes: number = 30): void {
        console.log(`[MonitoringAgent] Starting continuous monitoring (every ${intervalMinutes} min)`);
        
        // Run immediately
        this.runMonitoringCycle();
        
        // Schedule periodic runs
        this.checkInterval = setInterval(
            () => this.runMonitoringCycle(),
            intervalMinutes * 60 * 1000
        );
    }
    
    /**
     * Run a full monitoring cycle
     */
    async runMonitoringCycle(): Promise<void> {
        console.log('[MonitoringAgent] Starting monitoring cycle');
        
        try {
            // 1. Verify pending distributions
            await this.verifyPendingDistributions();
            
            // 2. Check site compliance
            await this.checkSiteCompliance();
            
            // 3. Detect DH score changes
            await this.detectDHChanges();
            
            console.log('[MonitoringAgent] Monitoring cycle complete');
        } catch (error) {
            console.error('[MonitoringAgent] Monitoring cycle error:', error);
        }
    }
    
    /**
     * Verify all pending PR distributions
     */
    async verifyPendingDistributions(): Promise<void> {
        // Get pending distributions
        const { data: distributions } = await supabase
            .from('press_distributions')
            .select(`
                id,
                pr_id,
                target_sites,
                press_releases(id, title, canonical_hash)
            `)
            .in('status', ['pending', 'processing']);
        
        if (!distributions || distributions.length === 0) {
            return;
        }
        
        console.log(`[MonitoringAgent] Verifying ${distributions.length} distributions`);
        
        for (const dist of distributions) {
            await this.verifyDistribution(dist);
        }
    }
    
    /**
     * Verify a single distribution
     */
    async verifyDistribution(distribution: any): Promise<void> {
        const results: PlacementVerification[] = [];
        let allVerified = true;
        
        // Get target sites
        const { data: sites } = await supabase
            .from('press_sites')
            .select('id, domain')
            .in('id', distribution.target_sites);
        
        if (!sites) return;
        
        for (const site of sites) {
            const result = await this.verifyPlacement(
                distribution.id,
                site.id,
                site.domain,
                distribution.press_releases.id,
                distribution.press_releases.canonical_hash
            );
            
            results.push(result);
            
            if (!result.verified) {
                allVerified = false;
            }
        }
        
        // Update distribution status
        const verifiedCount = results.filter(r => r.verified).length;
        const totalCount = results.length;
        
        if (allVerified) {
            await supabase
                .from('press_distributions')
                .update({ status: 'verified' })
                .eq('id', distribution.id);
            
            console.log(`[MonitoringAgent] Distribution ${distribution.id} verified (${verifiedCount}/${totalCount})`);
        } else if (verifiedCount > totalCount * 0.5) {
            // Partial verification
            await supabase
                .from('press_distributions')
                .update({ status: 'processing' })
                .eq('id', distribution.id);
        }
    }
    
    /**
     * Verify PR placement on a specific site
     */
    async verifyPlacement(
        distributionId: string,
        siteId: string,
        domain: string,
        prId: string,
        canonicalHash: string
    ): Promise<PlacementVerification> {
        const issues: string[] = [];
        let page: Page | null = null;
        
        try {
            if (!this.browser) {
                await this.init();
            }
            
            page = await this.browser!.newPage();
            await page.setDefaultTimeout(30000);
            
            const response = await page.goto(`https://${domain}`, {
                waitUntil: 'networkidle'
            });
            
            if (!response || !response.ok()) {
                issues.push(`Site returned ${response?.status()}`);
                return this.createFailedVerification(distributionId, siteId, prId, issues);
            }
            
            // Look for PR element
            const prElement = await page.$(`[data-pr-id="${prId}"]`);
            
            if (!prElement) {
                issues.push('PR element not found on page');
                return this.createFailedVerification(distributionId, siteId, prId, issues);
            }
            
            // Check visibility
            const isVisible = await prElement.isVisible();
            if (!isVisible) {
                issues.push('PR element exists but is not visible');
            }
            
            // Check content match
            const prContent = await prElement.textContent();
            const contentHash = crypto
                .createHash('sha256')
                .update(prContent || '')
                .digest('hex');
            
            const contentMatch = contentHash === canonicalHash;
            if (!contentMatch) {
                issues.push('PR content does not match original');
            }
            
            // Calculate DOM hash
            const domHtml = await prElement.evaluate(el => el.outerHTML);
            const domHash = crypto
                .createHash('sha256')
                .update(domHtml)
                .digest('hex');
            
            // Take screenshot
            const screenshot = await page.screenshot({ type: 'png' });
            const screenshotUrl = await this.uploadScreenshot(siteId, distributionId, screenshot);
            
            // Calculate confidence
            let confidence = 1.0;
            if (!isVisible) confidence -= 0.3;
            if (!contentMatch) confidence -= 0.4;
            
            const result: PlacementVerification = {
                distributionId,
                siteId,
                prId,
                verified: isVisible && confidence >= 0.6,
                visible: isVisible,
                contentMatch,
                domHash,
                screenshotUrl,
                confidence,
                issues
            };
            
            // Store verification record
            await supabase
                .from('press_verifications')
                .insert({
                    distribution_id: distributionId,
                    site_id: siteId,
                    verification_type: 'placement',
                    result: result.verified ? 'passed' : 'failed',
                    confidence,
                    screenshot_url: screenshotUrl,
                    dom_hash: domHash,
                    logs: { issues, visible: isVisible, contentMatch }
                });
            
            return result;
            
        } catch (error: any) {
            issues.push(`Verification error: ${error.message}`);
            return this.createFailedVerification(distributionId, siteId, prId, issues);
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
    
    /**
     * Check compliance of all active sites
     */
    async checkSiteCompliance(): Promise<void> {
        const { data: sites } = await supabase
            .from('press_sites')
            .select('*')
            .eq('status', 'verified')
            .order('last_crawl_at', { ascending: true })
            .limit(50);
        
        if (!sites || sites.length === 0) return;
        
        console.log(`[MonitoringAgent] Checking compliance for ${sites.length} sites`);
        
        for (const site of sites) {
            await this.checkSingleSiteCompliance(site);
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    /**
     * Check compliance of a single site
     */
    async checkSingleSiteCompliance(site: any): Promise<SiteComplianceCheck> {
        const issues: string[] = [];
        let recommendation: 'keep' | 'warn' | 'suspend' = 'keep';
        
        try {
            // TODO: Recalculate DH score with fresh data
            const currentDH = site.dh_score;
            const previousDH = site.dh_score; // Would need historical tracking
            const dhChange = currentDH - previousDH;
            
            // Check for significant DH drop
            if (dhChange < -10) {
                issues.push(`DH score dropped by ${Math.abs(dhChange)} points`);
                recommendation = 'warn';
            }
            
            if (currentDH < 40) {
                issues.push('DH score below minimum threshold');
                recommendation = 'suspend';
            }
            
            // Update last crawl timestamp
            await supabase
                .from('press_sites')
                .update({ last_crawl_at: new Date().toISOString() })
                .eq('id', site.id);
            
            // Handle recommendations
            if (recommendation === 'suspend') {
                await this.suspendSite(site.id, issues);
            } else if (recommendation === 'warn') {
                await this.warnSiteOwner(site.id, issues);
            }
            
            return {
                siteId: site.id,
                domain: site.domain,
                compliant: recommendation !== 'suspend',
                dhScore: currentDH,
                previousDhScore: previousDH,
                dhChange,
                issues,
                recommendation
            };
            
        } catch (error: any) {
            issues.push(`Compliance check error: ${error.message}`);
            return {
                siteId: site.id,
                domain: site.domain,
                compliant: false,
                dhScore: 0,
                previousDhScore: site.dh_score,
                dhChange: 0,
                issues,
                recommendation: 'warn'
            };
        }
    }
    
    /**
     * Detect significant DH score changes across all sites
     */
    async detectDHChanges(): Promise<void> {
        // Get sites with recent metrics to compare
        const { data: recentMetrics } = await supabase
            .from('press_dh_metrics')
            .select('site_id, dh_score, computed_at')
            .order('computed_at', { ascending: false })
            .limit(100);
        
        if (!recentMetrics) return;
        
        // Group by site and detect changes
        const siteChanges = new Map<string, { current: number; previous: number }>();
        
        for (const metric of recentMetrics) {
            if (!siteChanges.has(metric.site_id)) {
                siteChanges.set(metric.site_id, { current: metric.dh_score, previous: metric.dh_score });
            } else {
                const existing = siteChanges.get(metric.site_id)!;
                existing.previous = metric.dh_score;
            }
        }
        
        // Report significant changes
        for (const [siteId, { current, previous }] of siteChanges) {
            const change = current - previous;
            if (Math.abs(change) > 10) {
                console.log(`[MonitoringAgent] Site ${siteId}: DH changed ${change > 0 ? '+' : ''}${change.toFixed(1)}`);
            }
        }
    }
    
    /**
     * Suspend a non-compliant site
     */
    private async suspendSite(siteId: string, reasons: string[]): Promise<void> {
        await supabase
            .from('press_sites')
            .update({ status: 'suspended' })
            .eq('id', siteId);
        
        console.log(`[MonitoringAgent] Suspended site ${siteId}: ${reasons.join(', ')}`);
        
        // TODO: Send notification to site owner
    }
    
    /**
     * Send warning to site owner
     */
    private async warnSiteOwner(siteId: string, issues: string[]): Promise<void> {
        const { data: site } = await supabase
            .from('press_sites')
            .select('owner_email, domain')
            .eq('id', siteId)
            .single();
        
        if (site?.owner_email) {
            console.log(`[MonitoringAgent] Would warn ${site.owner_email} about: ${issues.join(', ')}`);
            // TODO: Send warning email
        }
    }
    
    /**
     * Upload verification screenshot
     */
    private async uploadScreenshot(
        siteId: string, 
        distributionId: string, 
        screenshot: Buffer
    ): Promise<string> {
        try {
            const filename = `verifications/${siteId}/${distributionId}/${Date.now()}.png`;
            
            await supabase.storage
                .from('press-assets')
                .upload(filename, screenshot, { contentType: 'image/png' });
            
            const { data } = supabase.storage
                .from('press-assets')
                .getPublicUrl(filename);
            
            return data.publicUrl;
        } catch (error) {
            console.error('Screenshot upload error:', error);
            return '';
        }
    }
    
    private createFailedVerification(
        distributionId: string,
        siteId: string,
        prId: string,
        issues: string[]
    ): PlacementVerification {
        return {
            distributionId,
            siteId,
            prId,
            verified: false,
            visible: false,
            contentMatch: false,
            domHash: '',
            confidence: 0,
            issues
        };
    }
}

export const monitoringAgent = new MonitoringAgent();
export default monitoringAgent;
