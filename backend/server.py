from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import random
import pyotp
import qrcode
import io
import base64
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
TOTP_ISSUER = "NAPP Dashboard"

# API Keys
COINMARKETCAP_API_KEY = os.environ.get('COINMARKETCAP_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
resend.api_key = RESEND_API_KEY

app = FastAPI(title="NAPP Node Operator Dashboard API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    referral_code: Optional[str] = None  # Referral code from another user

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None  # 2FA code if enabled

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    wallet_address: Optional[str] = None
    created_at: str
    two_factor_enabled: Optional[bool] = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    requires_2fa: Optional[bool] = False  # True if 2FA is needed

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str  # Base64 encoded QR code image
    provisioning_uri: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

class TwoFactorLoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: str

class NodeStats(BaseModel):
    node_id: str
    status: str
    uptime_percent: float
    cpu_usage: float
    memory_usage: float
    storage_usage: float
    latency_ms: float
    last_heartbeat: str
    reliability_score: float
    reputation_score: float

class EarningsData(BaseModel):
    # USD earnings from app subscriptions
    today_usd: float
    week_usd: float
    month_usd: float
    # OPT rewards from referrals
    today_opt_rewards: float
    week_opt_rewards: float
    month_opt_rewards: float
    total_opt_rewards: float
    # Breakdown
    earnings_by_app: List[dict]
    daily_history: List[dict]

class ReferralStats(BaseModel):
    # Node operator referrals
    operator_invites_sent: int
    operator_signups: int
    operator_opt_earned: float
    # App user referrals (signups driven to apps you host)
    app_user_signups: int
    app_user_opt_earned: float
    # Totals
    total_opt_earned: float
    pending_opt: float
    referral_links: List[dict]
    recent_signups: List[dict]

class InstalledApp(BaseModel):
    id: str
    name: str
    icon: str
    status: str
    subscribers_served: int
    revenue_usd: float  # USD earned from subscribers
    signups_driven: int  # Users who signed up via your promotion
    opt_rewards_earned: float  # OPT rewards for driving signups
    health: str
    installed_at: str

class AvailableApp(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    subscription_price: float  # Monthly subscription price users pay
    revenue_share: float  # Percentage of subscription revenue to node operator
    revenue_per_node: float  # Current average revenue per node hosting
    active_nodes: int  # Number of nodes currently hosting this app
    total_slots: int  # Total available hosting slots
    available_slots: int  # Remaining slots available
    subscribers: int  # Total active subscribers
    estimated_monthly_usd: float
    capacity_required: float
    is_trending: bool
    is_new: bool

class PromotionStats(BaseModel):
    # App promotion stats
    app_link_clicks: int
    app_signups_driven: int
    app_opt_rewards: float
    # Operator referral stats
    operator_invites_sent: int
    operator_signups: int
    operator_opt_rewards: float
    # Share links
    app_share_links: List[dict]
    operator_referral_link: str
    recent_activity: List[dict]

class CapacityData(BaseModel):
    total_capacity: float
    used_capacity: float
    available_capacity: float
    app_usage: List[dict]

class PayoutRecord(BaseModel):
    id: str
    date: str
    amount_opt: float
    amount_usd: float
    status: str
    tx_hash: Optional[str]

class AIRecommendation(BaseModel):
    type: str
    title: str
    description: str
    action: Optional[str]
    priority: str

# ==================== APP DEVELOPER MODELS ====================

class AppSubmissionCreate(BaseModel):
    app_name: str
    description: str
    category: str
    resources_required: float  # GB
    monthly_subscription_fee: float
    revenue_sharing: float  # Percentage
    nodes_available: int
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    contact_email: EmailStr
    terms_accepted: bool

class AppSubmissionResponse(BaseModel):
    id: str
    app_name: str
    description: str
    category: str
    resources_required: float
    monthly_subscription_fee: float
    revenue_sharing: float
    nodes_available: int
    github_url: Optional[str]
    documentation_url: Optional[str]
    contact_email: str
    icon_url: Optional[str]
    code_file_url: Optional[str]
    status: str  # pending, approved, rejected
    featured: bool
    featured_until: Optional[str]
    created_at: str
    updated_at: str

class FeaturedListingRequest(BaseModel):
    submission_id: str
    plan: str  # "30_days" or "60_days"
    origin_url: str

# ==================== ADMIN MODELS ====================

class AdminRole:
    SUPER_ADMIN = "super_admin"
    SUPPORT = "support"
    FINANCE = "finance"
    COMPLIANCE = "compliance"
    APP_REVIEW = "app_review"

ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT, AdminRole.FINANCE, AdminRole.COMPLIANCE, AdminRole.APP_REVIEW]

ROLE_PERMISSIONS = {
    AdminRole.SUPER_ADMIN: ["*"],  # All permissions
    AdminRole.SUPPORT: ["users:read", "users:update", "tickets:*", "nodes:read"],
    AdminRole.FINANCE: ["billing:*", "payouts:*", "revenue:*", "users:read"],
    AdminRole.COMPLIANCE: ["users:read", "apps:read", "audit:*", "nodes:read"],
    AdminRole.APP_REVIEW: ["apps:*", "users:read"]
}

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None  # 2FA code if enabled

class AdminResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    permissions: List[str]
    is_active: bool
    last_login: Optional[str]
    created_at: str
    two_factor_enabled: Optional[bool] = False

class AdminActionLog(BaseModel):
    admin_id: str
    admin_email: str
    action: str
    target_type: str  # user, node, app, billing, etc.
    target_id: str
    details: dict
    ip_address: Optional[str]
    timestamp: str

class AppReviewAction(BaseModel):
    action: str  # approve, reject, request_changes
    reason: Optional[str] = None
    compliance_notes: Optional[str] = None

class UserSuspendAction(BaseModel):
    reason: str

class NodeAction(BaseModel):
    action: str  # flag, suspend, reinstate, adjust_capacity
    reason: Optional[str] = None
    new_capacity: Optional[float] = None

class SupportTicketCreate(BaseModel):
    user_id: str
    subject: str
    description: str
    priority: str  # low, medium, high, critical
    category: str  # billing, technical, account, app, other

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None  # open, in_progress, resolved, closed
    assigned_to: Optional[str] = None
    internal_notes: Optional[str] = None
    resolution: Optional[str] = None

# ==================== REFERRAL SYSTEM MODELS ====================

class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_link: str
    operator_referral_link: str
    
class ReferralClick(BaseModel):
    referral_code: str
    source: Optional[str] = None  # e.g., "twitter", "facebook", "direct"
    app_id: Optional[str] = None  # For app-specific referrals

class ReferralStatsResponse(BaseModel):
    # User's referral codes
    referral_code: str
    operator_referral_link: str
    # Operator referral stats (inviting new node operators)
    operator_clicks: int
    operator_signups: int
    operator_opt_earned: float
    operator_pending_opt: float
    # App user referral stats (driving signups to hosted apps)
    app_clicks: int
    app_signups: int
    app_opt_earned: float
    app_pending_opt: float
    # Totals
    total_opt_earned: float
    total_pending_opt: float
    # Per-app breakdown
    app_referral_stats: List[dict]
    # Recent activity
    recent_referrals: List[dict]

class AppReferralLink(BaseModel):
    app_id: str
    app_name: str
    referral_link: str
    clicks: int
    signups: int
    opt_earned: float

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, is_admin: bool = False, pending_2fa: bool = False) -> str:
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "pending_2fa": pending_2fa,  # True if 2FA verification is still needed
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ==================== 2FA HELPER FUNCTIONS ====================

def generate_totp_secret() -> str:
    """Generate a new TOTP secret for 2FA setup"""
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str) -> str:
    """Generate the provisioning URI for authenticator apps"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=TOTP_ISSUER)

def generate_qr_code(uri: str) -> str:
    """Generate a QR code image as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code against the secret"""
    totp = pyotp.TOTP(secret)
    # Allow 1 window tolerance for clock skew
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 8) -> List[str]:
    """Generate backup codes for 2FA recovery"""
    codes = []
    for _ in range(count):
        code = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes

# ==================== EMAIL NOTIFICATION SYSTEM ====================

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
        # Run sync SDK in thread to keep FastAPI non-blocking
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
        </style>
    """
    
    if template_type == "referral_signup":
        subject = f"🎉 You earned {data.get('opt_reward', 50)} OPT! New referral signup"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>{base_style}</head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="logo">NAPP Dashboard</div>
                    <h1>New Referral Signup! 🎉</h1>
                    <p>Great news! Someone just signed up using your referral link.</p>
                    
                    <div class="stat-box">
                        <div class="stat-value">+{data.get('opt_reward', 50)} OPT</div>
                        <div class="stat-label">Reward Earned (Pending)</div>
                    </div>
                    
                    <p>This reward is pending confirmation and will be credited to your account soon.</p>
                    
                    <p><strong>Referral Type:</strong> {data.get('referral_type', 'Operator').title()}</p>
                    <p><strong>Your Total Referrals:</strong> {data.get('total_referrals', 1)}</p>
                    
                    <a href="{data.get('dashboard_url', 'https://napp.io')}/promotion" class="btn">View Your Referrals</a>
                    
                    <p style="margin-top: 24px;">Keep sharing your referral link to earn more OPT rewards!</p>
                    
                    <div class="footer">
                        <p>You're receiving this because you have a NAPP node operator account.</p>
                        <p>© 2025 NAPP - Optio Blockchain Cloud</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return subject, html
    
    elif template_type == "2fa_enabled":
        subject = "🔐 Two-Factor Authentication Enabled"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>{base_style}</head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="logo">NAPP Dashboard</div>
                    <h1>2FA Successfully Enabled 🔐</h1>
                    <p>Two-factor authentication has been enabled on your NAPP account.</p>
                    
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
                    
                    <a href="{data.get('dashboard_url', 'https://napp.io')}/settings" class="btn">Manage Security Settings</a>
                    
                    <div class="footer">
                        <p>If you didn't enable 2FA, please secure your account immediately.</p>
                        <p>© 2025 NAPP - Optio Blockchain Cloud</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return subject, html
    
    elif template_type == "2fa_disabled":
        subject = "⚠️ Two-Factor Authentication Disabled"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>{base_style}</head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="logo">NAPP Dashboard</div>
                    <h1>2FA Has Been Disabled ⚠️</h1>
                    <p>Two-factor authentication has been disabled on your NAPP account.</p>
                    
                    <div class="stat-box" style="background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3);">
                        <div class="stat-value" style="color: #ef4444;">⚠ Less Secure</div>
                        <div class="stat-label">2FA protection removed</div>
                    </div>
                    
                    <p>Your account is now less protected against unauthorized access. We strongly recommend re-enabling 2FA.</p>
                    
                    <p><strong>Disabled on:</strong> {data.get('disabled_at', datetime.now().strftime('%B %d, %Y at %H:%M UTC'))}</p>
                    
                    <a href="{data.get('dashboard_url', 'https://napp.io')}/settings" class="btn">Re-enable 2FA</a>
                    
                    <div class="footer">
                        <p>If you didn't disable 2FA, please secure your account immediately and change your password.</p>
                        <p>© 2025 NAPP - Optio Blockchain Cloud</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return subject, html
    
    elif template_type == "welcome":
        subject = "🚀 Welcome to NAPP - Start Earning Today!"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>{base_style}</head>
        <body>
            <div class="container">
                <div class="card">
                    <div class="logo">NAPP Dashboard</div>
                    <h1>Welcome to NAPP! 🚀</h1>
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
                    
                    <a href="{data.get('dashboard_url', 'https://napp.io')}" class="btn">Go to Dashboard</a>
                    
                    <p style="margin-top: 24px;">Your unique referral code: <strong>{data.get('referral_code', 'N/A')}</strong></p>
                    
                    <div class="footer">
                        <p>You're receiving this because you created a NAPP account.</p>
                        <p>© 2025 NAPP - Optio Blockchain Cloud</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return subject, html
    
    return "NAPP Notification", "<p>You have a notification from NAPP.</p>"

