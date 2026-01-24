import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface PasswordResetEmailData {
  username: string;
  resetToken: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  private async initializeTransporter(): Promise<void> {
    try {
      // Check if email is configured
      const emailConfigured = process.env.SMTP_HOST && process.env.SMTP_PORT;

      if (!emailConfigured) {
        logger.warn('Email service not configured. Set SMTP_HOST and SMTP_PORT environment variables.');
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      });

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.transporter = null;
      this.initialized = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      logger.warn('Email service not initialized. Email not sent.');
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || 'noreply@coindaily.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to: ${mailOptions.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const expiresIn = data.expiresInMinutes || 15;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - CoinDaily</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            opacity: 0.9;
          }
          .token-box {
            background: white;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            word-break: break-all;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
          .footer {
            text-align: center;
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${data.username}</strong>,</p>
          
          <p>We received a request to reset your password for your CoinDaily account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <center>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="token-box">${data.resetUrl}</div>
          
          <div class="warning">
            ⚠️ <strong>Important:</strong> This link will expire in ${expiresIn} minutes for security reasons.
          </div>
          
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          
          <p>For security reasons, never share your password reset link with anyone.</p>
          
          <p>Best regards,<br>
          The CoinDaily Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from CoinDaily.</p>
          <p>If you have any questions, please contact support@coindaily.com</p>
          <p>&copy; ${new Date().getFullYear()} CoinDaily. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request - CoinDaily

Hello ${data.username},

We received a request to reset your password for your CoinDaily account.

Click or paste this link into your browser to reset your password:
${data.resetUrl}

IMPORTANT: This link will expire in ${expiresIn} minutes for security reasons.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, never share your password reset link with anyone.

Best regards,
The CoinDaily Team

---
This is an automated message from CoinDaily.
If you have any questions, please contact support@coindaily.com
© ${new Date().getFullYear()} CoinDaily. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your CoinDaily Password',
      html,
      text,
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(email: string, token: string, verificationUrl: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - CoinDaily</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header"><h1>✅ Verify Your Email</h1></div>
        <div class="content">
          <p>Welcome to CoinDaily!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <center><a href="${verificationUrl}" class="button">Verify Email</a></center>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>If you didn't create a CoinDaily account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your CoinDaily Email',
      html,
    });
  }

  /**
   * Strip HTML tags for plain text
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

export const emailService = new EmailService();
export default emailService;
