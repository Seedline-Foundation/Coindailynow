import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

type ResponseData = {
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get IP address and user agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                      (req.headers['x-real-ip'] as string) || 
                      req.socket.remoteAddress || 
                      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referralSource = req.headers['referer'] || null;

    // Check if email already exists
    const existingSubscriber = await prisma.waitlistSubscriber.findUnique({
      where: { email }
    });

    if (existingSubscriber) {
      return res.status(400).json({ error: 'This email is already on the waitlist' });
    }

    // Add to database
    const subscriber = await prisma.waitlistSubscriber.create({
      data: {
        email,
        ipAddress,
        userAgent,
        referralSource
      }
    });

    // Send welcome email via Resend
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'CoinDaily <noreply@coindaily.com>',
        to: email,
        subject: 'Welcome to CoinDaily Waitlist! 🚀',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to CoinDaily</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: bold;">CoinDaily</h1>
                          <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Africa's Premier Crypto News Platform</p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px 30px;">
                          <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px;">Welcome to the Waitlist! 🎉</h2>
                          
                          <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">
                            Thank you for joining the CoinDaily waitlist! You're now part of an exclusive group that will get 
                            early access to Africa's first AI-powered cryptocurrency and memecoin news platform.
                          </p>
                          
                          <p style="margin: 0 0 15px; color: #666666; font-size: 16px; line-height: 1.6;">
                            Here's what you can expect from CoinDaily:
                          </p>
                          
                          <ul style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.8; padding-left: 20px;">
                            <li><strong>AI-Powered News:</strong> Real-time crypto news analyzed by advanced AI</li>
                            <li><strong>Market Insights:</strong> Live data from African and global exchanges</li>
                            <li><strong>Memecoin Analysis:</strong> Surge detection and whale tracking</li>
                            <li><strong>Multi-Language:</strong> Content in 15 African languages</li>
                            <li><strong>Community Features:</strong> Connect with fellow crypto enthusiasts</li>
                          </ul>
                          
                          <p style="margin: 0 0 20px; color: #666666; font-size: 16px; line-height: 1.6;">
                            We'll send you an email as soon as we launch. In the meantime, follow us on social media 
                            for updates and exclusive previews!
                          </p>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                            <tr>
                              <td align="center">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                                  Visit Our Landing Page
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                          <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">
                            Follow us on social media
                          </p>
                          <div style="margin: 0 0 15px;">
                            <a href="https://twitter.com/coindaily" style="color: #667eea; text-decoration: none; margin: 0 10px;">Twitter</a>
                            <a href="https://t.me/coindaily" style="color: #667eea; text-decoration: none; margin: 0 10px;">Telegram</a>
                            <a href="https://github.com/coindaily" style="color: #667eea; text-decoration: none; margin: 0 10px;">GitHub</a>
                          </div>
                          <p style="margin: 0; color: #999999; font-size: 12px;">
                            © 2025 CoinDaily. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the whole request if email sending fails
    }

    return res.status(200).json({ 
      message: 'Successfully joined the waitlist! Check your email for confirmation.' 
    });

  } catch (error) {
    console.error('Waitlist subscription error:', error);
    return res.status(500).json({ 
      error: 'Failed to process your subscription. Please try again later.' 
    });
  }
}
