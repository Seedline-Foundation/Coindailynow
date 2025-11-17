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
  // This function will be implemented with database integration
  // It should:
  // 1. Query database for emails scheduled for now or past
  // 2. Send each email via Resend
  // 3. Update status in database
  // 4. Handle retries for failed emails
  
  return {
    processed: 0,
    sent: 0,
    failed: 0
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
