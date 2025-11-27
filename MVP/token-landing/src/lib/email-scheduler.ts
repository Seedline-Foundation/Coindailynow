/**
 * Email Scheduler Service
 * Handles scheduling and sending of email sequences with dynamic delays
 */

import { Resend } from 'resend';
import { EmailSequenceConfig } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ScheduleEmailParams {
  subscriberId: string;
  email: string;
  emailType: string;
  emailSequence: number;
  subject: string;
  html: string;
  scheduledFor: Date;
}

export interface EmailSequenceDefinition {
  sequence: number;
  type: string;
  subject: string;
  delayHours: number; // Hours after previous email
}

/**
 * Complete 9-day email sequence configuration
 */
export const EMAIL_SEQUENCE: EmailSequenceDefinition[] = [
  // Day 0 is handled separately (welcome email sent immediately after verification)
  
  {
    sequence: 1,
    type: 'day_1_coindaily_mission',
    subject: 'Welcome to CoinDaily - Africa\'s Premier Crypto News Platform',
    delayHours: 24 // 1 day after welcome
  },
  {
    sequence: 2,
    type: 'day_2_why_joy_token',
    subject: 'Why Joy Token? 5 Reasons You Can\'t Ignore',
    delayHours: 24 // 1 day after day 1
  },
  {
    sequence: 3,
    type: 'day_3_fomo',
    subject: '⚠️ Joy Token: Miss This, Regret Forever',
    delayHours: 24 // 1 day after day 2
  },
  {
    sequence: 4,
    type: 'day_4_tokenomics',
    subject: '💎 Joy Token Tokenomics: Your Path to Wealth',
    delayHours: 24 // 1 day after day 3
  },
  {
    sequence: 5,
    type: 'day_5_presale_walkthrough',
    subject: '📝 How to Participate in Joy Token Presale (Step-by-Step)',
    delayHours: 24 // 1 day after day 4
  },
  {
    sequence: 6,
    type: 'day_6_community_power',
    subject: '💪 Join the Joy Token Community - Where Wealth is Built',
    delayHours: 24 // 1 day after day 5
  },
  {
    sequence: 7,
    type: 'day_7_final_countdown',
    subject: '⏰ Final Countdown: Presale Launching Soon!',
    delayHours: 24 // 1 day after day 6
  },
  {
    sequence: 8,
    type: 'day_8_testimonials',
    subject: '🌟 Real People, Real Results: Joy Token Early Believers',
    delayHours: 24 // 1 day after day 7
  },
  {
    sequence: 9,
    type: 'day_9_careers',
    subject: '💼 Join CoinDaily\'s Team or Win 100 $JY for Referrals!',
    delayHours: 24 // 1 day after day 8
  }
];

/**
 * Schedule the complete email sequence for a subscriber
 */
export async function scheduleEmailSequence(
  subscriberId: string,
  email: string,
  baseTime: Date = new Date()
): Promise<{scheduled: number, errors: any[]}> {
  const scheduled: any[] = [];
  const errors: any[] = [];

  for (const emailDef of EMAIL_SEQUENCE) {
    try {
      // Calculate scheduled time
      const totalHours = EMAIL_SEQUENCE
        .filter(e => e.sequence <= emailDef.sequence)
        .reduce((sum, e) => sum + e.delayHours, 0);
      
      const scheduledFor = new Date(baseTime.getTime() + totalHours * 60 * 60 * 1000);

      // Create scheduled email record in database
      // This will be processed by a background worker
      const scheduledEmail = {
        subscriberId,
        email,
        emailType: emailDef.type,
        emailSequence: emailDef.sequence,
        subject: emailDef.subject,
        scheduledFor,
        status: 'PENDING'
      };

      scheduled.push(scheduledEmail);
      
      console.log(`Scheduled ${emailDef.type} for ${scheduledFor.toISOString()}`);
    } catch (error) {
      console.error(`Error scheduling ${emailDef.type}:`, error);
      errors.push({ type: emailDef.type, error });
    }
  }

  return { scheduled: scheduled.length, errors };
}

/**
 * Send an email using Resend with scheduling
 */
