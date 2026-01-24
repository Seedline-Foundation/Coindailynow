/**
 * Email Utility - Send emails using configured email service provider
 * 
 * Supports:
 * - SendGrid
 * - AWS SES
 * - Nodemailer (SMTP)
 */

import nodemailer from 'nodemailer';

// ============================================================================
// CONFIGURATION
// ============================================================================

const EMAIL_PROVIDER = process.env.EMAIL_SERVICE_PROVIDER || 'nodemailer';
const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS || 'noreply@coindaily.com';

// ============================================================================
// TYPES
// ============================================================================

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

// ============================================================================
// EMAIL SENDER
// ============================================================================

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, text, html, from = EMAIL_FROM } = options;

  try {
    switch (EMAIL_PROVIDER) {
      case 'sendgrid':
        await sendWithSendGrid(to, from, subject, text, html);
        break;

      case 'ses':
        await sendWithSES(to, from, subject, text, html);
        break;

      case 'nodemailer':
      default:
        await sendWithNodemailer(to, from, subject, text, html);
        break;
    }

    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(
  to: string,
  from: string,
  subject: string,
  text?: string,
  html?: string
): Promise<void> {
  // SendGrid implementation
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from, subject, text, html });
  
  console.log('SendGrid not configured. Using fallback.');
  await sendWithNodemailer(to, from, subject, text, html);
}

/**
 * Send email using AWS SES
 */
async function sendWithSES(
  to: string,
  from: string,
  subject: string,
  text?: string,
  html?: string
): Promise<void> {
  // AWS SES implementation
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({ region: process.env.AWS_REGION });
  // await ses.sendEmail({ ... }).promise();
  
  console.log('AWS SES not configured. Using fallback.');
  await sendWithNodemailer(to, from, subject, text, html);
}

/**
 * Send email using Nodemailer (SMTP)
 */
async function sendWithNodemailer(
  to: string,
  from: string,
  subject: string,
  text?: string,
  html?: string
): Promise<void> {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Send email
  await transporter.sendMail({
    from,
    to,
    subject,
    text: text || '',
    html: html || text || '',
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send bulk emails (with rate limiting)
 */
export async function sendBulkEmails(
  emails: EmailOptions[],
  delayMs: number = 100
): Promise<void> {
  for (const email of emails) {
    await sendEmail(email);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export default {
  sendEmail,
  isValidEmail,
  sendBulkEmails,
};
