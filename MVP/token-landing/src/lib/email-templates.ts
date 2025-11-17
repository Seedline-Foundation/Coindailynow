/**
 * Email Templates Module
 * Contains all email HTML templates for the Joy Token campaign
 */

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface TemplateParams {
  email: string;
  verificationUrl?: string;
  whitelistFormUrl?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Email Verification Template
 */
export function getVerificationEmailTemplate(params: TemplateParams): EmailTemplate {
  const { email, verificationUrl, siteUrl = 'https://token.coindaily.online' } = params;

  return {
    subject: '✅ Verify Your Email - Joy Token Whitelist',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid #6366f1;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                                ✅ Verify Your Email
                            </h1>
                            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                                One Step Away from Joy Token Presale
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #1a1a2e;">
                            
                            <p style="color: #d1d5db; font-size: 17px; line-height: 1.7; margin: 0 0 20px 0;">
                                Hi there! 👋
                            </p>

                            <p style="color: #d1d5db; font-size: 17px; line-height: 1.7; margin: 0 0 25px 0;">
                                Thank you for joining the <strong style="color: #ffffff;">Joy Token</strong> whitelist! To complete your registration and receive exclusive updates, please verify your email address.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                            ✅ Verify My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Note -->
                            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                <h3 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 16px;">
                                    🔒 Security Note
                                </h3>
                                <p style="color: #d1d5db; margin: 0; font-size: 14px; line-height: 1.7;">
                                    This verification link expires in <strong style="color: #ffffff;">24 hours</strong>. If you didn't request this, please ignore this email.
                                </p>
                            </div>

                            <!-- Alternative Link -->
                            <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 25px 0; line-height: 1.6;">
                                Button not working? Copy and paste this link:<br/>
                                <a href="${verificationUrl}" style="color: #6366f1; text-decoration: none; word-break: break-all;">${verificationUrl}</a>
                            </p>

                            <!-- What's Next -->
                            <div style="background: rgba(99, 102, 241, 0.1); border-radius: 12px; padding: 25px; margin: 30px 0;">
                                <h3 style="color: #6366f1; margin: 0 0 15px 0; font-size: 18px;">
                                    📬 What's Next?
                                </h3>
                                <p style="color: #d1d5db; margin: 0; font-size: 15px; line-height: 1.8;">
                                    After verification, you'll receive:<br/>
                                    ✅ Welcome email with whitelist form<br/>
                                    📚 9-day educational series about Joy Token<br/>
                                    🎁 Exclusive presale access and perks
                                </p>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #0a0a0a; padding: 25px 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; line-height: 1.6;">
                                This email was sent to <strong style="color: #9ca3af;">${email}</strong><br/>
                                <a href="${siteUrl}" style="color: #6366f1; text-decoration: none;">Joy Token by CoinDaily</a>
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
    `
  };
}

/**
 * Welcome Email Template (Day 0 - After Verification)
 */
export function getWelcomeEmailTemplate(params: TemplateParams): EmailTemplate {
  const { whitelistFormUrl, siteUrl = 'https://token.coindaily.online' } = params;

  return {
    subject: '🎉 Welcome to Joy Token - Complete Your Whitelist Application',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; border: 1px solid #6366f1;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold;">
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
                            
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                                <p style="margin: 0; color: #ffffff; font-weight: 600; font-size: 18px;">
                                    ✅ Email Verified! Complete Your Application
                                </p>
                            </div>

                            <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">
                                Thank You for Your Interest! 🚀
                            </h2>
                            
                            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                You're one step closer to being part of the <strong style="color: #6366f1;">Joy Token presale</strong>. 
                                We're building Africa's most rewarding crypto ecosystem, and we want you to be part of it!
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${whitelistFormUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);">
                                            🎯 Complete Whitelist Application
                                        </a>
                                    </td>
                                </tr>
                            </table>

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

                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 15px 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                                <p style="color: #ffffff; margin: 0; font-weight: 600; font-size: 15px;">
                                    📬 Watch your inbox! We'll be sending you valuable insights over the next 9 days.
                                </p>
                            </div>

                            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 25px 0;">
                                Questions? <a href="https://discord.gg/srgWv7nCSr" style="color: #6366f1; text-decoration: none;">Join our Discord</a>
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #0a0a0a; padding: 25px 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 12px; margin: 0;">
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
    `
  };
}

// Export interface for email sequence configuration
export interface EmailSequenceConfig {
  type: string;
  sequence: number;
  delay: number; // in hours
  subject: string;
  getTemplate: (params: TemplateParams) => string;
}
