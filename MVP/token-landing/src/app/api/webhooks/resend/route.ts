import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Resend Webhook Handler
 * Handles email events from Resend: delivered, opened, clicked, bounced, etc.
 * 
 * Setup in Resend Dashboard:
 * 1. Go to Settings → Webhooks
 * 2. Add endpoint: https://token.coindaily.online/api/webhooks/resend
 * 3. Copy signing secret to .env as RESEND_WEBHOOK_SECRET
 * 4. Select events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, etc.
 */

interface ResendWebhookPayload {
  type: string; // 'email.sent', 'email.delivered', 'email.opened', 'email.clicked', 'email.bounced', etc.
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Event-specific data
    link?: string; // For click events
    user_agent?: string;
    ip_address?: string;
    // Bounce-specific data
    bounce_type?: string; // 'hard', 'soft'
    bounce_reason?: string;
  };
}

/**
 * Verify Resend webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = request.headers.get('resend-signature') || '';
    const rawBody = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: ResendWebhookPayload = JSON.parse(rawBody);
    
    console.log('Resend webhook received:', {
      type: payload.type,
      emailId: payload.data.email_id,
      to: payload.data.to
    });

    // Handle different event types
    switch (payload.type) {
      case 'email.sent':
        await handleEmailSent(payload);
        break;

      case 'email.delivered':
        await handleEmailDelivered(payload);
        break;

      case 'email.delivery_delayed':
        await handleEmailDelayed(payload);
        break;

      case 'email.complained':
        await handleEmailComplained(payload);
        break;

      case 'email.bounced':
        await handleEmailBounced(payload);
        break;

      case 'email.opened':
        await handleEmailOpened(payload);
        break;

      case 'email.clicked':
        await handleEmailClicked(payload);
        break;

      default:
        console.log('Unhandled event type:', payload.type);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle email sent event
 */
async function handleEmailSent(payload: ResendWebhookPayload) {
  console.log('Email sent:', payload.data.email_id);
  
  // Update database
  await prisma.scheduledEmail.updateMany({
    where: { resendEmailId: payload.data.email_id },
    data: {
      status: 'SENT',
      sentAt: new Date(payload.data.created_at)
    }
  });

  // Find subscriber by email
  const recipientEmail = payload.data.to[0];
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    // Create email event
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'SENT',
        timestamp: new Date(payload.created_at),
        metadata: payload.data as any
      }
    });
  }
}

/**
 * Handle email delivered event
 */
async function handleEmailDelivered(payload: ResendWebhookPayload) {
  console.log('Email delivered:', payload.data.email_id);
  
  // Update database
  await prisma.scheduledEmail.updateMany({
    where: { resendEmailId: payload.data.email_id },
    data: { status: 'DELIVERED' }
  });

  // Find subscriber and create event
  const recipientEmail = payload.data.to[0];
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'DELIVERED',
        timestamp: new Date(payload.created_at)
      }
    });
  }
}

/**
 * Handle email delivery delayed
 */
async function handleEmailDelayed(payload: ResendWebhookPayload) {
  console.log('Email delivery delayed:', payload.data.email_id);
  
  const recipientEmail = payload.data.to[0];
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'DELIVERY_DELAYED',
        timestamp: new Date(payload.created_at),
        metadata: payload.data as any
      }
    });
  }
}

/**
 * Handle email complained (spam report)
 */
async function handleEmailComplained(payload: ResendWebhookPayload) {
  console.log('Email complained:', payload.data.email_id);
  
  // Mark subscriber as complained - important for reputation
  const recipientEmail = payload.data.to[0];
  
  await prisma.emailSubscriber.update({
    where: { email: recipientEmail },
    data: { 
      unsubscribed: true,
      unsubscribedAt: new Date()
    }
  });

  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'COMPLAINED',
        timestamp: new Date(payload.created_at)
      }
    });
  }
}

/**
 * Handle email bounced
 */
async function handleEmailBounced(payload: ResendWebhookPayload) {
  console.log('Email bounced:', {
    emailId: payload.data.email_id,
    type: payload.data.bounce_type,
    reason: payload.data.bounce_reason
  });
  
  const recipientEmail = payload.data.to[0];
  
  // Hard bounce = permanent failure, mark as invalid
  if (payload.data.bounce_type === 'hard') {
    await prisma.emailSubscriber.update({
      where: { email: recipientEmail },
      data: { 
        unsubscribed: true, 
        unsubscribedAt: new Date()
      }
    });
  }

  await prisma.scheduledEmail.updateMany({
    where: { resendEmailId: payload.data.email_id },
    data: { 
      status: 'BOUNCED',
      lastError: payload.data.bounce_reason 
    }
  });

  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'BOUNCED',
        timestamp: new Date(payload.created_at),
        metadata: {
          bounce_type: payload.data.bounce_type,
          bounce_reason: payload.data.bounce_reason
        } as any
      }
    });
  }
}

/**
 * Handle email opened
 */
async function handleEmailOpened(payload: ResendWebhookPayload) {
  console.log('Email opened:', payload.data.email_id);
  
  const recipientEmail = payload.data.to[0];
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'OPENED',
        timestamp: new Date(payload.created_at),
        metadata: {
          user_agent: payload.data.user_agent,
          ip_address: payload.data.ip_address
        } as any
      }
    });
  }
}

/**
 * Handle email link clicked
 */
async function handleEmailClicked(payload: ResendWebhookPayload) {
  console.log('Email clicked:', {
    emailId: payload.data.email_id,
    link: payload.data.link
  });
  
  const recipientEmail = payload.data.to[0];
  const subscriber = await prisma.emailSubscriber.findUnique({
    where: { email: recipientEmail }
  });

  if (subscriber) {
    await prisma.emailEvent.create({
      data: {
        subscriberId: subscriber.id,
        resendEmailId: payload.data.email_id,
        eventType: 'CLICKED',
        timestamp: new Date(payload.created_at),
        metadata: {
          link: payload.data.link,
          user_agent: payload.data.user_agent,
          ip_address: payload.data.ip_address
        } as any
      }
    });
  }
}