export async function sendScheduledEmail(params: {
  to: string;
  from?: string;
  subject: string;
  html: string;
  scheduledAt?: string; // 'in 1 hour', '2024-12-25 10:00', etc.
}): Promise<{ success: boolean; emailId?: string; error?: any }> {
  try {
    const response = await resend.emails.send({
      from: params.from || 'Joy Token Team <noreply@coindaily.online>',
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.scheduledAt && { scheduledAt: params.scheduledAt })
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, emailId: response.data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

/**
 * Convert Date to Resend scheduledAt format
 */
export function formatScheduledAt(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  
  if (diffMs < 0) {
    throw new Error('Cannot schedule email in the past');
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Use relative time for short delays
  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
  }

  // For longer delays, use ISO format
  return date.toISOString();
}

/**
 * Process pending scheduled emails (to be called by cron job)
 */
export async function processPendingEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const { prisma } = await import('@/lib/prisma');
  
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let failed = 0;

  try {
    // Get all pending emails that should be sent now
    const pendingEmails = await prisma.scheduledEmail.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        subscriber: true
      },
      take: 100 // Process 100 at a time
    });

    console.log(`[Email Cron] Found ${pendingEmails.length} pending emails to send`);

    for (const scheduledEmail of pendingEmails) {
      processed++;
      
      try {
        // Get the email template HTML
        const emailHtml = getSequenceEmailTemplate(scheduledEmail.emailType, {
          name: 'Crypto Enthusiast' // EmailSubscriber doesn't have a name field
        });

        // Send via Resend
        const response = await resend.emails.send({
          from: 'Joy Token Team <noreply@coindaily.online>',
          to: scheduledEmail.subscriber.email,
          subject: scheduledEmail.subject,
          html: emailHtml
        });

        if (response.error) {
          console.error(`[Email Cron] Failed to send ${scheduledEmail.emailType} to ${scheduledEmail.subscriber.email}:`, response.error);
          
          // Update status to failed
          await prisma.scheduledEmail.update({
            where: { id: scheduledEmail.id },
            data: { 
              status: 'FAILED',
              error: JSON.stringify(response.error)
            }
          });
          failed++;
        } else {
          console.log(`[Email Cron] Sent ${scheduledEmail.emailType} to ${scheduledEmail.subscriber.email}`);
          
          // Update status to sent
          await prisma.scheduledEmail.update({
            where: { id: scheduledEmail.id },
            data: { 
              status: 'SENT',
              sentAt: new Date(),
              resendEmailId: response.data?.id
            }
          });
          sent++;
        }
      } catch (error: any) {
        console.error(`[Email Cron] Error sending ${scheduledEmail.emailType}:`, error);
        
        // Update status to failed
        await prisma.scheduledEmail.update({
          where: { id: scheduledEmail.id },
          data: { 
            status: 'FAILED',
            error: error.message
          }
        });
        failed++;
      }
    }

    console.log(`[Email Cron] Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`);
  } catch (error) {
    console.error('[Email Cron] Error processing pending emails:', error);
  }
  
  return {
    processed,
    sent,
    failed
  };
}

/**
 * Calculate next email send time based on previous email
 */
export function getNextEmailTime(
  previousEmailTime: Date,
  nextSequence: number
): Date {
  const emailDef = EMAIL_SEQUENCE.find(e => e.sequence === nextSequence);
  
  if (!emailDef) {
    throw new Error(`Email sequence ${nextSequence} not found`);
  }

  return new Date(previousEmailTime.getTime() + emailDef.delayHours * 60 * 60 * 1000);
}

/**
 * Get email template HTML for sequence emails (Day 1-9)
 */
