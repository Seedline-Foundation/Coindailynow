import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://token.coindaily.online';
    const WHITELIST_FORM_URL = process.env.NEXT_PUBLIC_WHITELIST_FORM_URL;

    if (!RESEND_API_KEY || !AUDIENCE_ID) {
      console.error('Resend API key or Audience ID not configured');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Step 1: Add contact to Resend audience
    const contactResponse = await resend.contacts.create({
      email: email,
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });

    // Check for errors (except "already exists")
    if (contactResponse.error && !contactResponse.error.message?.toLowerCase().includes('already')) {
      console.error('Resend API error:', contactResponse.error);
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    // Step 2: Send welcome email with whitelist form link immediately
    const emailResponse = await resend.emails.send({
      from: 'Joy Token Team <noreply@coindaily.online>',
      to: email,
      subject: '🎉 Welcome to Joy Token - Complete Your Whitelist Application',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Joy Token</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #6366f1;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                🎉 Welcome to Joy Token!
                            </h1>
                            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 18px;">
                                Africa's Premier Utility Token
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #1a1a2e;">
                            
                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                                <p style="margin: 0; color: #ffffff; font-weight: 600; font-size: 18px;">
                                    ✅ You're In! Complete Your Application
                                </p>
                            </div>

                            <!-- Welcome Text -->
                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">
                                Thank You for Your Interest! 🚀
                            </h2>
                            
                            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                You're one step closer to being part of the <strong style="color: #6366f1;">Joy Token presale</strong>. 
                                We're building Africa's most rewarding crypto ecosystem, and we want you to be part of it!
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${WHITELIST_FORM_URL}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                                            🎯 Complete Whitelist Application
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 20px 0;">
                                Click the button above to fill out your whitelist application
                            </p>

                            <!-- Benefits -->
                            <div style="background: rgba(99, 102, 241, 0.1); border-left: 4px solid #6366f1; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <h3 style="color: #6366f1; font-size: 18px; margin: 0 0 15px 0;">
                                    🎁 What You'll Get:
                                </h3>
                                <ul style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li><strong style="color: #ffffff;">90% APR Staking Rewards</strong></li>
                                    <li><strong style="color: #ffffff;">6M Max Supply</strong> - No inflation</li>
                                    <li><strong style="color: #ffffff;">CoinDaily Premium Access</strong></li>
                                    <li><strong style="color: #ffffff;">Governance Rights</strong></li>
                                    <li><strong style="color: #ffffff;">Early Presale Access</strong></li>
                                    <li><strong style="color: #ffffff;">Exclusive Community Perks</strong></li>
                                </ul>
                            </div>

                            <!-- Tokenomics Highlight -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; text-align: center;">
                                        <h3 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 20px;">⚡ Presale Allocation</h3>
                                        <p style="color: #d1d5db; margin: 0; font-size: 16px; line-height: 1.6;">
                                            <strong style="color: #ffffff; font-size: 24px;">28.3%</strong> of total supply available<br/>
                                            <span style="color: #9ca3af;">1.6M tokens • $0.29 per token</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Watch for Next Email -->
                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <p style="color: #ffffff; margin: 0; font-weight: 600; font-size: 15px;">
                                    📬 Watch your inbox! We'll be sending you valuable insights over the next 7 days.
                                </p>
                            </div>

                            <!-- Next Steps -->
                            <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">
                                    📝 Next Steps:
                                </h3>
                                <ol style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 2;">
                                    <li><strong style="color: #ffffff;">Complete the whitelist form</strong> (2 minutes)</li>
                                    <li><strong style="color: #ffffff;">Wait for approval</strong> (within 24-48 hours)</li>
                                    <li><strong style="color: #ffffff;">Get presale access link</strong> via email</li>
                                    <li><strong style="color: #ffffff;">Secure your $JY tokens</strong> early!</li>
                                </ol>
                            </div>

                            <!-- Questions CTA -->
                            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 25px 0; line-height: 1.6;">
                                Have questions? We're here to help!<br/>
                                <a href="https://discord.gg/srgWv7nCSr" style="color: #6366f1; text-decoration: none; font-weight: 600;">Contact us on Discord</a> or 
                                <a href="https://t.me/CoindailyNewz" style="color: #6366f1; text-decoration: none; font-weight: 600;">Telegram</a>
                            </p>

                        </td>
                    </tr>

                    <!-- Social Media -->
                    <tr>
                        <td style="background-color: #0f0f1e; padding: 30px; text-align: center; border-top: 1px solid #6366f1;">
                            <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">
                                Join Our Community:
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="https://discord.gg/srgWv7nCSr" style="color: #6366f1; text-decoration: none; font-size: 14px; font-weight: 600;">
                                            💬 Discord
                                        </a>
                                    </td>
                                    <td style="padding: 0 10px; color: #4b5563;">|</td>
                                    <td style="padding: 0 10px;">
                                        <a href="https://t.me/CoindailyNewz" style="color: #6366f1; text-decoration: none; font-size: 14px; font-weight: 600;">
                                            📱 Telegram
                                        </a>
                                    </td>
                                    <td style="padding: 0 10px; color: #4b5563;">|</td>
                                    <td style="padding: 0 10px;">
                                        <a href="https://twitter.com/Coindaily001" style="color: #6366f1; text-decoration: none; font-size: 14px; font-weight: 600;">
                                            𝕏 Twitter
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0a0a0a; padding: 25px 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; line-height: 1.6;">
                                This email was sent because you signed up for the Joy Token whitelist at<br/>
                                <a href="${SITE_URL}" style="color: #6366f1; text-decoration: none;">${SITE_URL}</a>
                            </p>
                            <p style="color: #4b5563; font-size: 11px; margin: 0;">
                                © ${new Date().getFullYear()} CoinDaily. All rights reserved.
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

    // Check if email was sent successfully
    if (emailResponse.error) {
      console.error('Email sending error:', emailResponse.error);
      return NextResponse.json(
        { success: false, message: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', emailResponse.data?.id);

    return NextResponse.json({ 
      success: true,
      message: 'Success! Check your email for the whitelist application link.',
    });

  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'An error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}
