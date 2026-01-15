"""
Email notification service using Resend
"""
import asyncio
import logging
import resend
from datetime import datetime, timezone

from utils.config import RESEND_API_KEY, SENDER_EMAIL, FRONTEND_URL

logger = logging.getLogger(__name__)
resend.api_key = RESEND_API_KEY

async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using Resend API (non-blocking)"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return False
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {result.get('id', 'unknown')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def get_email_template(template_type: str, data: dict) -> tuple:
    """Get email subject and HTML content for a template type"""
    
    base_style = """
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #05050A; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, rgba(15,17,26,0.95) 0%, rgba(20,25,40,0.95) 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #6b8dd6; margin-bottom: 24px; }
            h1 { color: #ffffff; font-size: 24px; margin: 0 0 16px 0; }
            p { color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
            .highlight { background: linear-gradient(135deg, #22d3ee 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
            .btn { display: inline-block; background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%); color: #000000; font-weight: 600; padding: 14px 28px; border-radius: 50px; text-decoration: none; margin: 16px 0; }
            .stat-box { background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.3); border-radius: 12px; padding: 16px; margin: 16px 0; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #22d3ee; }
            .stat-label { font-size: 14px; color: #64748b; }
            .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; }
            .footer p { color: #64748b; font-size: 12px; }
            .info-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .info-label { color: #64748b; }
            .info-value { color: #ffffff; font-weight: 500; }
            .credentials-box { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 12px 0; }
            .credential-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .credential-value { color: #10b981; font-family: monospace; font-size: 16px; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; margin-top: 4px; word-break: break-all; }
        </style>
    """
    
    templates = {
        "referral_signup": _get_referral_signup_template(base_style, data),
        "2fa_enabled": _get_2fa_enabled_template(base_style, data),
        "2fa_disabled": _get_2fa_disabled_template(base_style, data),
        "welcome": _get_welcome_template(base_style, data),
        "purchase_confirmation": _get_purchase_confirmation_template(base_style, data)
    }
    
    return templates.get(template_type, ("AppCloud Notification", "<p>You have a notification from AppCloud.</p>"))

def _get_referral_signup_template(base_style: str, data: dict) -> tuple:
    subject = f"🎉 You earned {data.get('opt_reward', 50)} OPT! New referral signup"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{base_style}</head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">AppCloud</div>
                <h1>New Referral Signup! 🎉</h1>
                <p>Great news! Someone just signed up using your referral link.</p>
                
                <div class="stat-box">
                    <div class="stat-value">+{data.get('opt_reward', 50)} OPT</div>
                    <div class="stat-label">Reward Earned (Pending)</div>
                </div>
                
                <p>This reward is pending confirmation and will be credited to your account soon.</p>
                
                <p><strong>Referral Type:</strong> {data.get('referral_type', 'Operator').title()}</p>
                <p><strong>Your Total Referrals:</strong> {data.get('total_referrals', 1)}</p>
                
                <a href="{data.get('dashboard_url', FRONTEND_URL)}/promotion" class="btn">View Your Referrals</a>
                
                <p style="margin-top: 24px;">Keep sharing your referral link to earn more OPT rewards!</p>
                
                <div class="footer">
                    <p>You're receiving this because you have an AppCloud node operator account.</p>
                    <p>© 2025 AppCloud - Optio Blockchain Cloud</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html

def _get_2fa_enabled_template(base_style: str, data: dict) -> tuple:
    subject = "🔐 Two-Factor Authentication Enabled"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{base_style}</head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">AppCloud</div>
                <h1>2FA Successfully Enabled 🔐</h1>
                <p>Two-factor authentication has been enabled on your AppCloud account.</p>
                
                <div class="stat-box" style="background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3);">
                    <div class="stat-value" style="color: #10b981;">✓ Secured</div>
                    <div class="stat-label">Your account is now protected</div>
                </div>
                
                <p><strong>What this means:</strong></p>
                <ul style="color: #94a3b8; padding-left: 20px;">
                    <li>You'll need your authenticator app to log in</li>
                    <li>Your account is protected from unauthorized access</li>
                    <li>Save your backup codes in a safe place</li>
                </ul>
                
                <p style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 8px; padding: 12px; color: #fbbf24;">
                    <strong>⚠️ Important:</strong> Keep your backup codes safe. You'll need them if you lose access to your authenticator app.
                </p>
                
                <p><strong>Enabled on:</strong> {data.get('enabled_at', datetime.now().strftime('%B %d, %Y at %H:%M UTC'))}</p>
                
                <a href="{data.get('dashboard_url', FRONTEND_URL)}/settings" class="btn">Manage Security Settings</a>
                
                <div class="footer">
                    <p>If you didn't enable 2FA, please secure your account immediately.</p>
                    <p>© 2025 AppCloud - Optio Blockchain Cloud</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html

def _get_2fa_disabled_template(base_style: str, data: dict) -> tuple:
    subject = "⚠️ Two-Factor Authentication Disabled"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{base_style}</head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">AppCloud</div>
                <h1>2FA Has Been Disabled ⚠️</h1>
                <p>Two-factor authentication has been disabled on your AppCloud account.</p>
                
                <div class="stat-box" style="background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3);">
                    <div class="stat-value" style="color: #ef4444;">⚠ Less Secure</div>
                    <div class="stat-label">2FA protection removed</div>
                </div>
                
                <p>Your account is now less protected against unauthorized access. We strongly recommend re-enabling 2FA.</p>
                
                <p><strong>Disabled on:</strong> {data.get('disabled_at', datetime.now().strftime('%B %d, %Y at %H:%M UTC'))}</p>
                
                <a href="{data.get('dashboard_url', FRONTEND_URL)}/settings" class="btn">Re-enable 2FA</a>
                
                <div class="footer">
                    <p>If you didn't disable 2FA, please secure your account immediately and change your password.</p>
                    <p>© 2025 AppCloud - Optio Blockchain Cloud</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html

def _get_welcome_template(base_style: str, data: dict) -> tuple:
    subject = "🚀 Welcome to AppCloud - Start Earning Today!"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{base_style}</head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">AppCloud</div>
                <h1>Welcome to AppCloud! 🚀</h1>
                <p>Hi <span class="highlight">{data.get('name', 'Node Operator')}</span>,</p>
                <p>Your node operator account has been created successfully. You're now part of the Optio Blockchain Cloud network!</p>
                
                <div class="stat-box">
                    <div class="stat-value">0 OPT</div>
                    <div class="stat-label">Your Current Balance</div>
                </div>
                
                <p><strong>What's next?</strong></p>
                <ul style="color: #94a3b8; padding-left: 20px;">
                    <li>Install apps from the App Factory to start earning</li>
                    <li>Share your referral link to earn 50 OPT per signup</li>
                    <li>Enable 2FA to secure your account</li>
                </ul>
                
                <a href="{data.get('dashboard_url', FRONTEND_URL)}" class="btn">Go to Dashboard</a>
                
                <p style="margin-top: 24px;">Your unique referral code: <strong>{data.get('referral_code', 'N/A')}</strong></p>
                
                <div class="footer">
                    <p>You're receiving this because you created an AppCloud account.</p>
                    <p>© 2025 AppCloud - Optio Blockchain Cloud</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html


def _get_purchase_confirmation_template(base_style: str, data: dict) -> tuple:
    """Purchase confirmation email with order details and login credentials"""
    subject = "🎉 Your Optio CloudNode Purchase is Complete!"
    
    # Format amount
    amount = data.get('amount', 0)
    original_amount = data.get('original_amount', amount)
    discount = data.get('discount', 0)
    currency = data.get('currency', 'USD')
    
    # Build credentials section for new users
    credentials_html = ""
    if data.get('is_new_user') and data.get('temp_password'):
        credentials_html = f"""
        <div class="credentials-box">
            <h3 style="color: #10b981; margin: 0 0 16px 0;">🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <div class="credential-label">Email</div>
                <div class="credential-value">{data.get('email', '')}</div>
            </div>
            <div class="credential-item">
                <div class="credential-label">Temporary Password</div>
                <div class="credential-value">{data.get('temp_password', '')}</div>
            </div>
            <p style="color: #fbbf24; font-size: 14px; margin-top: 16px;">
                ⚠️ Please change your password after logging in for the first time.
            </p>
        </div>
        """
    else:
        credentials_html = """
        <div class="info-box">
            <p style="margin: 0; color: #94a3b8;">
                ✓ Your existing account has been updated with your new license.
            </p>
        </div>
        """
    
    # Build discount row if applicable
    discount_html = ""
    if discount > 0:
        discount_html = f"""
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span style="color: #64748b;">Original Price</span>
            <span style="color: #94a3b8; text-decoration: line-through;">${original_amount:,.2f} {currency}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <span style="color: #10b981;">Discount {f'({data.get("coupon_code")})' if data.get("coupon_code") else ''}</span>
            <span style="color: #10b981;">-${discount:,.2f} {currency}</span>
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>{base_style}</head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">☁️ Optio CloudNode</div>
                <h1>Thank You for Your Purchase! 🎉</h1>
                <p>Hi <span class="highlight">{data.get('name', 'Valued Customer')}</span>,</p>
                <p>Your Optio CloudNode purchase has been successfully completed. Welcome to the decentralized cloud revolution!</p>
                
                <div class="stat-box">
                    <div class="stat-value">✓ Activated</div>
                    <div class="stat-label">Your CloudNode License</div>
                </div>
                
                <div class="info-box">
                    <h3 style="color: #ffffff; margin: 0 0 16px 0;">📋 Order Details</h3>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #64748b;">Order ID</span>
                        <span style="color: #ffffff; font-family: monospace;">{data.get('order_id', 'N/A')[:8]}...</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #64748b;">Product</span>
                        <span style="color: #ffffff;">{data.get('product_name', 'Optio CloudNode')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #64748b;">License Key</span>
                        <span style="color: #22d3ee; font-family: monospace; font-size: 14px;">{data.get('license_key', 'N/A')}</span>
                    </div>
                    {discount_html}
                    <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px;">
                        <span style="color: #ffffff; font-weight: bold;">Total Paid</span>
                        <span style="color: #22d3ee; font-size: 20px; font-weight: bold;">${amount:,.2f} {currency}</span>
                    </div>
                </div>
                
                {credentials_html}
                
                <p><strong>What's Included:</strong></p>
                <ul style="color: #94a3b8; padding-left: 20px;">
                    <li>Lifetime CloudNode License</li>
                    <li>Access to Node Operator Dashboard</li>
                    <li>Automatic app hosting & earnings</li>
                    <li>OPT rewards for network participation</li>
                </ul>
                
                <a href="{data.get('dashboard_url', FRONTEND_URL)}/dashboard" class="btn">Go to Your Dashboard</a>
                
                <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
                    Questions? Reply to this email or visit our support center.
                </p>
                
                <div class="footer">
                    <p>This is a receipt for your purchase. Keep it for your records.</p>
                    <p>© 2025 Optio CloudNode - Optio Blockchain Cloud</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return subject, html


async def send_notification_email(template_type: str, to_email: str, data: dict) -> bool:
    """Send a notification email using a template"""
    subject, html = get_email_template(template_type, data)
    return await send_email(to_email, subject, html)