function getSequenceEmailTemplate(emailType: string, params: { name: string }): string {
  const { name } = params;
  
  // Base styles for all emails
  const baseStyles = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000 !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none; }
        ul { padding-left: 20px; }
        li { margin: 10px 0; }
        h1 { margin: 0; }
        h2 { color: #333; }
        h3 { color: #555; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #FFA500; margin: 15px 0; }
      </style>
    </head>
    <body>
  `;
  
  const footer = `
      <div class="footer">
        <p>© 2025 CoinDaily. Africa's Premier Crypto News Platform.</p>
        <p>You're receiving this because you signed up for Joy Token updates.</p>
      </div>
    </body>
    </html>
  `;
  
  switch (emailType) {
    case 'day_1_coindaily_mission':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to CoinDaily!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Welcome to <strong>CoinDaily</strong> - Africa's leading cryptocurrency and memecoin news platform!</p>
            
            <h3>Our Mission:</h3>
            <p>We're building the most trusted source for crypto news across Africa, covering everything from Bitcoin to the hottest memecoins.</p>
            
            <h3>What Makes Us Different:</h3>
            <ul>
              <li>🌍 <strong>Africa-First Coverage:</strong> News tailored for African crypto enthusiasts</li>
              <li>⚡ <strong>Real-Time Updates:</strong> Stay ahead of the market</li>
              <li>🎯 <strong>Memecoin Focus:</strong> Track the next 100x opportunities</li>
              <li>💎 <strong>Community Driven:</strong> Join thousands of crypto believers</li>
            </ul>
            
            <p>And we're launching something HUGE: <strong>Joy Token ($JY)</strong> - our native token that will power the entire CoinDaily ecosystem!</p>
            
            <center><a href="https://token.coindaily.online" class="cta-button">Learn About Joy Token →</a></center>
            
            <p>Tomorrow, I'll tell you exactly why Joy Token could be the opportunity of the year.</p>
            
            <p>Stay tuned! 🔥</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_2_why_joy_token':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💎 Why Joy Token?</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Yesterday I introduced you to CoinDaily. Today, let me tell you about <strong>Joy Token ($JY)</strong> - and why you can't afford to miss this.</p>
            
            <h3>5 Reasons Joy Token is Different:</h3>
            
            <h4>1. 🌍 Built for Africa</h4>
            <p>We're not another global crypto project. Joy Token is designed specifically for African crypto enthusiasts, with features that matter to YOU.</p>
            
            <h4>2. 📰 Real Utility</h4>
            <p>$JY isn't just a token - it powers CoinDaily's entire ecosystem:</p>
            <ul>
              <li>Access premium crypto analysis and news</li>
              <li>Unlock exclusive memecoin alerts</li>
              <li>Vote on platform features</li>
              <li>Earn rewards for community contributions</li>
            </ul>
            
            <h4>3. 💰 Presale Advantage</h4>
            <p>Get in BEFORE the public launch at presale prices. Early believers get the best deals.</p>
            
            <h4>4. 🚀 Growth Potential</h4>
            <p>With Africa's crypto market exploding and CoinDaily growing daily, $JY holders are positioned for serious gains.</p>
            
            <h4>5. 👥 Community Power</h4>
            <p>Join a movement of African crypto believers building wealth together.</p>
            
            <center><a href="https://token.coindaily.online" class="cta-button">Explore Joy Token →</a></center>
            
            <p>Tomorrow: I'll share why missing this could be your biggest regret. No exaggeration.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_3_fomo':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>⚠️ Miss This, Regret Forever</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Let me be brutally honest with you...</p>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 18px;"><strong>Every crypto millionaire has ONE thing in common:</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold;">They got in EARLY.</p>
            </div>
            
            <h3>Remember These?</h3>
            <ul>
              <li>💎 Bitcoin at $1 → Now $60,000+</li>
              <li>💎 Ethereum at $10 → Now $3,000+</li>
              <li>💎 Dogecoin at $0.0001 → Hit $0.70</li>
              <li>💎 Shiba Inu early believers → 1000x returns</li>
            </ul>
            
            <p><strong>The pattern is clear:</strong> Early adopters win BIG. Latecomers watch from the sidelines.</p>
            
            <h3>Joy Token is YOUR Early Opportunity</h3>
            <p>Right now, $JY is in presale. You're getting in before:</p>
            <ul>
              <li>❌ Public launch</li>
              <li>❌ Exchange listings</li>
              <li>❌ Mainstream adoption</li>
              <li>❌ Price explosion</li>
            </ul>
            
            <div class="highlight">
              <strong>⚡ This window won't stay open forever.</strong><br>
              Presale slots are limited. When they're gone, they're GONE.
            </div>
            
            <center><a href="https://token.coindaily.online" class="cta-button">Secure Your Position →</a></center>
            
            <p>Tomorrow: I'll break down the tokenomics and show you EXACTLY how $JY can grow your wealth.</p>
            
            <p>Don't say I didn't warn you.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    // Placeholder templates for remaining days
    case 'day_4_tokenomics':
    case 'day_5_presale_walkthrough':
    case 'day_6_community_power':
    case 'day_7_final_countdown':
    case 'day_8_testimonials':
    case 'day_9_careers':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💎 Joy Token Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Important update about the Joy Token presale...</p>
            <center><a href="https://token.coindaily.online" class="cta-button">Join the Presale →</a></center>
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    default:
      return `<p>Email content for ${emailType}</p>`;
  }
}