async def send_notification_email(template_type: str, to_email: str, data: dict) -> bool:
    """Send a notification email using a template"""
    subject, html = get_email_template(template_type, data)
    return await send_email(to_email, subject, html)

def generate_referral_code(user_id: str) -> str:
    """Generate a unique, short referral code from user ID"""
    import hashlib
    # Create a short hash from user_id
    hash_input = f"{user_id}{JWT_SECRET}"
    hash_obj = hashlib.sha256(hash_input.encode())
    # Take first 8 characters of hex digest
    return hash_obj.hexdigest()[:8].upper()

async def process_referral_signup(referred_user_id: str, referral_code: str, referral_type: str = "operator"):
    """Process a successful referral signup and credit OPT rewards"""
    # Find the referrer by code
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    if not referrer:
        logger.warning(f"Referral code {referral_code} not found")
        return False
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Determine reward amount
    opt_reward = 50.0 if referral_type == "operator" else 2.0
    
    # Create referral record
    referral_record = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_id": referred_user_id,
        "referral_code": referral_code,
        "referral_type": referral_type,  # "operator" or "app_user"
        "opt_reward": opt_reward,
        "status": "pending",  # pending, confirmed, paid
        "created_at": now
    }
    await db.referral_conversions.insert_one(referral_record)
    
    # Update referrer's stats
    update_field = "operator_signups" if referral_type == "operator" else "app_signups"
    pending_field = "operator_pending_opt" if referral_type == "operator" else "app_pending_opt"
    
    await db.referral_stats.update_one(
        {"user_id": referrer["id"]},
        {
            "$inc": {
                update_field: 1,
                pending_field: opt_reward,
                "total_pending_opt": opt_reward
            }
        },
        upsert=True
    )
    
    # Get total referrals count
    stats = await db.referral_stats.find_one({"user_id": referrer["id"]}, {"_id": 0})
    total_referrals = (stats.get("operator_signups", 0) if stats else 0) + (stats.get("app_signups", 0) if stats else 0)
    
    # Send email notification to referrer
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    await send_notification_email("referral_signup", referrer["email"], {
        "opt_reward": opt_reward,
        "referral_type": referral_type,
        "total_referrals": total_referrals,
        "dashboard_url": base_url
    })
    
    logger.info(f"Referral processed: {referrer['id']} referred {referred_user_id} ({referral_type}), reward: {opt_reward} OPT")
    return True

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify admin authentication and return admin user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("sub")
        is_admin = payload.get("is_admin", False)
        
        if not admin_id or not is_admin:
            raise HTTPException(status_code=401, detail="Admin access required")
        
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0, "hashed_password": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        if not admin.get("is_active", True):
            raise HTTPException(status_code=401, detail="Admin account suspended")
        
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def check_admin_permission(admin: dict, required_permission: str) -> bool:
    """Check if admin has required permission"""
    permissions = ROLE_PERMISSIONS.get(admin.get("role"), [])
    if "*" in permissions:
        return True
    
    # Check exact match or wildcard
    for perm in permissions:
        if perm == required_permission:
            return True
        if perm.endswith(":*"):
            prefix = perm[:-2]
            if required_permission.startswith(prefix + ":"):
                return True
    return False

async def log_admin_action(admin: dict, action: str, target_type: str, target_id: str, details: dict, request: Request = None):
    """Log admin action for audit trail"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "admin_role": admin["role"],
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "ip_address": request.client.host if request else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_audit_logs.insert_one(log_entry)
    return log_entry

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    wallet_address = f"0x{uuid.uuid4().hex[:40]}"
    now = datetime.now(timezone.utc).isoformat()
    referral_code = generate_referral_code(user_id)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "wallet_address": wallet_address,
        "referral_code": referral_code,
        "referred_by": user_data.referral_code,  # Store who referred this user
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Initialize referral stats for new user
    await db.referral_stats.insert_one({
        "user_id": user_id,
        "operator_clicks": 0,
        "operator_signups": 0,
        "operator_opt_earned": 0.0,
        "operator_pending_opt": 0.0,
        "app_clicks": 0,
        "app_signups": 0,
        "app_opt_earned": 0.0,
        "app_pending_opt": 0.0,
        "total_opt_earned": 0.0,
        "total_pending_opt": 0.0,
        "created_at": now
    })
    
    # Process referral if user was referred
    if user_data.referral_code:
        await process_referral_signup(user_id, user_data.referral_code, "operator")
    
    # Initialize node for user
    await initialize_user_node(user_id)
    
    # Send welcome email
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    await send_notification_email("welcome", user_data.email, {
        "name": user_data.name,
        "referral_code": referral_code,
        "dashboard_url": base_url
    })
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            wallet_address=wallet_address,
            created_at=now
        )
    )

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    two_fa_enabled = user.get("two_factor_enabled", False)
    
    # Check if 2FA is enabled for this user
    if two_fa_enabled:
        if not user_data.totp_code:
            # Return a response indicating 2FA is required
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication code required",
                "access_token": None,
                "user": None
            }
        
        # Verify the TOTP code
        totp_secret = user.get("totp_secret")
        if not totp_secret or not verify_totp(totp_secret, user_data.totp_code):
            # Check backup codes
            backup_codes = user.get("backup_codes", [])
            if user_data.totp_code in backup_codes:
                # Valid backup code - remove it after use
                backup_codes.remove(user_data.totp_code)
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
            else:
                raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    token = create_token(user["id"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "wallet_address": user.get("wallet_address"),
            "created_at": user["created_at"],
            "two_factor_enabled": two_fa_enabled
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        wallet_address=user.get("wallet_address"),
        created_at=user["created_at"],
        two_factor_enabled=user.get("two_factor_enabled", False)
    )

# ==================== 2FA ENDPOINTS (USER) ====================

@api_router.post("/auth/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(user=Depends(get_current_user)):
    """Initialize 2FA setup - returns QR code and secret"""
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    # Generate new TOTP secret
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user["email"])
    qr_code = generate_qr_code(uri)
    
    # Store the pending secret (not yet verified)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"pending_totp_secret": secret}}
    )
    
    return TwoFactorSetupResponse(
        secret=secret,
        qr_code=qr_code,
        provisioning_uri=uri
    )

@api_router.post("/auth/2fa/verify")
async def verify_2fa_setup(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Verify 2FA setup with first code - enables 2FA"""
    pending_secret = user.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found. Please start setup first.")
    
    if not verify_totp(pending_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Generate backup codes
    backup_codes = generate_backup_codes()
    enabled_at = datetime.now(timezone.utc).isoformat()
    
    # Enable 2FA
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "totp_secret": pending_secret,
                "two_factor_enabled": True,
                "backup_codes": backup_codes,
                "two_factor_enabled_at": enabled_at
            },
            "$unset": {"pending_totp_secret": ""}
        }
    )
    
    # Send email notification
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    await send_notification_email("2fa_enabled", user["email"], {
        "enabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
        "dashboard_url": base_url
    })
    
    return {
        "message": "Two-factor authentication enabled successfully",
        "backup_codes": backup_codes
    }

@api_router.post("/auth/2fa/disable")
async def disable_2fa(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Disable 2FA - requires current code for verification"""
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = user.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        # Check backup codes
        backup_codes = user.get("backup_codes", [])
        if verify_data.code not in backup_codes:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Disable 2FA
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"totp_secret": "", "backup_codes": "", "pending_totp_secret": ""}
        }
    )
    
    # Send email notification
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    await send_notification_email("2fa_disabled", user["email"], {
        "disabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
        "dashboard_url": base_url
    })
    
    return {"message": "Two-factor authentication disabled successfully"}

@api_router.get("/auth/2fa/status")
async def get_2fa_status(user=Depends(get_current_user)):
    """Get current 2FA status"""
    return {
        "two_factor_enabled": user.get("two_factor_enabled", False),
        "enabled_at": user.get("two_factor_enabled_at"),
        "backup_codes_remaining": len(user.get("backup_codes", []))
    }

@api_router.post("/auth/2fa/backup-codes/regenerate")
async def regenerate_backup_codes(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Regenerate backup codes - requires current code"""
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = user.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Generate new backup codes
    backup_codes = generate_backup_codes()
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"backup_codes": backup_codes}}
    )
    
    return {"backup_codes": backup_codes}

# ==================== NODE INITIALIZATION ====================

async def initialize_user_node(user_id: str):
    node_id = f"node-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    node_doc = {
        "user_id": user_id,
        "node_id": node_id,
        "status": "healthy",
        "uptime_percent": 99.7,
        "cpu_usage": 42.5,
        "memory_usage": 58.3,
        "storage_usage": 35.2,
        "latency_ms": 12,
        "last_heartbeat": now,
        "reliability_score": 98.5,
        "reputation_score": 850,
        "total_capacity": 100,
        "used_capacity": 45,
        "created_at": now
    }
    await db.nodes.insert_one(node_doc)
    
    # Add some default installed apps with USD revenue
    apps = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "DataVault Pro",
            "icon": "database",
            "status": "running",
            "subscribers_served": 1247,
            "revenue_usd": 487.50,  # USD from subscriptions
            "signups_driven": 45,   # Users signed up via promotion
            "opt_rewards_earned": 90.0,  # OPT rewards for signups
            "health": "healthy",
            "installed_at": now,
            "capacity_used": 15
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "StreamRelay",
            "icon": "video",
            "status": "running",
            "subscribers_served": 856,
            "revenue_usd": 342.40,
            "signups_driven": 32,
            "opt_rewards_earned": 64.0,
            "health": "healthy",
            "installed_at": now,
            "capacity_used": 20
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "ChainBridge",
            "icon": "link",
            "status": "running",
            "subscribers_served": 432,
            "revenue_usd": 172.80,
            "signups_driven": 18,
            "opt_rewards_earned": 36.0,
            "health": "warning",
            "installed_at": now,
            "capacity_used": 10
        }
    ]
    await db.installed_apps.insert_many(apps)
    
    # Generate earnings history (USD + OPT rewards)
    earnings_history = []
    for i in range(30):
        date = (datetime.now(timezone.utc) - timedelta(days=29-i)).strftime("%Y-%m-%d")
        earnings_history.append({
            "user_id": user_id,
            "date": date,
            "usd": round(random.uniform(25, 45), 2),  # USD from subscriptions
            "opt_rewards": round(random.uniform(2, 8), 2)  # OPT from referrals
        })
    await db.earnings_history.insert_many(earnings_history)
    
    # Initialize referral data
    referral_data = {
        "user_id": user_id,
        "operator_invites_sent": random.randint(5, 20),
        "operator_signups": random.randint(1, 5),
        "operator_opt_earned": round(random.uniform(50, 250), 2),
        "app_link_clicks": random.randint(500, 3000),
        "app_signups_driven": random.randint(50, 200),
        "app_opt_earned": round(random.uniform(100, 400), 2),
        "total_opt_earned": 0
    }
    referral_data["total_opt_earned"] = referral_data["operator_opt_earned"] + referral_data["app_opt_earned"]
    await db.referrals.insert_one(referral_data)

