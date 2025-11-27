import { NextResponse } from 'next/server';
import { processPendingEmails } from '@/lib/email-scheduler';

/**
 * Cron job endpoint to process and send scheduled emails
 * Should be called every hour by a cron service (cron-job.org, PM2 cron, etc.)
 * 
 * Security: In production, protect this with a secret token
 */
export async function GET(request: Request) {
  try {
    // Optional: Verify cron secret token for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Cron] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting email processing job...');
    
    // Process pending emails
    const result = await processPendingEmails();
    
    console.log(`[Cron] Job complete: ${result.processed} processed, ${result.sent} sent, ${result.failed} failed`);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error: any) {
    console.error('[Cron] Job failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request);
}
