import { chromium, Browser, Page } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
);

interface QueuedSite {
    id: string;
    domain: string;
    status: string;
}

export class Crawler {
    private browser: Browser | null = null;
    private isRunning: boolean = false;

    async init() {
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox']
        });
        console.log('[Crawler] Initialized');
    }

    async start() {
        if (!this.browser) await this.init();
        this.isRunning = true;
        this.processQueue();
    }

    async stop() {
        this.isRunning = false;
        if (this.browser) {
            await this.browser.close();
        }
    }

    private async processQueue() {
        while (this.isRunning) {
            try {
                // Fetch next site from queue
                const { data, error } = await supabase
                    .from('press_sites')
                    .select('id, domain, status')
                    .eq('status', 'queued')
                    .limit(1)
                    .single();

                if (error || !data) {
                    // No work, sleep
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }

                await this.crawlSite(data as QueuedSite);
                
            } catch (err) {
                console.error('Queue processing error:', err);
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    private async crawlSite(site: QueuedSite) {
        console.log(`[Crawler] Processing ${site.domain}`);
        const page = await this.browser?.newPage();
        
        if (!page) return;

        try {
            await page.goto(`https://${site.domain}`, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });

            // Extract metadata
            const title = await page.title();
            const description = await page.$eval('meta[name="description"]', (el: Element) => el.getAttribute('content')).catch(() => '');
            
            // Analyze content (simplified)
            const content = await page.content();
            const hasCrypto = /crypto|bitcoin|eth|blockchain/i.test(content);

            // Update DB
            await supabase.from('press_sites').update({
                status: 'crawled',
                title,
                description,
                categories: hasCrypto ? ['crypto'] : [],
                last_crawl_at: new Date().toISOString()
            }).eq('id', site.id);

            console.log(`[Crawler] Completed ${site.domain}`);

        } catch (error: any) {
            console.error(`[Crawler] Failed ${site.domain}: ${error.message}`);
            await supabase.from('press_sites').update({
                status: 'failed',
                error_log: error.message
            }).eq('id', site.id);
        } finally {
            await page.close();
        }
    }
}

// Start if run directly
if (require.main === module) {
    const crawler = new Crawler();
    crawler.start().catch(console.error);
}