# ==================== NODE STATS ENDPOINTS ====================

@api_router.get("/node/stats", response_model=NodeStats)
async def get_node_stats(user=Depends(get_current_user)):
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    return NodeStats(
        node_id=node["node_id"],
        status=node["status"],
        uptime_percent=node["uptime_percent"],
        cpu_usage=node["cpu_usage"],
        memory_usage=node["memory_usage"],
        storage_usage=node["storage_usage"],
        latency_ms=node["latency_ms"],
        last_heartbeat=node["last_heartbeat"],
        reliability_score=node["reliability_score"],
        reputation_score=node["reputation_score"]
    )

@api_router.post("/node/verify")
async def verify_node(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.nodes.update_one(
        {"user_id": user["id"]},
        {"$set": {"last_heartbeat": now, "status": "healthy"}}
    )
    return {"message": "Node verified successfully", "verified_at": now}

# ==================== EARNINGS ENDPOINTS ====================

@api_router.get("/earnings", response_model=EarningsData)
async def get_earnings(user=Depends(get_current_user)):
    # Get installed apps USD earnings
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    earnings_by_app = []
    total_today_usd = 0
    total_today_opt_rewards = 0
    
    for app in apps:
        daily_usd = app.get("revenue_usd", 0) / 30
        daily_opt_rewards = app.get("opt_rewards_earned", 0) / 30
        total_today_usd += daily_usd
        total_today_opt_rewards += daily_opt_rewards
        earnings_by_app.append({
            "app_name": app["name"],
            "usd": round(daily_usd, 2),
            "subscribers": app.get("subscribers_served", 0),
            "signups_driven": app.get("signups_driven", 0),
            "opt_rewards": round(daily_opt_rewards, 2)
        })
    
    # Get history
    history = await db.earnings_history.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    week_usd = sum(h.get("usd", 0) for h in history[:7])
    month_usd = sum(h.get("usd", 0) for h in history[:30])
    week_opt = sum(h.get("opt_rewards", 0) for h in history[:7])
    month_opt = sum(h.get("opt_rewards", 0) for h in history[:30])
    
    # Get total OPT rewards from referrals
    referral_data = await db.referrals.find_one({"user_id": user["id"]}, {"_id": 0})
    total_opt_rewards = referral_data.get("total_opt_earned", 0) if referral_data else 0
    
    daily_history = [
        {
            "date": h["date"], 
            "usd": h.get("usd", 0), 
            "opt_rewards": h.get("opt_rewards", 0)
        }
        for h in reversed(history[:30])
    ]
    
    return EarningsData(
        today_usd=round(total_today_usd, 2),
        week_usd=round(week_usd, 2),
        month_usd=round(month_usd, 2),
        today_opt_rewards=round(total_today_opt_rewards, 2),
        week_opt_rewards=round(week_opt, 2),
        month_opt_rewards=round(month_opt, 2),
        total_opt_rewards=round(total_opt_rewards, 2),
        earnings_by_app=earnings_by_app,
        daily_history=daily_history
    )

# ==================== OPT PRICE (CoinMarketCap) ====================

OPT_PRICE_CACHE = {"price": 0.85, "last_updated": None}

async def get_opt_price() -> float:
    global OPT_PRICE_CACHE
    
    # Check cache (5 minutes)
    if OPT_PRICE_CACHE["last_updated"]:
        elapsed = datetime.now(timezone.utc) - OPT_PRICE_CACHE["last_updated"]
        if elapsed.total_seconds() < 300:
            return OPT_PRICE_CACHE["price"]
    
    # For OPT token (fictional), we'll use a mock price that fluctuates
    # In production, this would call CoinMarketCap API with the real token ID
    try:
        if COINMARKETCAP_API_KEY:
            # Mock realistic price behavior
            base_price = 0.85
            variation = random.uniform(-0.05, 0.05)
            price = base_price + variation
            OPT_PRICE_CACHE = {
                "price": round(price, 4),
                "last_updated": datetime.now(timezone.utc)
            }
            return OPT_PRICE_CACHE["price"]
    except Exception as e:
        logger.error(f"Error fetching OPT price: {e}")
    
    return 0.85

@api_router.get("/price/opt")
async def get_current_opt_price():
    price = await get_opt_price()
    return {
        "symbol": "OPT",
        "price_usd": price,
        "change_24h": round(random.uniform(-5, 8), 2),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

# ==================== INSTALLED APPS ENDPOINTS ====================

@api_router.get("/apps/installed", response_model=List[InstalledApp])
async def get_installed_apps(user=Depends(get_current_user)):
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for app in apps:
        result.append(InstalledApp(
            id=app["id"],
            name=app["name"],
            icon=app["icon"],
            status=app["status"],
            subscribers_served=app.get("subscribers_served", 0),
            revenue_usd=app.get("revenue_usd", 0),
            signups_driven=app.get("signups_driven", 0),
            opt_rewards_earned=app.get("opt_rewards_earned", 0),
            health=app["health"],
            installed_at=app["installed_at"]
        ))
    return result

@api_router.delete("/apps/installed/{app_id}")
async def uninstall_app(app_id: str, user=Depends(get_current_user)):
    result = await db.installed_apps.delete_one({"id": app_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="App not found")
    return {"message": "App uninstalled successfully"}

# ==================== APP FACTORY ENDPOINTS ====================

AVAILABLE_APPS = [
    # ==================== PRODUCTIVITY / FOCUS ====================
    {
        "id": "app-1",
        "name": "OneTask",
        "description": "Locks you into a single task for a set time to eliminate distraction. Perfect for deep work sessions.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 4.99,
        "revenue_share": 70,
        "revenue_per_node": 145.50,
        "active_nodes": 2450,
        "total_slots": 5000,
        "available_slots": 2550,
        "subscribers": 28400,
        "estimated_monthly_usd": 145.50,
        "capacity_required": 2,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-2",
        "name": "Top3 Today",
        "description": "Helps you choose the three most important things to do today. Simple prioritization for maximum impact.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 98.40,
        "active_nodes": 1890,
        "total_slots": 4000,
        "available_slots": 2110,
        "subscribers": 32100,
        "estimated_monthly_usd": 98.40,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-3",
        "name": "MeetTimer",
        "description": "A visual countdown timer designed for meetings. Keep your team on track and respect everyone's time.",
        "icon": "video",
        "category": "Productivity",
        "subscription_price": 3.99,
        "revenue_share": 68,
        "revenue_per_node": 112.80,
        "active_nodes": 1240,
        "total_slots": 2500,
        "available_slots": 1260,
        "subscribers": 18500,
        "estimated_monthly_usd": 112.80,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-4",
        "name": "PomoLite",
        "description": "A no-setup Pomodoro focus timer. Start working in 25-minute sprints instantly.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 1.99,
        "revenue_share": 75,
        "revenue_per_node": 78.20,
        "active_nodes": 3210,
        "total_slots": 6000,
        "available_slots": 2790,
        "subscribers": 45200,
        "estimated_monthly_usd": 78.20,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-5",
        "name": "DoneLog",
        "description": "Tracks what you completed instead of what you planned. Celebrate your wins and build momentum.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "revenue_per_node": 124.60,
        "active_nodes": 1560,
        "total_slots": 3000,
        "available_slots": 1440,
        "subscribers": 22800,
        "estimated_monthly_usd": 124.60,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-6",
        "name": "BlockDay",
        "description": "Drag-and-drop time blocking for your day. Visual planning that actually sticks.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 5.99,
        "revenue_share": 68,
        "revenue_per_node": 168.40,
        "active_nodes": 980,
        "total_slots": 2000,
        "available_slots": 1020,
        "subscribers": 14200,
        "estimated_monthly_usd": 168.40,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-7",
        "name": "StartNow",
        "description": "Pushes you to start the task you're avoiding. Beat procrastination with gentle nudges.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 92.10,
        "active_nodes": 1780,
        "total_slots": 3500,
        "available_slots": 1720,
        "subscribers": 26400,
        "estimated_monthly_usd": 92.10,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-8",
        "name": "FocusTune",
        "description": "One-tap background sounds for deep focus. Ambient noise, lo-fi beats, and nature sounds.",
        "icon": "video",
        "category": "Productivity",
        "subscription_price": 4.99,
        "revenue_share": 65,
        "revenue_per_node": 156.20,
        "active_nodes": 2120,
        "total_slots": 4000,
        "available_slots": 1880,
        "subscribers": 31500,
        "estimated_monthly_usd": 156.20,
        "capacity_required": 5,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-9",
        "name": "AntiDelay",
        "description": "Reminds you to begin tasks you keep postponing. Smart notifications that understand your patterns.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "revenue_per_node": 118.90,
        "active_nodes": 1340,
        "total_slots": 2500,
        "available_slots": 1160,
        "subscribers": 19800,
        "estimated_monthly_usd": 118.90,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-10",
        "name": "Deadline Lens",
        "description": "Visualizes how much time is left before a deadline. Never be caught off guard again.",
        "icon": "globe",
        "category": "Productivity",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 86.40,
        "active_nodes": 1650,
        "total_slots": 3000,
        "available_slots": 1350,
        "subscribers": 24100,
        "estimated_monthly_usd": 86.40,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-11",
        "name": "BreakPing",
        "description": "Sends simple reminders to take short breaks. Protect your health during long work sessions.",
        "icon": "shield",
        "category": "Productivity",
        "subscription_price": 1.99,
        "revenue_share": 75,
        "revenue_per_node": 64.80,
        "active_nodes": 2890,
        "total_slots": 5000,
        "available_slots": 2110,
        "subscribers": 38200,
        "estimated_monthly_usd": 64.80,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-12",
        "name": "Morning Flow",
        "description": "Guides you through a timed morning routine. Start every day with intention and energy.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 4.99,
        "revenue_share": 68,
        "revenue_per_node": 142.60,
        "active_nodes": 1120,
        "total_slots": 2000,
        "available_slots": 880,
        "subscribers": 16400,
        "estimated_monthly_usd": 142.60,
        "capacity_required": 2,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-13",
        "name": "ShutDown",
        "description": "Helps you properly end your workday. Review, plan tomorrow, and disconnect with peace of mind.",
        "icon": "shield",
        "category": "Productivity",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "revenue_per_node": 108.40,
        "active_nodes": 980,
        "total_slots": 2000,
        "available_slots": 1020,
        "subscribers": 14600,
        "estimated_monthly_usd": 108.40,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-14",
        "name": "WeekPad",
        "description": "A lightweight weekly planning tool. See your whole week at a glance without the clutter.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 94.20,
        "active_nodes": 1840,
        "total_slots": 3500,
        "available_slots": 1660,
        "subscribers": 27200,
        "estimated_monthly_usd": 94.20,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-15",
        "name": "TimeTally",
        "description": "Tracks how long everyday tasks actually take. Build awareness and improve your time estimates.",
        "icon": "globe",
        "category": "Productivity",
        "subscription_price": 3.99,
        "revenue_share": 68,
        "revenue_per_node": 112.80,
        "active_nodes": 1290,
        "total_slots": 2500,
        "available_slots": 1210,
        "subscribers": 19100,
        "estimated_monthly_usd": 112.80,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": False
    },
    # ==================== COMMUNICATION ====================
    {
        "id": "app-16",
        "name": "DraftBox",
        "description": "Saves unfinished or unsent messages. Never lose your thoughts before you're ready to send.",
        "icon": "shield",
        "category": "Communication",
        "subscription_price": 2.99,
        "revenue_share": 70,
        "revenue_per_node": 88.60,
        "active_nodes": 1560,
        "total_slots": 3000,
        "available_slots": 1440,
        "subscribers": 23100,
        "estimated_monthly_usd": 88.60,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-17",
        "name": "ReplyPing",
        "description": "Reminds you to reply to messages later. Never forget an important conversation again.",
        "icon": "shield",
        "category": "Communication",
        "subscription_price": 1.99,
        "revenue_share": 72,
        "revenue_per_node": 68.40,
        "active_nodes": 2340,
        "total_slots": 4500,
        "available_slots": 2160,
        "subscribers": 34800,
        "estimated_monthly_usd": 68.40,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-18",
        "name": "Subjectly",
        "description": "Generates better email subject lines. Get your emails opened with AI-powered suggestions.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 4.99,
        "revenue_share": 65,
        "revenue_per_node": 148.20,
        "active_nodes": 1120,
        "total_slots": 2000,
        "available_slots": 880,
        "subscribers": 16500,
        "estimated_monthly_usd": 148.20,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-19",
        "name": "ToneCheck",
        "description": "Reviews message tone for clarity and politeness. Avoid misunderstandings before you hit send.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 5.99,
        "revenue_share": 68,
        "revenue_per_node": 172.40,
        "active_nodes": 980,
        "total_slots": 1800,
        "available_slots": 820,
        "subscribers": 14200,
        "estimated_monthly_usd": 172.40,
        "capacity_required": 4,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-20",
        "name": "TextPolish",
        "description": "Cleans up rough text messages before sending. Quick grammar and clarity improvements.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "revenue_per_node": 118.60,
        "active_nodes": 1420,
        "total_slots": 2800,
        "available_slots": 1380,
        "subscribers": 21000,
        "estimated_monthly_usd": 118.60,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-21",
        "name": "CallNotes",
        "description": "Lets you quickly note what a call was about. Capture context before you forget.",
        "icon": "database",
        "category": "Communication",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 86.80,
        "active_nodes": 1680,
        "total_slots": 3200,
        "available_slots": 1520,
        "subscribers": 24800,
        "estimated_monthly_usd": 86.80,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-22",
        "name": "ReplyOwed",
        "description": "Tracks people who are waiting on your reply. Stay on top of your communication commitments.",
        "icon": "shield",
        "category": "Communication",
        "subscription_price": 2.99,
        "revenue_share": 70,
        "revenue_per_node": 92.40,
        "active_nodes": 1340,
        "total_slots": 2500,
        "available_slots": 1160,
        "subscribers": 19800,
        "estimated_monthly_usd": 92.40,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-23",
        "name": "DMClean",
        "description": "Organizes and archives old direct messages. Keep your inbox clean and searchable.",
        "icon": "database",
        "category": "Communication",
        "subscription_price": 3.99,
        "revenue_share": 68,
        "revenue_per_node": 108.60,
        "active_nodes": 1120,
        "total_slots": 2200,
        "available_slots": 1080,
        "subscribers": 16600,
        "estimated_monthly_usd": 108.60,
        "capacity_required": 3,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-24",
        "name": "B-Day Texts",
        "description": "Creates quick birthday messages. Never send a generic 'HBD' again.",
        "icon": "shield",
        "category": "Communication",
        "subscription_price": 1.99,
        "revenue_share": 75,
        "revenue_per_node": 62.40,
        "active_nodes": 2180,
        "total_slots": 4000,
        "available_slots": 1820,
        "subscribers": 32200,
        "estimated_monthly_usd": 62.40,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-25",
        "name": "SorrySimple",
        "description": "Helps craft thoughtful apologies. Navigate difficult conversations with grace.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 2.99,
        "revenue_share": 70,
        "revenue_per_node": 94.80,
        "active_nodes": 1460,
        "total_slots": 2800,
        "available_slots": 1340,
        "subscribers": 21600,
        "estimated_monthly_usd": 94.80,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-26",
        "name": "ThanksNote",
        "description": "Generates thank-you notes for any occasion. Express gratitude effortlessly.",
        "icon": "shield",
        "category": "Communication",
        "subscription_price": 1.99,
        "revenue_share": 72,
        "revenue_per_node": 68.20,
        "active_nodes": 1920,
        "total_slots": 3500,
        "available_slots": 1580,
        "subscribers": 28400,
        "estimated_monthly_usd": 68.20,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    # ==================== WELLNESS / MENTAL HEALTH ====================
    {
        "id": "app-27",
        "name": "MoodTap",
        "description": "One-tap daily mood tracking. Build awareness of your emotional patterns over time.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 94.60,
        "active_nodes": 2680,
        "total_slots": 5000,
        "available_slots": 2320,
        "subscribers": 39600,
        "estimated_monthly_usd": 94.60,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-28",
        "name": "BreatheEasy",
        "description": "Guides breathing to reduce anxiety. Science-backed exercises for instant calm.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "revenue_per_node": 128.40,
        "active_nodes": 2120,
        "total_slots": 4000,
        "available_slots": 1880,
        "subscribers": 31400,
        "estimated_monthly_usd": 128.40,
        "capacity_required": 2,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-29",
        "name": "StressScale",
        "description": "Rates and tracks stress over time. Identify triggers and patterns to manage better.",
        "icon": "globe",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 88.20,
        "active_nodes": 1780,
        "total_slots": 3500,
        "available_slots": 1720,
        "subscribers": 26300,
        "estimated_monthly_usd": 88.20,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-30",
        "name": "MindDump",
        "description": "A space to unload racing thoughts. Get everything out of your head and onto the page.",
        "icon": "database",
        "category": "Wellness",
        "subscription_price": 1.99,
        "revenue_share": 75,
        "revenue_per_node": 72.40,
        "active_nodes": 2340,
        "total_slots": 4500,
        "available_slots": 2160,
        "subscribers": 34600,
        "estimated_monthly_usd": 72.40,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-31",
        "name": "GratiPing",
        "description": "Sends reminders to practice gratitude. Small moments of appreciation, big mental shifts.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 1.99,
        "revenue_share": 72,
        "revenue_per_node": 68.80,
        "active_nodes": 2560,
        "total_slots": 4800,
        "available_slots": 2240,
        "subscribers": 37800,
        "estimated_monthly_usd": 68.80,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-32",
        "name": "FeelNames",
        "description": "Helps label and understand emotions. Expand your emotional vocabulary for better self-awareness.",
        "icon": "cpu",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 70,
        "revenue_per_node": 96.40,
        "active_nodes": 1680,
        "total_slots": 3200,
        "available_slots": 1520,
        "subscribers": 24800,
        "estimated_monthly_usd": 96.40,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-33",
        "name": "CalmView",
        "description": "A visual tool for calming the mind. Beautiful scenes and gentle animations for instant peace.",
        "icon": "image",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 65,
        "revenue_per_node": 118.60,
        "active_nodes": 1420,
        "total_slots": 2800,
        "available_slots": 1380,
        "subscribers": 21000,
        "estimated_monthly_usd": 118.60,
        "capacity_required": 4,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-34",
        "name": "GroundMe",
        "description": "Quick grounding exercises during panic. 5-4-3-2-1 and other techniques at your fingertips.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 94.20,
        "active_nodes": 1890,
        "total_slots": 3500,
        "available_slots": 1610,
        "subscribers": 27900,
        "estimated_monthly_usd": 94.20,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-35",
        "name": "MindLoad",
        "description": "Tracks mental clutter and emotional weight. Know when you're approaching capacity.",
        "icon": "globe",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 68,
        "revenue_per_node": 112.40,
        "active_nodes": 1340,
        "total_slots": 2600,
        "available_slots": 1260,
        "subscribers": 19800,
        "estimated_monthly_usd": 112.40,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-36",
        "name": "ReframeIt",
        "description": "Helps rewrite negative thoughts. Cognitive reframing made simple and accessible.",
        "icon": "cpu",
        "category": "Wellness",
        "subscription_price": 4.99,
        "revenue_share": 70,
        "revenue_per_node": 148.60,
        "active_nodes": 1120,
        "total_slots": 2000,
        "available_slots": 880,
        "subscribers": 16500,
        "estimated_monthly_usd": 148.60,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-37",
        "name": "EnergyCheck",
        "description": "Tracks daily energy levels. Optimize your schedule around your natural rhythms.",
        "icon": "globe",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 88.40,
        "active_nodes": 1780,
        "total_slots": 3400,
        "available_slots": 1620,
        "subscribers": 26300,
        "estimated_monthly_usd": 88.40,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-38",
        "name": "TwoMinuteZen",
        "description": "Short guided micro-meditations. Find calm in just 2 minutes, anywhere, anytime.",
        "icon": "video",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 68,
        "revenue_per_node": 122.80,
        "active_nodes": 1890,
        "total_slots": 3600,
        "available_slots": 1710,
        "subscribers": 27900,
        "estimated_monthly_usd": 122.80,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-39",
        "name": "SleepNotes",
        "description": "Records thoughts before sleep. Clear your mind and wake up refreshed.",
        "icon": "database",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 70,
        "revenue_per_node": 92.60,
        "active_nodes": 1560,
        "total_slots": 3000,
        "available_slots": 1440,
        "subscribers": 23100,
        "estimated_monthly_usd": 92.60,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-40",
        "name": "AffirmMe",
        "description": "Daily affirmations for mindset support. Start each day with positive self-talk.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 1.99,
        "revenue_share": 75,
        "revenue_per_node": 68.40,
        "active_nodes": 2780,
        "total_slots": 5200,
        "available_slots": 2420,
        "subscribers": 41100,
        "estimated_monthly_usd": 68.40,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-41",
        "name": "HardDay",
        "description": "A journal for tough days. Process difficult experiences with guided prompts.",
        "icon": "database",
        "category": "Wellness",
        "subscription_price": 2.99,
        "revenue_share": 72,
        "revenue_per_node": 94.80,
        "active_nodes": 1420,
        "total_slots": 2800,
        "available_slots": 1380,
        "subscribers": 21000,
        "estimated_monthly_usd": 94.80,
        "capacity_required": 1,
        "is_trending": False,
        "is_new": True
    }
]

@api_router.get("/apps/available", response_model=List[AvailableApp])
async def get_available_apps(
    category: Optional[str] = None,
    trending: Optional[bool] = None,
    new: Optional[bool] = None,
    user=Depends(get_current_user)
):
    apps = AVAILABLE_APPS.copy()
    
    # Get user's installed apps
    installed = await db.installed_apps.find({"user_id": user["id"]}, {"name": 1}).to_list(100)
    installed_names = {app["name"] for app in installed}
    
    # Filter out already installed apps
    apps = [a for a in apps if a["name"] not in installed_names]
    
    if category:
        apps = [a for a in apps if a["category"].lower() == category.lower()]
    if trending is not None:
        apps = [a for a in apps if a["is_trending"] == trending]
    if new is not None:
        apps = [a for a in apps if a["is_new"] == new]
    
    result = []
    for app in apps:
        result.append(AvailableApp(
            id=app["id"],
            name=app["name"],
            description=app["description"],
            icon=app["icon"],
            category=app["category"],
            subscription_price=app["subscription_price"],
            revenue_share=app["revenue_share"],
            revenue_per_node=app["revenue_per_node"],
            active_nodes=app["active_nodes"],
            total_slots=app["total_slots"],
            available_slots=app["available_slots"],
            subscribers=app["subscribers"],
            estimated_monthly_usd=app["estimated_monthly_usd"],
            capacity_required=app["capacity_required"],
            is_trending=app["is_trending"],
            is_new=app["is_new"]
        ))
    
    return result

@api_router.post("/apps/install/{app_id}")
async def install_app(app_id: str, user=Depends(get_current_user)):
    app_data = next((a for a in AVAILABLE_APPS if a["id"] == app_id), None)
    if not app_data:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Check capacity
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    available = node["total_capacity"] - node["used_capacity"]
    if app_data["capacity_required"] > available:
        raise HTTPException(status_code=400, detail="Insufficient capacity")
    
    now = datetime.now(timezone.utc).isoformat()
    new_app = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": app_data["name"],
        "icon": app_data["icon"],
        "status": "running",
        "subscribers_served": 0,
        "revenue_opt": 0,
        "revenue_usd": 0,
        "health": "healthy",
        "installed_at": now,
        "capacity_used": app_data["capacity_required"]
    }
    
    await db.installed_apps.insert_one(new_app)
    await db.nodes.update_one(
        {"user_id": user["id"]},
        {"$inc": {"used_capacity": app_data["capacity_required"]}}
    )
    
    return {"message": f"{app_data['name']} installed successfully", "app_id": new_app["id"]}

# ==================== PROMOTION & REFERRAL ENDPOINTS ====================

@api_router.get("/referral/code")
async def get_referral_code(user=Depends(get_current_user)):
    """Get user's unique referral code and links"""
    referral_code = user.get("referral_code")
    if not referral_code:
        # Generate for existing users who don't have one
        referral_code = generate_referral_code(user["id"])
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"referral_code": referral_code}}
        )
    
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    
    return {
        "referral_code": referral_code,
        "referral_link": f"{base_url}/signup?ref={referral_code}",
        "operator_referral_link": f"{base_url}/join?ref={referral_code}"
    }

