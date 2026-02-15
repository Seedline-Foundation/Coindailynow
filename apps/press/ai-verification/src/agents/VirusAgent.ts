/**
 * SENDPRESS Virus/Security Agent
 * 24/7/365 monitoring of partner website security
 * 
 * Responsibilities:
 * - Monitor tech stack for outdated/vulnerable packages
 * - Detect potential security threats
 * - Classify threat levels (no_threat, moderate, high, very_high)
 * - Suspend sites with critical vulnerabilities
 */

import { createClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

// Threat level definitions
export const THREAT_LEVELS = {
    NO_THREAT: 'no_threat',
    MODERATE: 'moderate',      // Issues exist but no self-distribution capability
    HIGH: 'high',              // Significant vulnerabilities
    VERY_HIGH: 'very_high'     // Critical, immediate action required
} as const;

export type ThreatLevel = typeof THREAT_LEVELS[keyof typeof THREAT_LEVELS];

export interface SecurityScanResult {
    siteId: string;
    domain: string;
    threatLevel: ThreatLevel;
    issues: SecurityIssue[];
    techStack: TechStackInfo[];
    recommendation: 'approve' | 'warn' | 'suspend';
    scannedAt: string;
}

export interface SecurityIssue {
    type: 'outdated_software' | 'vulnerable_library' | 'malware' | 'ssl_issue' | 'mixed_content' | 'suspicious_script';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details?: any;
}

export interface TechStackInfo {
    name: string;
    version?: string;
    category: string;
    vulnerabilities?: string[];
    outdated?: boolean;
}

// Known vulnerable library patterns
const VULNERABLE_PATTERNS = [
    { pattern: /jquery[.-]?(\d+)\.(\d+)\.(\d+)/i, name: 'jQuery', minSafe: '3.5.0' },
    { pattern: /angular[.-]?(\d+)\.(\d+)\.(\d+)/i, name: 'Angular', minSafe: '14.0.0' },
    { pattern: /react[.-]?(\d+)\.(\d+)\.(\d+)/i, name: 'React', minSafe: '17.0.0' },
    { pattern: /bootstrap[.-]?(\d+)\.(\d+)\.(\d+)/i, name: 'Bootstrap', minSafe: '5.0.0' },
];

// Suspicious script patterns (simplified - production would use more comprehensive list)
const SUSPICIOUS_PATTERNS = [
    /eval\s*\(/,
    /document\.write\s*\(/,
    /fromCharCode/,
    /atob\s*\(/,
    /\\x[0-9a-f]{2}/i,
    /crypto\s*mining/i,
    /coinhive/i,
];

class VirusAgent {
    private browser: Browser | null = null;
    private scanInterval: NodeJS.Timeout | null = null;
    
    async init(): Promise<void> {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('[VirusAgent] Initialized');
    }
    
    async close(): Promise<void> {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    
    /**
     * Start continuous security scanning
     */
    startContinuousScanning(intervalHours: number = 24): void {
        console.log(`[VirusAgent] Starting continuous scanning (every ${intervalHours} hours)`);
        
        // Run immediately
        this.runScanCycle();
        
        // Schedule periodic runs
        this.scanInterval = setInterval(
            () => this.runScanCycle(),
            intervalHours * 60 * 60 * 1000
        );
    }
    
    /**
     * Run a full security scan cycle
     */
    async runScanCycle(): Promise<void> {
        console.log('[VirusAgent] Starting security scan cycle');
        
        try {
            // Get all verified sites that haven't been scanned recently
            const { data: sites } = await supabase
                .from('press_sites')
                .select('*')
                .eq('status', 'verified')
                .or(`last_crawl_at.is.null,last_crawl_at.lt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`);
            
            if (!sites || sites.length === 0) {
                console.log('[VirusAgent] No sites to scan');
                return;
            }
            
            console.log(`[VirusAgent] Scanning ${sites.length} sites`);
            
            for (const site of sites) {
                await this.scanSite(site.id, site.domain);
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            console.log('[VirusAgent] Security scan cycle complete');
        } catch (error) {
            console.error('[VirusAgent] Scan cycle error:', error);
        }
    }
    
    /**
     * Scan a single site for security issues
     */
    async scanSite(siteId: string, domain: string): Promise<SecurityScanResult> {
        const issues: SecurityIssue[] = [];
        const techStack: TechStackInfo[] = [];
        let page: Page | null = null;
        
        try {
            if (!this.browser) {
                await this.init();
            }
            
            page = await this.browser!.newPage();
            await page.setDefaultTimeout(30000);
            
            // Check SSL
            const sslIssues = await this.checkSSL(domain);
            issues.push(...sslIssues);
            
            // Navigate to site
            const response = await page.goto(`https://${domain}`, {
                waitUntil: 'domcontentloaded'
            });
            
            if (!response) {
                issues.push({
                    type: 'ssl_issue',
                    severity: 'critical',
                    description: 'Site is unreachable'
                });
            } else {
                // Check for mixed content
                const mixedContentIssues = await this.checkMixedContent(page);
                issues.push(...mixedContentIssues);
                
                // Detect tech stack and vulnerabilities
                const stackInfo = await this.detectTechStack(page);
                techStack.push(...stackInfo);
                
                // Check for suspicious scripts
                const scriptIssues = await this.checkSuspiciousScripts(page);
                issues.push(...scriptIssues);
                
                // Check outdated software
                const outdatedIssues = this.checkOutdatedSoftware(stackInfo);
                issues.push(...outdatedIssues);
            }
            
            // Calculate threat level
            const threatLevel = this.calculateThreatLevel(issues);
            const recommendation = this.getRecommendation(threatLevel);
            
            const result: SecurityScanResult = {
                siteId,
                domain,
                threatLevel,
                issues,
                techStack,
                recommendation,
                scannedAt: new Date().toISOString()
            };
            
            // Update site record
            await supabase
                .from('press_sites')
                .update({
                    threat_level: threatLevel,
                    last_crawl_at: new Date().toISOString()
                })
                .eq('id', siteId);
            
            // Create verification record
            await supabase
                .from('press_verifications')
                .insert({
                    site_id: siteId,
                    verification_type: 'security',
                    result: recommendation === 'suspend' ? 'failed' : recommendation === 'warn' ? 'warning' : 'passed',
                    confidence: 0.85,
                    logs: { issues, techStack, threatLevel }
                });
            
            // Handle critical threats
            if (recommendation === 'suspend') {
                await this.handleCriticalThreat(siteId, domain, issues);
            } else if (recommendation === 'warn') {
                await this.notifySiteOwner(siteId, issues);
            }
            
            console.log(`[VirusAgent] Scanned ${domain}: ${threatLevel} (${issues.length} issues)`);
            return result;
            
        } catch (error: any) {
            const result: SecurityScanResult = {
                siteId,
                domain,
                threatLevel: 'moderate',
                issues: [{
                    type: 'ssl_issue',
                    severity: 'medium',
                    description: `Scan error: ${error.message}`
                }],
                techStack: [],
                recommendation: 'warn',
                scannedAt: new Date().toISOString()
            };
            
            return result;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }
    
    /**
     * Check SSL certificate
     */
    private async checkSSL(domain: string): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        
        try {
            // Basic SSL check via HTTPS fetch
            const response = await fetch(`https://${domain}`, { method: 'HEAD' });
            
            if (!response.ok) {
                issues.push({
                    type: 'ssl_issue',
                    severity: 'high',
                    description: 'HTTPS connection failed'
                });
            }
        } catch (error: any) {
            if (error.message.includes('certificate')) {
                issues.push({
                    type: 'ssl_issue',
                    severity: 'critical',
                    description: 'Invalid SSL certificate'
                });
            }
        }
        
        return issues;
    }
    
    /**
     * Check for mixed content (HTTP resources on HTTPS page)
     */
    private async checkMixedContent(page: Page): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        
        const mixedContent = await page.evaluate(() => {
            const httpResources: string[] = [];
            
            // Check images
            document.querySelectorAll('img[src^="http:"]').forEach(img => {
                httpResources.push((img as HTMLImageElement).src);
            });
            
            // Check scripts
            document.querySelectorAll('script[src^="http:"]').forEach(script => {
                httpResources.push((script as HTMLScriptElement).src);
            });
            
            // Check stylesheets
            document.querySelectorAll('link[href^="http:"]').forEach(link => {
                httpResources.push((link as HTMLLinkElement).href);
            });
            
            return httpResources;
        });
        
        if (mixedContent.length > 0) {
            issues.push({
                type: 'mixed_content',
                severity: 'medium',
                description: `Found ${mixedContent.length} HTTP resources on HTTPS page`,
                details: mixedContent.slice(0, 10)
            });
        }
        
        return issues;
    }
    
    /**
     * Detect tech stack and versions
     */
    private async detectTechStack(page: Page): Promise<TechStackInfo[]> {
        const stack: TechStackInfo[] = [];
        
        try {
            const detected = await page.evaluate(() => {
                const results: Array<{ name: string; version?: string; category: string }> = [];
                
                // Detect frameworks
                if ((window as any).React) {
                    results.push({ name: 'React', version: (window as any).React.version, category: 'frontend' });
                }
                if ((window as any).Vue) {
                    results.push({ name: 'Vue', version: (window as any).Vue.version, category: 'frontend' });
                }
                if ((window as any).angular) {
                    results.push({ name: 'Angular', category: 'frontend' });
                }
                if ((window as any).jQuery) {
                    results.push({ name: 'jQuery', version: (window as any).jQuery.fn.jquery, category: 'library' });
                }
                
                // Check for WordPress
                const wpMeta = document.querySelector('meta[name="generator"][content*="WordPress"]');
                if (wpMeta) {
                    const content = wpMeta.getAttribute('content') || '';
                    const match = content.match(/WordPress\s*([\d.]+)?/);
                    results.push({ name: 'WordPress', version: match?.[1], category: 'cms' });
                }
                
                return results;
            });
            
            stack.push(...detected);
        } catch (error) {
            console.error('Tech stack detection error:', error);
        }
        
        return stack;
    }
    
    /**
     * Check for suspicious scripts
     */
    private async checkSuspiciousScripts(page: Page): Promise<SecurityIssue[]> {
        const issues: SecurityIssue[] = [];
        
        try {
            const scripts = await page.evaluate(() => {
                const inlineScripts: string[] = [];
                document.querySelectorAll('script:not([src])').forEach(script => {
                    inlineScripts.push(script.textContent || '');
                });
                return inlineScripts;
            });
            
            for (const script of scripts) {
                for (const pattern of SUSPICIOUS_PATTERNS) {
                    if (pattern.test(script)) {
                        issues.push({
                            type: 'suspicious_script',
                            severity: 'high',
                            description: 'Detected potentially malicious script pattern',
                            details: { pattern: pattern.toString() }
                        });
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Script check error:', error);
        }
        
        return issues;
    }
    
    /**
     * Check for outdated software versions
     */
    private checkOutdatedSoftware(techStack: TechStackInfo[]): SecurityIssue[] {
        const issues: SecurityIssue[] = [];
        
        for (const tech of techStack) {
            if (!tech.version) continue;
            
            for (const vuln of VULNERABLE_PATTERNS) {
                if (tech.name.toLowerCase() === vuln.name.toLowerCase()) {
                    if (this.isVersionLower(tech.version, vuln.minSafe)) {
                        issues.push({
                            type: 'outdated_software',
                            severity: 'high',
                            description: `${tech.name} ${tech.version} is outdated (minimum safe: ${vuln.minSafe})`,
                            details: { current: tech.version, minSafe: vuln.minSafe }
                        });
                        tech.outdated = true;
                    }
                }
            }
        }
        
        return issues;
    }
    
    /**
     * Compare version strings
     */
    private isVersionLower(current: string, minimum: string): boolean {
        const currentParts = current.split('.').map(Number);
        const minimumParts = minimum.split('.').map(Number);
        
        for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
            const c = currentParts[i] || 0;
            const m = minimumParts[i] || 0;
            
            if (c < m) return true;
            if (c > m) return false;
        }
        
        return false;
    }
    
    /**
     * Calculate overall threat level
     */
    private calculateThreatLevel(issues: SecurityIssue[]): ThreatLevel {
        const criticalCount = issues.filter(i => i.severity === 'critical').length;
        const highCount = issues.filter(i => i.severity === 'high').length;
        const mediumCount = issues.filter(i => i.severity === 'medium').length;
        
        if (criticalCount > 0) return THREAT_LEVELS.VERY_HIGH;
        if (highCount >= 2) return THREAT_LEVELS.HIGH;
        if (highCount === 1 || mediumCount >= 3) return THREAT_LEVELS.MODERATE;
        return THREAT_LEVELS.NO_THREAT;
    }
    
    /**
     * Get recommendation based on threat level
     */
    private getRecommendation(threatLevel: ThreatLevel): 'approve' | 'warn' | 'suspend' {
        switch (threatLevel) {
            case THREAT_LEVELS.VERY_HIGH:
                return 'suspend';
            case THREAT_LEVELS.HIGH:
                return 'suspend';
            case THREAT_LEVELS.MODERATE:
                return 'warn';
            default:
                return 'approve';
        }
    }
    
    /**
     * Handle critical security threat
     */
    private async handleCriticalThreat(siteId: string, domain: string, issues: SecurityIssue[]): Promise<void> {
        // Suspend site
        await supabase
            .from('press_sites')
            .update({ status: 'suspended' })
            .eq('id', siteId);
        
        console.log(`[VirusAgent] SUSPENDED ${domain} due to critical threats`);
        
        // Notify site owner
        await this.notifySiteOwner(siteId, issues);
    }
    
    /**
     * Notify site owner of security issues
     */
    private async notifySiteOwner(siteId: string, issues: SecurityIssue[]): Promise<void> {
        const { data: site } = await supabase
            .from('press_sites')
            .select('owner_email, domain')
            .eq('id', siteId)
            .single();
        
        if (site?.owner_email) {
            console.log(`[VirusAgent] Would notify ${site.owner_email} about ${issues.length} security issues`);
            // TODO: Send security alert email
        }
    }
}

export const virusAgent = new VirusAgent();
export default virusAgent;
