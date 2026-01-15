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

async def send_notification_email(template_type: str, to_email: str, data: dict) -> bool:
    """Send a notification email using a template"""
    subject, html = get_email_template(template_type, data)
    return await send_email(to_email, subject, html)