@api_router.post("/referral/click")
async def track_referral_click(click_data: ReferralClick):
    """Track a click on a referral link (public endpoint)"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Find referrer by code
    referrer = await db.users.find_one({"referral_code": click_data.referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Log the click
    click_record = {
        "id": str(uuid.uuid4()),
        "referral_code": click_data.referral_code,
        "referrer_id": referrer["id"],
        "source": click_data.source or "direct",
        "app_id": click_data.app_id,
        "click_type": "app" if click_data.app_id else "operator",
        "created_at": now
    }
    await db.referral_clicks.insert_one(click_record)
    
    # Update click stats
    click_field = "app_clicks" if click_data.app_id else "operator_clicks"
    await db.referral_stats.update_one(
        {"user_id": referrer["id"]},
        {"$inc": {click_field: 1}},
        upsert=True
    )
    
    # If app-specific, update app referral stats
    if click_data.app_id:
        await db.app_referral_stats.update_one(
            {"user_id": referrer["id"], "app_id": click_data.app_id},
            {"$inc": {"clicks": 1}, "$set": {"updated_at": now}},
            upsert=True
        )
    
    return {"message": "Click tracked", "referrer_id": referrer["id"][:8]}

@api_router.post("/referral/app-signup")
async def track_app_signup(app_id: str, referral_code: str):
    """Track an app user signup via referral (called when user signs up for an app)"""
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Verify the referrer hosts this app
    hosted_app = await db.installed_apps.find_one({"user_id": referrer["id"], "id": app_id}, {"_id": 0})
    if not hosted_app:
        raise HTTPException(status_code=400, detail="Referrer does not host this app")
    
    now = datetime.now(timezone.utc).isoformat()
    opt_reward = 2.0  # OPT reward for app user signups
    
    # Create referral conversion record
    conversion_record = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referral_code": referral_code,
        "referral_type": "app_user",
        "app_id": app_id,
        "app_name": hosted_app["name"],
        "opt_reward": opt_reward,
        "status": "pending",
        "created_at": now
    }
    await db.referral_conversions.insert_one(conversion_record)
    
    # Update referrer's stats
    await db.referral_stats.update_one(
        {"user_id": referrer["id"]},
        {
            "$inc": {
                "app_signups": 1,
                "app_pending_opt": opt_reward,
                "total_pending_opt": opt_reward
            }
        },
        upsert=True
    )
    
    # Update app-specific stats
    await db.app_referral_stats.update_one(
        {"user_id": referrer["id"], "app_id": app_id},
        {
            "$inc": {"signups": 1, "opt_earned": opt_reward},
            "$set": {"app_name": hosted_app["name"], "updated_at": now}
        },
        upsert=True
    )
    
    return {"message": "App signup referral tracked", "opt_reward": opt_reward}

@api_router.get("/referral/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(user=Depends(get_current_user)):
    """Get user's referral statistics"""
    # Get or create referral stats
    stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0})
    if not stats:
        stats = {
            "user_id": user["id"],
            "operator_clicks": 0,
            "operator_signups": 0,
            "operator_opt_earned": 0.0,
            "operator_pending_opt": 0.0,
            "app_clicks": 0,
            "app_signups": 0,
            "app_opt_earned": 0.0,
            "app_pending_opt": 0.0,
            "total_opt_earned": 0.0,
            "total_pending_opt": 0.0
        }
        await db.referral_stats.insert_one({**stats, "created_at": datetime.now(timezone.utc).isoformat()})
    
    # Get referral code
    referral_code = user.get("referral_code") or generate_referral_code(user["id"])
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    
    # Get per-app referral stats
    app_stats = await db.app_referral_stats.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    # Get installed apps to ensure we have links for all
    installed_apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    app_stats_map = {s["app_id"]: s for s in app_stats}
    
    app_referral_stats = []
    for app in installed_apps:
        existing = app_stats_map.get(app["id"], {})
        app_referral_stats.append({
            "app_id": app["id"],
            "app_name": app["name"],
            "referral_link": f"{base_url}/app/{app['id'][:8]}?ref={referral_code}",
            "clicks": existing.get("clicks", 0),
            "signups": existing.get("signups", 0),
            "opt_earned": existing.get("opt_earned", 0.0)
        })
    
    # Get recent referral activity
    recent = await db.referral_conversions.find(
        {"referrer_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    recent_referrals = []
    for r in recent:
        time_diff = datetime.now(timezone.utc) - datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
        if time_diff.days > 0:
            time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
        elif time_diff.seconds > 3600:
            hours = time_diff.seconds // 3600
            time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            mins = time_diff.seconds // 60
            time_str = f"{mins} minute{'s' if mins > 1 else ''} ago"
        
        recent_referrals.append({
            "type": r["referral_type"],
            "app_name": r.get("app_name"),
            "opt_reward": r["opt_reward"],
            "status": r["status"],
            "time": time_str
        })
    
    return ReferralStatsResponse(
        referral_code=referral_code,
        operator_referral_link=f"{base_url}/join?ref={referral_code}",
        operator_clicks=stats.get("operator_clicks", 0),
        operator_signups=stats.get("operator_signups", 0),
        operator_opt_earned=stats.get("operator_opt_earned", 0.0),
        operator_pending_opt=stats.get("operator_pending_opt", 0.0),
        app_clicks=stats.get("app_clicks", 0),
        app_signups=stats.get("app_signups", 0),
        app_opt_earned=stats.get("app_opt_earned", 0.0),
        app_pending_opt=stats.get("app_pending_opt", 0.0),
        total_opt_earned=stats.get("total_opt_earned", 0.0),
        total_pending_opt=stats.get("total_pending_opt", 0.0),
        app_referral_stats=app_referral_stats,
        recent_referrals=recent_referrals
    )

@api_router.post("/referral/confirm/{conversion_id}")
async def confirm_referral(conversion_id: str, user=Depends(get_current_user)):
    """Admin endpoint to confirm a pending referral and move OPT from pending to earned"""
    # This would typically be called by an admin or automated system
    conversion = await db.referral_conversions.find_one({"id": conversion_id}, {"_id": 0})
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    if conversion["status"] != "pending":
        raise HTTPException(status_code=400, detail="Conversion already processed")
    
    opt_reward = conversion["opt_reward"]
    referral_type = conversion["referral_type"]
    
    # Update conversion status
    await db.referral_conversions.update_one(
        {"id": conversion_id},
        {"$set": {"status": "confirmed", "confirmed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Move from pending to earned
    pending_field = "operator_pending_opt" if referral_type == "operator" else "app_pending_opt"
    earned_field = "operator_opt_earned" if referral_type == "operator" else "app_opt_earned"
    
    await db.referral_stats.update_one(
        {"user_id": conversion["referrer_id"]},
        {
            "$inc": {
                pending_field: -opt_reward,
                earned_field: opt_reward,
                "total_pending_opt": -opt_reward,
                "total_opt_earned": opt_reward
            }
        }
    )
    
    return {"message": "Referral confirmed", "opt_earned": opt_reward}

# Legacy promotion stats endpoint (for backward compatibility)
@api_router.get("/promotion/stats", response_model=PromotionStats)
async def get_promotion_stats(user=Depends(get_current_user)):
    """Get promotion stats (uses new referral system)"""
    # Get referral stats
    stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0})
    if not stats:
        stats = {
            "operator_clicks": 0,
            "operator_signups": 0,
            "operator_opt_earned": 0.0,
            "app_clicks": 0,
            "app_signups": 0,
            "app_opt_earned": 0.0
        }
    
    # Get referral code
    referral_code = user.get("referral_code") or generate_referral_code(user["id"])
    base_url = os.environ.get("FRONTEND_URL", "https://napp.io")
    
    # Get per-app stats
    app_stats = await db.app_referral_stats.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    installed_apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    app_stats_map = {s["app_id"]: s for s in app_stats}
    
    app_share_links = []
    for app in installed_apps:
        existing = app_stats_map.get(app["id"], {})
        app_share_links.append({
            "app_name": app["name"],
            "app_id": app["id"],
            "url": f"{base_url}/app/{app['id'][:8]}?ref={referral_code}",
            "signups": existing.get("signups", 0),
            "opt_earned": existing.get("opt_earned", 0.0)
        })
    
    # Get recent activity from real conversions
    recent = await db.referral_conversions.find(
        {"referrer_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    recent_activity = []
    for r in recent:
        time_diff = datetime.now(timezone.utc) - datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
        if time_diff.days > 0:
            time_str = f"{time_diff.days} day{'s' if time_diff.days > 1 else ''} ago"
        elif time_diff.seconds > 3600:
            hours = time_diff.seconds // 3600
            time_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
        else:
            mins = max(1, time_diff.seconds // 60)
            time_str = f"{mins} minute{'s' if mins > 1 else ''} ago"
        
        if r["referral_type"] == "operator":
            recent_activity.append({
                "type": "operator_signup",
                "user": "new_op***",
                "opt_reward": r["opt_reward"],
                "time": time_str
            })
        else:
            recent_activity.append({
                "type": "app_signup",
                "app": r.get("app_name", "Unknown App"),
                "user": "user***",
                "opt_reward": r["opt_reward"],
                "time": time_str
            })
    
    return PromotionStats(
        app_link_clicks=stats.get("app_clicks", 0),
        app_signups_driven=stats.get("app_signups", 0),
        app_opt_rewards=stats.get("app_opt_earned", 0.0) + stats.get("app_pending_opt", 0.0),
        operator_invites_sent=stats.get("operator_clicks", 0),
        operator_signups=stats.get("operator_signups", 0),
        operator_opt_rewards=stats.get("operator_opt_earned", 0.0) + stats.get("operator_pending_opt", 0.0),
        app_share_links=app_share_links,
        operator_referral_link=f"{base_url}/join?ref={referral_code}",
        recent_activity=recent_activity
    )

# ==================== CAPACITY ENDPOINTS ====================

@api_router.get("/capacity", response_model=CapacityData)
async def get_capacity(user=Depends(get_current_user)):
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    app_usage = [
        {"name": app["name"], "capacity": app.get("capacity_used", 10)}
        for app in apps
    ]
    
    return CapacityData(
        total_capacity=node["total_capacity"],
        used_capacity=node["used_capacity"],
        available_capacity=node["total_capacity"] - node["used_capacity"],
        app_usage=app_usage
    )

# ==================== PAYOUTS ENDPOINTS ====================

@api_router.get("/payouts", response_model=List[PayoutRecord])
async def get_payouts(user=Depends(get_current_user)):
    # Generate mock payout history
    payouts = []
    for i in range(5):
        date = (datetime.now(timezone.utc) - timedelta(days=i*7)).strftime("%Y-%m-%d")
        opt_amount = round(random.uniform(50, 150), 2)
        payouts.append(PayoutRecord(
            id=str(uuid.uuid4()),
            date=date,
            amount_opt=opt_amount,
            amount_usd=round(opt_amount * 0.85, 2),
            status="completed" if i > 0 else "pending",
            tx_hash=f"0x{uuid.uuid4().hex}" if i > 0 else None
        ))
    return payouts

# ==================== AI RECOMMENDATIONS ====================

@api_router.get("/ai/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(user=Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get user context
        node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
        apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
        
        context = f"""
        Node Status: {node['status']}
        Uptime: {node['uptime_percent']}%
        CPU Usage: {node['cpu_usage']}%
        Memory Usage: {node['memory_usage']}%
        Storage Usage: {node['storage_usage']}%
        Capacity Used: {node['used_capacity']}/{node['total_capacity']}
        Installed Apps: {', '.join(a['name'] for a in apps)}
        """
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommendations-{user['id']}",
            system_message="""You are an AI assistant for NAPP Node operators. Generate 3 actionable recommendations to help them maximize earnings and optimize their node. 
            Return JSON array with objects containing: type (earnings/optimization/promotion/app), title, description, action (optional button text), priority (high/medium/low).
            Keep responses concise and actionable."""
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=f"Based on this node data, give 3 recommendations:\n{context}")
        response = await chat.send_message(user_msg)
        
        # Parse response
        import json
        try:
            recommendations = json.loads(response)
            return [AIRecommendation(**r) for r in recommendations[:3]]
        except:
            pass
    except Exception as e:
        logger.error(f"AI recommendations error: {e}")
    
    # Fallback recommendations
    return [
        AIRecommendation(
            type="app",
            title="Install AI Inference Hub",
            description="Based on your node capacity, AI Inference Hub could increase your monthly earnings by 40%.",
            action="View App",
            priority="high"
        ),
        AIRecommendation(
            type="optimization",
            title="Optimize Memory Usage",
            description="Your memory usage is at 58%. Consider upgrading to handle more concurrent requests.",
            action="View Upgrades",
            priority="medium"
        ),
        AIRecommendation(
            type="promotion",
            title="Share Your Referral Link",
            description="You have 156 referrals. Sharing on Twitter could double your referral bonus.",
            action="Share Now",
            priority="low"
        )
    ]

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    return [
        {"id": "1", "type": "success", "message": "Daily verification complete", "time": "2 hours ago", "read": False},
        {"id": "2", "type": "info", "message": "New app available: AI Inference Hub", "time": "5 hours ago", "read": False},
        {"id": "3", "type": "warning", "message": "ChainBridge needs attention", "time": "1 day ago", "read": True},
        {"id": "4", "type": "success", "message": "Weekly payout processed: 125.5 OPT", "time": "3 days ago", "read": True}
    ]

# ==================== APP DEVELOPER ENDPOINTS ====================

FEATURED_PLANS = {
    "30_days": {"price": 29.00, "days": 30},
    "60_days": {"price": 59.00, "days": 60}
}

@api_router.post("/developer/submit")
async def submit_app(submission: AppSubmissionCreate, user=Depends(get_current_user)):
    """Submit a new app for approval"""
    if not submission.terms_accepted:
        raise HTTPException(status_code=400, detail="You must accept the terms of service")
    
    now = datetime.now(timezone.utc).isoformat()
    submission_id = str(uuid.uuid4())
    
    submission_doc = {
        "id": submission_id,
        "user_id": user["id"],
        "app_name": submission.app_name,
        "description": submission.description,
        "category": submission.category,
        "resources_required": submission.resources_required,
        "monthly_subscription_fee": submission.monthly_subscription_fee,
        "revenue_sharing": submission.revenue_sharing,
        "nodes_available": submission.nodes_available,
        "github_url": submission.github_url,
        "documentation_url": submission.documentation_url,
        "contact_email": submission.contact_email,
        "icon_url": None,
        "code_file_url": None,
        "status": "pending",
        "featured": False,
        "featured_until": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.app_submissions.insert_one(submission_doc)
    
    return {
        "message": "App submitted successfully",
        "submission_id": submission_id,
        "status": "pending"
    }

@api_router.post("/developer/upload-icon/{submission_id}")
async def upload_app_icon(submission_id: str, user=Depends(get_current_user)):
    """Upload SVG icon for app submission (returns upload URL placeholder)"""
    submission = await db.app_submissions.find_one({
        "id": submission_id,
        "user_id": user["id"]
    })
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # In production, this would return a pre-signed URL for direct upload
    # For now, we'll simulate storing the icon
    icon_url = f"/uploads/icons/{submission_id}.svg"
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {"icon_url": icon_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Icon uploaded successfully", "icon_url": icon_url}

@api_router.post("/developer/upload-code/{submission_id}")
async def upload_app_code(submission_id: str, user=Depends(get_current_user)):
    """Upload code file for app submission"""
    submission = await db.app_submissions.find_one({
        "id": submission_id,
        "user_id": user["id"]
    })
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # In production, this would return a pre-signed URL for direct upload
    code_url = f"/uploads/code/{submission_id}.zip"
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {"code_file_url": code_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Code uploaded successfully", "code_url": code_url}

@api_router.get("/developer/submissions", response_model=List[AppSubmissionResponse])
async def get_my_submissions(user=Depends(get_current_user)):
    """Get all app submissions by the current user"""
    submissions = await db.app_submissions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [AppSubmissionResponse(**s) for s in submissions]

@api_router.get("/developer/submission/{submission_id}", response_model=AppSubmissionResponse)
async def get_submission(submission_id: str, user=Depends(get_current_user)):
    """Get a specific submission"""
    submission = await db.app_submissions.find_one(
        {"id": submission_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return AppSubmissionResponse(**submission)

# ==================== FEATURED LISTING PAYMENTS ====================

@api_router.post("/developer/featured/checkout")
async def create_featured_checkout(request: FeaturedListingRequest, http_request: Request, user=Depends(get_current_user)):
    """Create a Stripe checkout session for featured listing"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    # Validate submission exists and belongs to user
    submission = await db.app_submissions.find_one({
        "id": request.submission_id,
        "user_id": user["id"]
    })
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Validate plan
    if request.plan not in FEATURED_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose '30_days' or '60_days'")
    
    plan = FEATURED_PLANS[request.plan]
    
    # Initialize Stripe
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Build URLs using frontend origin
    success_url = f"{request.origin_url}/app-developer?session_id={{CHECKOUT_SESSION_ID}}&success=true"
    cancel_url = f"{request.origin_url}/app-developer?canceled=true"
    
    try:
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=plan["price"],
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "featured_listing",
                "user_id": user["id"],
                "submission_id": request.submission_id,
                "plan": request.plan,
                "days": str(plan["days"])
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": user["id"],
            "submission_id": request.submission_id,
            "amount": plan["price"],
            "currency": "usd",
            "plan": request.plan,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        error_msg = str(e)
        if "account or business name" in error_msg.lower():
            raise HTTPException(
                status_code=400, 
                detail="Stripe account needs to be configured with a business name. Please visit your Stripe dashboard to complete setup."
            )
        raise HTTPException(status_code=500, detail=f"Payment service error: {error_msg}")

@api_router.get("/developer/featured/status/{session_id}")
async def check_featured_payment_status(session_id: str, user=Depends(get_current_user)):
    """Check the status of a featured listing payment"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    # Find the transaction
    transaction = await db.payment_transactions.find_one({
        "session_id": session_id,
        "user_id": user["id"]
    })
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return cached status
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "message": "Payment successful! Your app is now featured."
        }
    
    # Check with Stripe
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        if checkout_status.payment_status == "paid":
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update submission to featured
            days = int(checkout_status.metadata.get("days", 30))
            featured_until = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
            
            await db.app_submissions.update_one(
                {"id": transaction["submission_id"]},
                {"$set": {
                    "featured": True,
                    "featured_until": featured_until,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "status": "complete",
                "payment_status": "paid",
                "message": f"Payment successful! Your app is featured for {days} days."
            }
        elif checkout_status.status == "expired":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "expired"}}
            )
            return {
                "status": "expired",
                "payment_status": "expired",
                "message": "Payment session expired. Please try again."
            }
        else:
            return {
                "status": checkout_status.status,
                "payment_status": checkout_status.payment_status,
                "message": "Payment is being processed..."
            }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        return {
            "status": "error",
            "payment_status": "unknown",
            "message": "Unable to verify payment status"
        }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Update transaction and submission
            session_id = webhook_response.session_id
            
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                days = int(webhook_response.metadata.get("days", 30))
                featured_until = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
                
                await db.app_submissions.update_one(
                    {"id": transaction["submission_id"]},
                    {"$set": {
                        "featured": True,
                        "featured_until": featured_until,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ==================== FEATURED APPS FOR APP FACTORY ====================

# Mock featured apps for demo (these would come from paid featured listings in production)
MOCK_FEATURED_APPS = [
    {
        "id": "featured-1",
        "name": "FocusTune",
        "description": "One-tap background sounds for deep focus. Ambient noise, lo-fi beats, and nature sounds.",
        "category": "Productivity",
        "subscription_price": 4.99,
        "revenue_share": 65,
        "capacity_required": 5,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-15T00:00:00Z"
    },
    {
        "id": "featured-2",
        "name": "ToneCheck",
        "description": "Reviews message tone for clarity and politeness. Avoid misunderstandings before you hit send.",
        "category": "Communication",
        "subscription_price": 5.99,
        "revenue_share": 68,
        "capacity_required": 4,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-20T00:00:00Z"
    },
    {
        "id": "featured-3",
        "name": "ReframeIt",
        "description": "Helps rewrite negative thoughts. Cognitive reframing made simple and accessible.",
        "category": "Wellness",
        "subscription_price": 4.99,
        "revenue_share": 70,
        "capacity_required": 3,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-18T00:00:00Z"
    },
    {
        "id": "featured-4",
        "name": "BlockDay",
        "description": "Drag-and-drop time blocking for your day. Visual planning that actually sticks.",
        "category": "Productivity",
        "subscription_price": 5.99,
        "revenue_share": 68,
        "capacity_required": 3,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-25T00:00:00Z"
    },
    {
        "id": "featured-5",
        "name": "BreatheEasy",
        "description": "Guides breathing to reduce anxiety. Science-backed exercises for instant calm.",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 70,
        "capacity_required": 2,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-22T00:00:00Z"
    }
]

@api_router.get("/apps/featured")
async def get_featured_apps():
    """Get currently featured apps for display in App Factory"""
    now = datetime.now(timezone.utc).isoformat()
    
    # First check for real featured apps from database
    featured = await db.app_submissions.find({
        "featured": True,
        "featured_until": {"$gt": now},
        "status": "approved"
    }, {"_id": 0}).to_list(10)
    
    # Transform database results to display format
    result = []
    for app in featured:
        result.append({
            "id": app["id"],
            "name": app["app_name"],
            "description": app["description"],
            "category": app["category"],
            "subscription_price": app["monthly_subscription_fee"],
            "revenue_share": app["revenue_sharing"],
            "capacity_required": app["resources_required"],
            "icon_url": app.get("icon_url"),
            "is_featured": True,
            "featured_until": app["featured_until"]
        })
    
    # If no real featured apps, return mock featured apps for demo
    if not result:
        return MOCK_FEATURED_APPS
    
    return result

# ==================== ROOT & HEALTH ====================

# ==================== ADMIN API ENDPOINTS ====================

# Admin Router
admin_router = APIRouter(prefix="/api/admin")

# --- Admin Authentication ---

@admin_router.post("/auth/login")
async def admin_login(login_data: AdminLogin):
    """Admin login endpoint with 2FA support"""
    admin = await db.admins.find_one({"email": login_data.email})
    
    if not admin or not verify_password(login_data.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account suspended")
    
    two_fa_enabled = admin.get("two_factor_enabled", False)
    
    # Check if 2FA is enabled
    if two_fa_enabled:
        if not login_data.totp_code:
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication code required",
                "access_token": None,
                "admin": None
            }
        
        # Verify TOTP code
        totp_secret = admin.get("totp_secret")
        if not totp_secret or not verify_totp(totp_secret, login_data.totp_code):
            # Check backup codes
            backup_codes = admin.get("backup_codes", [])
            if login_data.totp_code in backup_codes:
                backup_codes.remove(login_data.totp_code)
                await db.admins.update_one(
                    {"id": admin["id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
            else:
                raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    # Update last login
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_token(admin["id"], is_admin=True)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "admin": {
            "id": admin["id"],
            "email": admin["email"],
            "name": admin["name"],
            "role": admin["role"],
            "permissions": ROLE_PERMISSIONS.get(admin["role"], []),
            "two_factor_enabled": two_fa_enabled
        }
    }

@admin_router.get("/auth/me")
async def get_admin_profile(admin=Depends(get_current_admin)):
    """Get current admin profile"""
    return {
        "id": admin["id"],
        "email": admin["email"],
        "name": admin["name"],
        "role": admin["role"],
        "permissions": ROLE_PERMISSIONS.get(admin["role"], []),
        "is_active": admin.get("is_active", True),
        "last_login": admin.get("last_login"),
        "created_at": admin["created_at"],
        "two_factor_enabled": admin.get("two_factor_enabled", False)
    }

# ==================== 2FA ENDPOINTS (ADMIN) ====================

@admin_router.post("/auth/2fa/setup")
async def admin_setup_2fa(admin=Depends(get_current_admin)):
    """Initialize 2FA setup for admin"""
    if admin.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, admin["email"])
    qr_code = generate_qr_code(uri)
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"pending_totp_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "provisioning_uri": uri
    }

@admin_router.post("/auth/2fa/verify")
async def admin_verify_2fa_setup(verify_data: TwoFactorVerifyRequest, admin=Depends(get_current_admin)):
    """Verify 2FA setup for admin"""
    pending_secret = admin.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found")
    
    if not verify_totp(pending_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    backup_codes = generate_backup_codes()
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {
            "$set": {
                "totp_secret": pending_secret,
                "two_factor_enabled": True,
                "backup_codes": backup_codes,
                "two_factor_enabled_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {"pending_totp_secret": ""}
        }
    )
    
    # Log 2FA setup
    await log_admin_action(admin["id"], admin["email"], "2FA_ENABLED", "admin", admin["id"], {}, None)
    
    return {
        "message": "Two-factor authentication enabled successfully",
        "backup_codes": backup_codes
    }

@admin_router.post("/auth/2fa/disable")
async def admin_disable_2fa(verify_data: TwoFactorVerifyRequest, admin=Depends(get_current_admin)):
    """Disable 2FA for admin"""
    if not admin.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = admin.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        backup_codes = admin.get("backup_codes", [])
        if verify_data.code not in backup_codes:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"totp_secret": "", "backup_codes": "", "pending_totp_secret": ""}
        }
    )
    
    await log_admin_action(admin["id"], admin["email"], "2FA_DISABLED", "admin", admin["id"], {}, None)
    
    return {"message": "Two-factor authentication disabled successfully"}

@admin_router.get("/auth/2fa/status")
async def admin_get_2fa_status(admin=Depends(get_current_admin)):
    """Get admin 2FA status"""
    return {
        "two_factor_enabled": admin.get("two_factor_enabled", False),
        "enabled_at": admin.get("two_factor_enabled_at"),
        "backup_codes_remaining": len(admin.get("backup_codes", []))
    }

@admin_router.post("/auth/create")
async def create_admin(admin_data: AdminCreate, current_admin=Depends(get_current_admin), request: Request = None):
    """Create new admin (Super Admin only)"""
    if current_admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create admin accounts")
    
    if admin_data.role not in ADMIN_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ADMIN_ROLES}")
    
    existing = await db.admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    new_admin = {
        "id": admin_id,
        "email": admin_data.email,
        "hashed_password": hash_password(admin_data.password),
        "name": admin_data.name,
        "role": admin_data.role,
        "is_active": True,
        "last_login": None,
        "created_at": now,
        "created_by": current_admin["id"]
    }
    
    await db.admins.insert_one(new_admin)
    await log_admin_action(current_admin, "create_admin", "admin", admin_id, {"email": admin_data.email, "role": admin_data.role}, request)
    
    return {"message": "Admin created successfully", "admin_id": admin_id}

# --- Dashboard Stats ---

@admin_router.get("/dashboard/stats")
async def get_admin_dashboard_stats(admin=Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    # Count users
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": {"$ne": False}})
    
    # Count app submissions
    pending_apps = await db.app_submissions.count_documents({"status": "pending"})
    approved_apps = await db.app_submissions.count_documents({"status": "approved"})
    rejected_apps = await db.app_submissions.count_documents({"status": "rejected"})
    
    # Count support tickets
    open_tickets = await db.support_tickets.count_documents({"status": {"$in": ["open", "in_progress"]}})
    
    # Count nodes (mock for now)
    total_nodes = 12450
    healthy_nodes = 11892
    warning_nodes = 423
    offline_nodes = 135
    
    # Revenue (mock)
    total_revenue = 2456789.50
    monthly_revenue = 342567.80
    
    # Failed payments (mock)
    failed_payments = 23
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "suspended": total_users - active_users
        },
        "nodes": {
            "total": total_nodes,
            "healthy": healthy_nodes,
            "warning": warning_nodes,
            "offline": offline_nodes
        },
        "apps": {
            "pending": pending_apps,
            "approved": approved_apps,
            "rejected": rejected_apps,
            "total": pending_apps + approved_apps + rejected_apps
        },
        "support": {
            "open_tickets": open_tickets
        },
        "billing": {
            "failed_payments": failed_payments
        },
        "revenue": {
            "total": total_revenue,
            "monthly": monthly_revenue
        }
    }

# --- Users Management ---

@admin_router.get("/users")
async def list_users(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List all users with filtering"""
    if not check_admin_permission(admin, "users:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"id": search}
        ]
    if status == "active":
        query["is_active"] = {"$ne": False}
    elif status == "suspended":
        query["is_active"] = False
    
    users = await db.users.find(query, {"_id": 0, "hashed_password": 0}).skip(offset).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "limit": limit, "offset": offset}

@admin_router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin=Depends(get_current_admin)):
    """Get detailed user information"""
    if not check_admin_permission(admin, "users:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's installed apps
    installed_apps = await db.installed_apps.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Get user's app submissions
    submissions = await db.app_submissions.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    return {
        **user,
        "installed_apps": installed_apps,
        "app_submissions": submissions
    }

@admin_router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, action: UserSuspendAction, admin=Depends(get_current_admin), request: Request = None):
    """Suspend a user account"""
    if not check_admin_permission(admin, "users:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "suspended_at": datetime.now(timezone.utc).isoformat(), "suspension_reason": action.reason}}
    )
    
    await log_admin_action(admin, "suspend_user", "user", user_id, {"reason": action.reason}, request)
    
    return {"message": "User suspended successfully"}

@admin_router.post("/users/{user_id}/reinstate")
async def reinstate_user(user_id: str, admin=Depends(get_current_admin), request: Request = None):
    """Reinstate a suspended user account"""
    if not check_admin_permission(admin, "users:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": True}, "$unset": {"suspended_at": "", "suspension_reason": ""}}
    )
    
    await log_admin_action(admin, "reinstate_user", "user", user_id, {}, request)
    
    return {"message": "User reinstated successfully"}

# --- Nodes Management ---

@admin_router.get("/nodes")
async def list_nodes(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List all nodes with filtering"""
    if not check_admin_permission(admin, "nodes:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Mock node data for now
    nodes = [
        {"id": f"node-{i}", "owner_id": f"user-{i%100}", "owner_email": f"user{i}@example.com", 
         "status": "healthy" if i % 10 != 0 else ("warning" if i % 20 != 0 else "offline"),
         "license_status": "active", "capacity_tier": "pro" if i % 3 == 0 else "basic",
         "capacity_gb": 100 if i % 3 == 0 else 50, "used_gb": random.randint(20, 80),
         "installed_apps": random.randint(1, 8), "monthly_earnings": round(random.uniform(50, 500), 2),
         "uptime_percent": round(random.uniform(95, 99.99), 2), "last_seen": datetime.now(timezone.utc).isoformat()}
        for i in range(1, 51)
    ]
    
    if status:
        nodes = [n for n in nodes if n["status"] == status]
    
    return {"nodes": nodes[offset:offset+limit], "total": len(nodes), "limit": limit, "offset": offset}

@admin_router.get("/nodes/{node_id}")
async def get_node_detail(node_id: str, admin=Depends(get_current_admin)):
    """Get detailed node information"""
    if not check_admin_permission(admin, "nodes:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Mock node detail
    node = {
        "id": node_id,
        "owner_id": "user-123",
        "owner_email": "nodeowner@example.com",
        "owner_name": "John Operator",
        "status": "healthy",
        "license_status": "active",
        "license_expires": "2025-12-31T00:00:00Z",
        "capacity_tier": "pro",
        "capacity_gb": 100,
        "used_gb": 67,
        "installed_apps": [
            {"id": "app-1", "name": "OneTask", "installed_at": "2025-01-01T00:00:00Z"},
            {"id": "app-2", "name": "FocusTune", "installed_at": "2025-01-05T00:00:00Z"}
        ],
        "earnings": {
            "total_usd": 2456.78,
            "total_opt": 1234.56,
            "this_month_usd": 342.50,
            "this_month_opt": 156.20
        },
        "uptime_history": [
            {"date": "2025-01-10", "uptime_percent": 99.8},
            {"date": "2025-01-11", "uptime_percent": 99.9},
            {"date": "2025-01-12", "uptime_percent": 100.0}
        ],
        "flags": [],
        "created_at": "2024-06-15T00:00:00Z"
    }
    
    return node

@admin_router.post("/nodes/{node_id}/action")
async def node_action(node_id: str, action: NodeAction, admin=Depends(get_current_admin), request: Request = None):
    """Perform action on a node (flag, suspend, reinstate, adjust_capacity)"""
    if not check_admin_permission(admin, "nodes:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    valid_actions = ["flag", "suspend", "reinstate", "adjust_capacity"]
    if action.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    await log_admin_action(admin, f"node_{action.action}", "node", node_id, 
                          {"reason": action.reason, "new_capacity": action.new_capacity}, request)
    
    return {"message": f"Node {action.action} action completed successfully"}

# --- App Submissions Review ---

@admin_router.get("/apps/submissions")
async def list_app_submissions(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List all app submissions for review"""
    if not check_admin_permission(admin, "apps:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    submissions = await db.app_submissions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.app_submissions.count_documents(query)
    
    # Enrich with user info
    for sub in submissions:
        user = await db.users.find_one({"id": sub.get("user_id")}, {"_id": 0, "hashed_password": 0})
        sub["developer"] = user
    
    return {"submissions": submissions, "total": total, "limit": limit, "offset": offset}

@admin_router.get("/apps/submissions/{submission_id}")
async def get_app_submission_detail(submission_id: str, admin=Depends(get_current_admin)):
    """Get detailed app submission for review"""
    if not check_admin_permission(admin, "apps:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Get developer info
    user = await db.users.find_one({"id": submission.get("user_id")}, {"_id": 0, "hashed_password": 0})
    submission["developer"] = user
    
    # Get review history
    reviews = await db.app_reviews.find({"submission_id": submission_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    submission["review_history"] = reviews
    
    return submission

@admin_router.post("/apps/submissions/{submission_id}/review")
async def review_app_submission(submission_id: str, review: AppReviewAction, admin=Depends(get_current_admin), request: Request = None):
    """Review an app submission (approve, reject, request_changes)"""
    if not check_admin_permission(admin, "apps:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    valid_actions = ["approve", "reject", "request_changes"]
    if review.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Map action to status
    status_map = {
        "approve": "approved",
        "reject": "rejected",
        "request_changes": "needs_revision"
    }
    
    # Update submission status
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "status": status_map[review.action],
            "reviewed_by": admin["id"],
            "reviewed_at": now,
            "review_reason": review.reason,
            "compliance_notes": review.compliance_notes,
            "updated_at": now
        }}
    )
    
    # Create review record
    review_record = {
        "id": str(uuid.uuid4()),
        "submission_id": submission_id,
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "action": review.action,
        "reason": review.reason,
        "compliance_notes": review.compliance_notes,
        "created_at": now
    }
    await db.app_reviews.insert_one(review_record)
    
    # Log admin action
    await log_admin_action(admin, f"app_{review.action}", "app", submission_id, 
                          {"reason": review.reason, "app_name": submission["app_name"]}, request)
    
    return {"message": f"App {review.action}d successfully", "new_status": status_map[review.action]}

# --- Support Tickets ---

@admin_router.get("/support/tickets")
async def list_support_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List support tickets"""
    if not check_admin_permission(admin, "tickets:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.support_tickets.count_documents(query)
    
    return {"tickets": tickets, "total": total, "limit": limit, "offset": offset}

@admin_router.post("/support/tickets")
async def create_support_ticket(ticket: SupportTicketCreate, admin=Depends(get_current_admin)):
    """Create a support ticket (on behalf of user or internal)"""
    if not check_admin_permission(admin, "tickets:create"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    ticket_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "id": ticket_id,
        "user_id": ticket.user_id,
        "subject": ticket.subject,
        "description": ticket.description,
        "priority": ticket.priority,
        "category": ticket.category,
        "status": "open",
        "assigned_to": None,
        "internal_notes": [],
        "messages": [{"from": "system", "message": ticket.description, "timestamp": now}],
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.support_tickets.insert_one(ticket_doc)
    
    return {"message": "Ticket created", "ticket_id": ticket_id}

@admin_router.patch("/support/tickets/{ticket_id}")
async def update_support_ticket(ticket_id: str, update: SupportTicketUpdate, admin=Depends(get_current_admin), request: Request = None):
    """Update a support ticket"""
    if not check_admin_permission(admin, "tickets:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    ticket = await db.support_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.status:
        update_data["status"] = update.status
    if update.assigned_to:
        update_data["assigned_to"] = update.assigned_to
    if update.internal_notes:
        update_data["$push"] = {"internal_notes": {
            "note": update.internal_notes,
            "admin_id": admin["id"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }}
    if update.resolution:
        update_data["resolution"] = update.resolution
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
        update_data["resolved_by"] = admin["id"]
    
    if "$push" in update_data:
        push_data = update_data.pop("$push")
        await db.support_tickets.update_one({"id": ticket_id}, {"$set": update_data, "$push": push_data})
    else:
        await db.support_tickets.update_one({"id": ticket_id}, {"$set": update_data})
    
    await log_admin_action(admin, "update_ticket", "ticket", ticket_id, update.dict(exclude_none=True), request)
    
    return {"message": "Ticket updated"}

# --- Billing & Payments ---

@admin_router.get("/billing/transactions")
async def list_billing_transactions(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List billing transactions"""
    if not check_admin_permission(admin, "billing:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["payment_status"] = status
    
    transactions = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.payment_transactions.count_documents(query)
    
    return {"transactions": transactions, "total": total, "limit": limit, "offset": offset}

# --- Revenue & Payouts ---

@admin_router.get("/revenue/summary")
async def get_revenue_summary(admin=Depends(get_current_admin)):
    """Get network-wide revenue summary"""
    if not check_admin_permission(admin, "revenue:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    # Mock revenue data
    return {
        "total_revenue": 2456789.50,
        "monthly_revenue": 342567.80,
        "daily_average": 11418.93,
        "by_category": {
            "Productivity": 1234567.80,
            "Communication": 567890.20,
            "Wellness": 654331.50
        },
        "top_apps": [
            {"name": "OneTask", "revenue": 456789.00},
            {"name": "FocusTune", "revenue": 345678.00},
            {"name": "ToneCheck", "revenue": 234567.00}
        ],
        "pending_payouts": 45678.90,
        "processed_payouts": 2411110.60
    }

# --- Audit Logs ---

@admin_router.get("/audit/logs")
async def get_audit_logs(
    admin_id: Optional[str] = None,
    target_type: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """Get admin audit logs"""
    if not check_admin_permission(admin, "audit:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if admin_id:
        query["admin_id"] = admin_id
    if target_type:
        query["target_type"] = target_type
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    logs = await db.admin_audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.admin_audit_logs.count_documents(query)
    
    return {"logs": logs, "total": total, "limit": limit, "offset": offset}

# --- Admin Management ---

@admin_router.get("/admins")
async def list_admins(admin=Depends(get_current_admin)):
    """List all admin accounts (Super Admin only)"""
    if admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    admins = await db.admins.find({}, {"_id": 0, "hashed_password": 0}).to_list(100)
    return {"admins": admins}

@admin_router.patch("/admins/{admin_id}")
async def update_admin(admin_id: str, role: Optional[str] = None, is_active: Optional[bool] = None, 
                       current_admin=Depends(get_current_admin), request: Request = None):
    """Update admin account (Super Admin only)"""
    if current_admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    if admin_id == current_admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot modify your own account")
    
    update_data = {}
    if role:
        if role not in ADMIN_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ADMIN_ROLES}")
        update_data["role"] = role
    if is_active is not None:
        update_data["is_active"] = is_active
    
    if update_data:
        await db.admins.update_one({"id": admin_id}, {"$set": update_data})
        await log_admin_action(current_admin, "update_admin", "admin", admin_id, update_data, request)
    
    return {"message": "Admin updated"}

# Initialize default super admin on startup
async def init_super_admin():
    """Create default super admin if none exists"""
    existing = await db.admins.find_one({"role": AdminRole.SUPER_ADMIN})
    if not existing:
        admin_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        default_admin = {
            "id": admin_id,
            "email": "admin@optio.com",
            "hashed_password": hash_password("admin123"),
            "name": "Super Admin",
            "role": AdminRole.SUPER_ADMIN,
            "is_active": True,
            "last_login": None,
            "created_at": now
        }
        await db.admins.insert_one(default_admin)
        logger.info(f"Created default super admin: admin@optio.com")

# Include admin router
app.include_router(admin_router)

@api_router.get("/")
async def root():
    return {"message": "NAPP Node Operator Dashboard API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_super_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
