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
      from: params.from || 'Joy Token Team <noreply@sygn.live>',
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
          from: 'Joy Token Team <noreply@sygn.live>',
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
              lastError: JSON.stringify(response.error),
              attempts: scheduledEmail.attempts + 1
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
            lastError: error.message,
            attempts: scheduledEmail.attempts + 1
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
            
            <center><a href="https://token.sygn.live" class="cta-button">Learn About Joy Token →</a></center>
            
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
            
            <center><a href="https://token.sygn.live" class="cta-button">Explore Joy Token →</a></center>
            
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
            
            <center><a href="https://token.sygn.live" class="cta-button">Secure Your Position →</a></center>
            
            <p>Tomorrow: I'll break down the tokenomics and show you EXACTLY how $JY can grow your wealth.</p>
            
            <p>Don't say I didn't warn you.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_4_tokenomics':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💎 Joy Token Tokenomics: Your Path to Wealth</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Numbers don't lie. Today, I'm showing you the exact tokenomics that make Joy Token a SMART investment.</p>
            
            <h3>The Numbers That Matter</h3>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>Total Supply:</strong> 1,000,000,000 $JY (1 Billion tokens)</p>
              <p style="margin: 5px 0 0 0;"><strong>Presale Price:</strong> $0.001 per token</p>
              <p style="margin: 5px 0 0 0;"><strong>Launch Price Target:</strong> $0.01+ per token</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #FFA500;">That's 10x potential for presale buyers!</p>
            </div>
            
            <h3>Token Allocation (Smart Distribution)</h3>
            <ul>
              <li>💰 <strong>40% Presale:</strong> Reserved for early believers like YOU</li>
              <li>🔒 <strong>20% Locked Liquidity:</strong> Ensures price stability and trust</li>
              <li>🎁 <strong>15% Community Rewards:</strong> Airdrops, staking, engagement bonuses</li>
              <li>👥 <strong>15% Team:</strong> Vested over 24 months (aligned with YOUR success)</li>
              <li>📈 <strong>10% Marketing & Growth:</strong> Expanding CoinDaily ecosystem</li>
            </ul>
            
            <h3>Why These Numbers Win</h3>
            <p>✅ <strong>Majority to presale buyers</strong> - You control the supply<br>
            ✅ <strong>Locked liquidity</strong> - No rug pulls, ever<br>
            ✅ <strong>Team vesting</strong> - We succeed when YOU succeed<br>
            ✅ <strong>Deflationary mechanics</strong> - Token burns increase scarcity</p>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 16px;"><strong>Real Math:</strong></p>
              <p style="margin: 5px 0;">If you invest $100 at presale ($0.001), you get 100,000 $JY</p>
              <p style="margin: 5px 0;">If launch price hits $0.01, your $100 becomes <strong>$1,000</strong></p>
              <p style="margin: 5px 0;">If it hits $0.10, your $100 becomes <strong>$10,000</strong></p>
            </div>
            
            <center><a href="https://token.sygn.live" class="cta-button">Secure Your Allocation →</a></center>
            
            <p>Tomorrow: Step-by-step guide on exactly how to participate in the presale.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_5_presale_walkthrough':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📝 How to Participate in Joy Token Presale</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>No confusion. No complicated steps. Here's your EXACT roadmap to securing Joy Token at presale prices.</p>
            
            <h3>Step-by-Step Presale Guide</h3>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
              <h4 style="margin: 0 0 10px 0;">🔹 Step 1: Create Your Wallet</h4>
              <p style="margin: 0;">Download MetaMask or Trust Wallet (free mobile apps or browser extensions)</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
              <h4 style="margin: 0 0 10px 0;">🔹 Step 2: Fund Your Wallet</h4>
              <p style="margin: 0;">Buy USDT, ETH, or BNB from any exchange (Binance, Luno, Quidax recommended for Africa)</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Tip: Start with as little as $10 to test the process!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
              <h4 style="margin: 0 0 10px 0;">🔹 Step 3: Connect to Joy Token Presale</h4>
              <p style="margin: 0;">Visit <a href="https://token.sygn.live" style="color: #FFA500; font-weight: bold;">token.sygn.live</a></p>
              <p style="margin: 5px 0 0 0;">Click "Connect Wallet" and select your wallet</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
              <h4 style="margin: 0 0 10px 0;">🔹 Step 4: Buy $JY Tokens</h4>
              <p style="margin: 0;">Enter the amount of USDT/ETH/BNB you want to spend</p>
              <p style="margin: 5px 0 0 0;">Confirm transaction in your wallet</p>
              <p style="margin: 5px 0 0 0; font-weight: bold; color: #FFA500;">🎉 Done! Your $JY tokens are yours!</p>
            </div>
            
            <h3>Important Reminders</h3>
            <ul>
              <li>🔐 Never share your wallet seed phrase with ANYONE</li>
              <li>💰 Minimum purchase: $10 worth of crypto</li>
              <li>⚡ Tokens delivered instantly to your wallet</li>
              <li>📊 Track your balance on the presale dashboard</li>
            </ul>
            
            <div class="highlight">
              <strong>⏰ Presale Bonus:</strong> First 1,000 buyers get 10% extra tokens!<br>
              Don't miss out on free money.
            </div>
            
            <center><a href="https://token.sygn.live" class="cta-button">Start Buying Now →</a></center>
            
            <p>Tomorrow: Meet the community that's building wealth together.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_6_community_power':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💪 Join the Joy Token Community</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Crypto isn't just about tokens. It's about PEOPLE. And the Joy Token community is where wealth is built together.</p>
            
            <h3>Why Community Matters</h3>
            <p>Look at every successful crypto project:</p>
            <ul>
              <li>🐕 <strong>Dogecoin:</strong> Community memes took it to $0.70</li>
              <li>🔥 <strong>Shiba Inu:</strong> ShibArmy drove 1000x gains</li>
              <li>🌙 <strong>SafeMoon:</strong> Community holders became millionaires</li>
            </ul>
            
            <p><strong>The pattern?</strong> Strong community = Strong price action.</p>
            
            <h3>What Makes Joy Token Community Special</h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">🌍 Africa-First Mindset</h4>
              <p style="margin: 0;">We're not just another global project. We understand African crypto challenges and opportunities.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">📰 CoinDaily Integration</h4>
              <p style="margin: 0;">Exclusive news, memecoin alerts, and market insights for $JY holders.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">🎁 Holder Rewards</h4>
              <p style="margin: 0;">Airdrops, staking bonuses, and voting rights on platform decisions.</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">💰 Referral Program</h4>
              <p style="margin: 0;">Earn 5% of every referral's purchase. Build your wealth by helping others.</p>
            </div>
            
            <h3>Join the Movement</h3>
            <p>Connect with thousands of African crypto enthusiasts:</p>
            <ul>
              <li>💬 <strong>Telegram:</strong> Daily updates, AMA sessions, market discussions</li>
              <li>🐦 <strong>Twitter/X:</strong> Latest news, memes, and community highlights</li>
              <li>📱 <strong>Discord:</strong> Deep dives, analysis, and direct team access</li>
            </ul>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Together, we're not just buying tokens.</p>
              <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">We're building generational wealth for Africa.</p>
            </div>
            
            <center><a href="https://token.sygn.live" class="cta-button">Become a Holder →</a></center>
            
            <p>Tomorrow: The final countdown begins. Presale launching soon!</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_7_final_countdown':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>⏰ Final Countdown: Presale Launching Soon!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>This is it. The moment we've been building toward.</p>
            
            <div class="highlight" style="background: #fff3cd; border-left: 4px solid #ff6b6b; padding: 20px;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #ff6b6b; text-align: center;">🚨 PRESALE LAUNCHING IN 48 HOURS 🚨</p>
            </div>
            
            <h3>What Happens Next</h3>
            
            <p><strong>📅 Launch Date:</strong> [INSERT EXACT DATE]<br>
            <strong>⏰ Launch Time:</strong> 12:00 PM GMT<br>
            <strong>💰 Starting Price:</strong> $0.001 per $JY<br>
            <strong>🎁 Early Bonus:</strong> 10% extra tokens for first 1,000 buyers</p>
            
            <h3>Why You Should Act FAST</h3>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>⚡ Limited Supply:</strong> Only 400 million tokens in presale</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">When they're gone, you'll pay higher prices on exchanges</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>📈 Price Tiers:</strong> Price increases every 50 million tokens sold</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Early buyers get the absolute best deal</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>🔥 FOMO is Real:</strong> Our community is 10,000+ strong and growing</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Presale could sell out in days, not months</p>
            </div>
            
            <h3>Your Pre-Launch Checklist</h3>
            <ul>
              <li>✅ Wallet ready (MetaMask or Trust Wallet)</li>
              <li>✅ Funds available (USDT, ETH, or BNB)</li>
              <li>✅ Bookmark <a href="https://token.sygn.live" style="color: #FFA500;">token.sygn.live</a></li>
              <li>✅ Join our Telegram for launch announcement</li>
              <li>✅ Set alarm for launch time</li>
            </ul>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 18px; text-align: center;"><strong>The next 48 hours will define your crypto future.</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 16px; text-align: center;">Will you be an early believer or a spectator?</p>
            </div>
            
            <center><a href="https://token.sygn.live" class="cta-button">Get Ready for Launch →</a></center>
            
            <p>Tomorrow: Real stories from early crypto believers who changed their lives.</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_8_testimonials':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🌟 Real People, Real Results</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Don't take my word for it. Listen to the people who got in early on crypto and never looked back.</p>
            
            <h3>Early Believer Stories</h3>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; font-style: italic;">"I invested $500 in Ethereum at $10. Everyone said I was crazy. Two years later, I cashed out $150,000. Best decision of my life."</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">— Michael K., Nigeria</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 0; font-style: italic;">"Shiba Inu presale changed everything. $100 became $30,000 in 6 months. Now I'm looking for the NEXT Shiba."</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">— Sarah T., Kenya</p>
            </div>
            
            <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
              <p style="margin: 0; font-style: italic;">"I bought Solana at $1.50 during their presale. Sold at $200. Used profits to quit my job and start my own business."</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">— David M., South Africa</p>
            </div>
            
            <h3>What These Stories Have in Common</h3>
            <p>✅ They got in EARLY<br>
            ✅ They believed in the project<br>
            ✅ They held through FUD<br>
            ✅ They took ACTION when others hesitated</p>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 18px; font-weight: bold;">Joy Token is YOUR Early Opportunity</p>
              <p style="margin: 10px 0 0 0;">In 2 years, will you be telling YOUR success story?<br>
              Or will you be saying "I wish I had bought when I had the chance"?</p>
            </div>
            
            <h3>Why People Trust CoinDaily</h3>
            <ul>
              <li>📰 <strong>10,000+ Daily Readers:</strong> Africa's most trusted crypto news</li>
              <li>🎯 <strong>Proven Track Record:</strong> Called 5 memecoin pumps in 2024</li>
              <li>🔒 <strong>Transparent Team:</strong> Public identities, no anonymous devs</li>
              <li>💎 <strong>Real Utility:</strong> $JY powers actual platform features</li>
            </ul>
            
            <center><a href="https://token.sygn.live" class="cta-button">Write Your Success Story →</a></center>
            
            <p>Tomorrow: FINAL email. Join our team or earn 100 $JY for referrals!</p>
            
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
      
    case 'day_9_careers':
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💼 Join CoinDaily or Win 100 $JY!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>This is the final email in our series. But it's not goodbye—it's an invitation to go DEEPER.</p>
            
            <h3>Option 1: Work With Us 🚀</h3>
            <p>CoinDaily is growing FAST. We're hiring talented Africans who believe in crypto's power to transform lives.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">🖊️ Content Writers</h4>
              <p style="margin: 0; font-size: 14px;">Cover crypto news, memecoins, and African market trends</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">📱 Social Media Managers</h4>
              <p style="margin: 0; font-size: 14px;">Grow our community on Twitter, Telegram, and TikTok</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">💻 Developers</h4>
              <p style="margin: 0; font-size: 14px;">Build features for Africa's premier crypto platform</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h4 style="margin: 0 0 10px 0;">🎨 Graphic Designers</h4>
              <p style="margin: 0; font-size: 14px;">Create viral graphics and memes for crypto content</p>
            </div>
            
            <p><strong>Perks:</strong> Competitive salary + $JY token bonuses + Remote work + Be part of Africa's crypto revolution</p>
            
            <center><a href="https://sygn.live/careers" class="cta-button">View Open Positions →</a></center>
            
            <h3>Option 2: Earn 100 $JY Tokens! 💰</h3>
            <p>Not ready to join the team? Earn FREE tokens by referring friends!</p>
            
            <div class="highlight">
              <p style="margin: 0; font-weight: bold;">Referral Rewards:</p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Refer 1 friend who joins whitelist = <strong>10 $JY</strong></li>
                <li>Refer 5 friends = <strong>50 $JY</strong></li>
                <li>Refer 10 friends = <strong>100 $JY</strong> (worth $100+ at launch!)</li>
              </ul>
              <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>PLUS:</strong> 5% of every referral's presale purchase!</p>
            </div>
            
            <p><strong>How it works:</strong></p>
            <ol>
              <li>Get your unique referral link</li>
              <li>Share with friends, family, social media</li>
              <li>They sign up for whitelist using your link</li>
              <li>You earn $JY tokens automatically!</li>
            </ol>
            
            <center><a href="https://token.sygn.live/affiliate" class="cta-button">Get My Referral Link →</a></center>
            
            <h3>Thank You for This Journey</h3>
            <p>Over the past 9 days, you've learned:</p>
            <ul>
              <li>✅ What makes CoinDaily special</li>
              <li>✅ Why Joy Token is a smart investment</li>
              <li>✅ The power of getting in early</li>
              <li>✅ Exact tokenomics and presale details</li>
              <li>✅ How to participate step-by-step</li>
              <li>✅ The strength of our community</li>
              <li>✅ Real success stories from early believers</li>
            </ul>
            
            <div class="highlight">
              <p style="margin: 0; font-size: 20px; font-weight: bold; text-align: center;">The choice is yours:</p>
              <p style="margin: 10px 0 0 0; text-align: center;">Act now and potentially change your life.<br>
              Or wait and watch others succeed.</p>
            </div>
            
            <p><strong>Presale launches in [X HOURS].</strong></p>
            
            <center><a href="https://token.sygn.live" class="cta-button">Secure My Joy Tokens →</a></center>
            
            <p>To your success,</p>
            <p><strong>The CoinDaily Team</strong></p>
            
            <p style="font-size: 12px; color: #666; margin-top: 30px;">P.S. This is the last scheduled email. But you'll still get important updates about presale milestones, exchange listings, and community events. Stay connected!</p>
          </div>
          ${footer}
        </div>
      `;
      
    default:
      return `${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💎 Joy Token</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Important update about Joy Token...</p>
            <center><a href="https://token.sygn.live" class="cta-button">Visit Joy Token →</a></center>
            <p>Best regards,<br><strong>The CoinDaily Team</strong></p>
          </div>
          ${footer}
        </div>
      `;
  }
}
