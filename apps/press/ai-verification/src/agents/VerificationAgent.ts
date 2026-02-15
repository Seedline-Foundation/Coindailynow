/**
 * SENDPRESS AI Verification Agent
 * Scans websites with DH 40+ and pitches them for partnership
 * 
 * Responsibilities:
 * - Discover domains via DNS/crawling
 * - Verify website authority and content
 * - Calculate Domain Height (DH) score
 * - Send pitch emails to site owners
 * - Track pitched, pending, and accepted sites
 */

import { createClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Minimum DH score to pitch
const MIN_DH_THRESHOLD = 40;

// Categories we're interested in
const TARGET_CATEGORIES = [
    'crypto', 'blockchain', 'finance', 'fintech', 'investment',
    'trading', 'defi', 'nft', 'web3', 'business', 'technology',
    'news', 'africa', 'emerging markets'
];

export interface VerificationResult {
    siteId: string;
    domain: string;
    verified: boolean;
    dhScore: number;
    tier: string;
    ownerEmail?: string;
    contentCategories: string[];
    techStack: string[];
    warnings: string[];
    screenshotUrl?: string;
}

export interface SiteDiscovery {
    domain: string;
    source: string;
    estimatedDH: number;
    contactEmail?: string;
}

class VerificationAgent {
    private browser: Browser | null = null;
    
    async init(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('[VerificationAgent] Initialized');
    }
    
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    
    /**
     * Verify a single website
     */
    async verifySite(domain: string): Promise<VerificationResult> {
        const siteId = await this.getOrCreateSite(domain);
        const warnings: string[] = [];
        
        let page: Page | null = null;
        
        try {
            if (!this.browser) {
                await this.init();
            }
            
            page = await this.browser!.newPage();
            
            // Set timeout and navigate
            await page.setDefaultTimeout(30000);
            const response = await page.goto(`https://${domain}`, {
                waitUntil: 'domcontentloaded'
            });
            
            if (!response || !response.ok()) {
                throw new Error(`Failed to load: ${response?.status()}`);
            }
            
            // Extract site info
            const [
                contentCategories,
                techStack,
                ownerEmail,
                screenshot
            ] = await Promise.all([
                this.analyzeContent(page),
                this.detectTechStack(page),
                this.findOwnerEmail(page, domain),
                page.screenshot({ type: 'png' })
            ]);
            
            // Calculate preliminary DH (will be refined with DR/DA data)
            const relevance = this.calculateCategoryRelevance(contentCategories);
            const estimatedDH = this.estimateDH(relevance);
            const tier = this.getTier(estimatedDH);
            
            // Store screenshot
            const screenshotUrl = await this.uploadScreenshot(siteId, screenshot);
            
            // Update site record
            await supabase
                .from('press_sites')
                .update({
                    owner_email: ownerEmail,
                    dh_score: estimatedDH,
                    tier,
                    relevance_score: relevance,
                    status: estimatedDH >= MIN_DH_THRESHOLD ? 'pending' : 'rejected',
                    last_crawl_at: new Date().toISOString()
                })
                .eq('id', siteId);
            
            // Create verification record
            await supabase
                .from('press_verifications')
                .insert({
                    site_id: siteId,
                    verification_type: 'site',
                    result: estimatedDH >= MIN_DH_THRESHOLD ? 'passed' : 'failed',
                    confidence: 0.7,
                    screenshot_url: screenshotUrl,
                    logs: { contentCategories, techStack, warnings }
                });
            
            return {
                siteId,
                domain,
                verified: estimatedDH >= MIN_DH_THRESHOLD,
                dhScore: estimatedDH,
                tier,
                ownerEmail,
                contentCategories,
                techStack,
                warnings,
                screenshotUrl
            };
            
        } catch (error: any) {
            warnings.push(`Verification error: ${error.message}`);
            
            await supabase
                .from('press_sites')
                .update({
                    status: 'rejected',
                    last_crawl_at: new Date().toISOString()
                })
                .eq('id', siteId);
            
            return {
                siteId,
                domain,
                verified: false,
                dhScore: 0,
                tier: 'reject',
                contentCategories: [],
                techStack: [],
                warnings
            };
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
    
    /**
     * Analyze page content for categories
     */
    private async analyzeContent(page: Page): Promise<string[]> {
        const categories: string[] = [];
        
        try {
            // Get page text content
            const textContent = await page.evaluate(() => {
                const getText = (selector: string) => {
                    const elements = document.querySelectorAll(selector);
                    return Array.from(elements).map(el => el.textContent || '').join(' ');
                };
                
                return [
                    document.title,
                    getText('h1, h2, h3'),
                    getText('meta[name="description"]'),
                    getText('meta[name="keywords"]'),
                    getText('p').substring(0, 2000)
                ].join(' ').toLowerCase();
            });
            
            // Check for category keywords
            for (const category of TARGET_CATEGORIES) {
                if (textContent.includes(category)) {
                    categories.push(category);
                }
            }
            
            // Check for crypto-specific indicators
            const cryptoIndicators = ['bitcoin', 'ethereum', 'btc', 'eth', 'defi', 'nft', 'token'];
            for (const indicator of cryptoIndicators) {
                if (textContent.includes(indicator) && !categories.includes('crypto')) {
                    categories.push('crypto');
                    break;
                }
            }
        } catch (error) {
            console.error('Content analysis error:', error);
        }
        
        return categories;
    }
    
    /**
     * Detect website tech stack
     */
    private async detectTechStack(page: Page): Promise<string[]> {
        const stack: string[] = [];
        
        try {
            const detected = await page.evaluate(() => {
                const detected: string[] = [];
                
                // Check for common frameworks
                if ((window as any).React) detected.push('React');
                if ((window as any).Vue) detected.push('Vue');
                if ((window as any).angular) detected.push('Angular');
                if ((window as any).jQuery) detected.push('jQuery');
                if ((window as any).wp) detected.push('WordPress');
                
                // Check meta generator
                const generator = document.querySelector('meta[name="generator"]');
                if (generator) {
                    const content = generator.getAttribute('content') || '';
                    if (content.includes('WordPress')) detected.push('WordPress');
                    if (content.includes('Drupal')) detected.push('Drupal');
                    if (content.includes('Joomla')) detected.push('Joomla');
                }
                
                return detected;
            });
            
            stack.push(...detected);
        } catch (error) {
            console.error('Tech stack detection error:', error);
        }
        
        return [...new Set(stack)];
    }
    
    /**
     * Find owner/contact email
     */
    private async findOwnerEmail(page: Page, domain: string): Promise<string | undefined> {
        try {
            // Try to find email on page
            const emails = await page.evaluate(() => {
                const text = document.body.innerText;
                const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
                return text.match(emailRegex) || [];
            });
            
            // Filter for domain emails or common patterns
            const relevantEmails = emails.filter(email => 
                email.includes(domain.split('.')[0]) ||
                email.startsWith('info@') ||
                email.startsWith('contact@') ||
                email.startsWith('admin@') ||
                email.startsWith('editor@') ||
                email.startsWith('press@')
            );
            
            return relevantEmails[0];
        } catch (error) {
            console.error('Email extraction error:', error);
            return undefined;
        }
    }
    
    /**
     * Calculate category relevance
     */
    private calculateCategoryRelevance(categories: string[]): number {
        const targetSet = new Set(TARGET_CATEGORIES);
        const matches = categories.filter(c => targetSet.has(c)).length;
        
        if (matches === 0) return 0.1;
        if (matches === 1) return 0.3;
        if (matches === 2) return 0.5;
        if (matches >= 3) return 0.8;
        return 0.5;
    }
    
    /**
     * Estimate DH score (preliminary, without external DR/DA data)
     */
    private estimateDH(relevance: number): number {
        // Base estimate - will be refined with actual DR/DA data
        const baseEstimate = 45; // Assume average site
        return Math.round(baseEstimate * relevance * 100) / 100;
    }
    
    /**
     * Get tier from DH score
     */
    private getTier(dhScore: number): string {
        if (dhScore < 20) return 'reject';
        if (dhScore < 40) return 'bronze';
        if (dhScore < 60) return 'silver';
        if (dhScore < 80) return 'gold';
        return 'platinum';
    }
    
    /**
     * Upload screenshot to storage
     */
    private async uploadScreenshot(siteId: string, screenshot: Buffer): Promise<string> {
        try {
            const filename = `screenshots/${siteId}/${Date.now()}.png`;
            
            const { data, error } = await supabase.storage
                .from('press-assets')
                .upload(filename, screenshot, {
                    contentType: 'image/png'
                });
            
            if (error) throw error;
            
            const { data: urlData } = supabase.storage
                .from('press-assets')
                .getPublicUrl(filename);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error('Screenshot upload error:', error);
            return '';
        }
    }
    
    /**
     * Get or create site record
     */
    private async getOrCreateSite(domain: string): Promise<string> {
        const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
        
        const { data: existing } = await supabase
            .from('press_sites')
            .select('id')
            .eq('domain', normalizedDomain)
            .single();
        
        if (existing) {
            return existing.id;
        }
        
        const { data: created, error } = await supabase
            .from('press_sites')
            .insert({
                domain: normalizedDomain,
                status: 'pitched'
            })
            .select('id')
            .single();
        
        if (error) throw error;
        return created.id;
    }
    
    /**
     * Send pitch email to site owner
     */
    async sendPitchEmail(siteId: string): Promise<boolean> {
        const { data: site } = await supabase
            .from('press_sites')
            .select('*')
            .eq('id', siteId)
            .single();
        
        if (!site || !site.owner_email) {
            console.log(`[VerificationAgent] No email for site ${siteId}`);
            return false;
        }
        
        // TODO: Integrate with email service (SendGrid, etc.)
        const emailContent = this.generatePitchEmail(site);
        
        console.log(`[VerificationAgent] Would send pitch to ${site.owner_email}`);
        console.log(emailContent);
        
        // Update pitch sent timestamp
        await supabase
            .from('press_sites')
            .update({ pitch_sent_at: new Date().toISOString() })
            .eq('id', siteId);
        
        return true;
    }
    
    /**
     * Generate pitch email content
     */
    private generatePitchEmail(site: any): string {
        return `
Subject: Earn Revenue from Your Website with SENDPRESS by Coindaily

Hi ${site.owner_name || 'Site Owner'},

We've analyzed ${site.domain} and believe it would be a great fit for our SENDPRESS PR distribution network.

What is SENDPRESS?
SENDPRESS by Coindaily is Africa's largest automated PR distribution platform connecting crypto/finance publishers with quality websites like yours.

Benefits for You:
✅ Earn JOY tokens for each PR placement
✅ Free SDK installation - no technical expertise needed
✅ Choose which PRs to display
✅ Your site scored ${site.dh_score}/100 (${site.tier} tier)

Estimated Earnings:
Based on your Domain Height score, you could earn $${this.getEstimatedEarnings(site.tier)}/month passively.

Get Started:
Visit https://press.coindaily.online/signup?ref=${site.id}

Questions? Reply to this email or visit our FAQ at https://press.coindaily.online/faq

Best regards,
The SENDPRESS Team
Coindaily
        `.trim();
    }
    
    private getEstimatedEarnings(tier: string): string {
        switch (tier) {
            case 'platinum': return '500-2000';
            case 'gold': return '200-500';
            case 'silver': return '50-200';
            case 'bronze': return '20-50';
            default: return '0';
        }
    }
    
    /**
     * Run verification batch job
     */
    async runBatch(domains: string[]): Promise<VerificationResult[]> {
        const results: VerificationResult[] = [];
        
        for (const domain of domains) {
            try {
                const result = await this.verifySite(domain);
                results.push(result);
                
                // If verified and has email, send pitch
                if (result.verified && result.ownerEmail) {
                    await this.sendPitchEmail(result.siteId);
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to verify ${domain}:`, error);
            }
        }
        
        return results;
    }
}

export const verificationAgent = new VerificationAgent();
export default verificationAgent;
