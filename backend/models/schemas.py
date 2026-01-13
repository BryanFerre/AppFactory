"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ==================== AUTH MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

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
    requires_2fa: Optional[bool] = False

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    provisioning_uri: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

# ==================== NODE MODELS ====================

class NodeStats(BaseModel):
    node_id: str
    status: str
    uptime_percent: float
    cpu_usage: float
    memory_usage: float
    storage_usage: float
    total_capacity: int
    used_capacity: int
    active_apps: int
    requests_today: int
    network_in: float
    network_out: float

# ==================== EARNINGS MODELS ====================

class EarningsResponse(BaseModel):
    today_usd: float
    today_opt: float
    week_usd: float
    week_opt: float
    month_usd: float
    month_opt: float
    total_usd: float
    total_opt: float
    pending_payout: float
    next_payout_date: str
    earnings_history: List[dict]

class PayoutRecord(BaseModel):
    id: str
    amount_usd: float
    amount_opt: float
    status: str
    date: str
    tx_hash: Optional[str] = None

# ==================== APP MODELS ====================

class InstalledApp(BaseModel):
    id: str
    name: str
    icon: str
    health: str
    subscribers_served: int
    revenue_usd: float
    opt_earned: float
    signups_driven: int
    opt_rewards_earned: float

class AppSubmission(BaseModel):
    app_name: str
    description: str
    category: str
    contact_email: EmailStr
    website_url: Optional[str] = None
    github_url: Optional[str] = None
    documentation_url: Optional[str] = None
    monthly_price: float
    resource_requirements: dict
    features: List[str]
    terms_accepted: bool

class AppSubmissionResponse(BaseModel):
    id: str
    app_name: str
    status: str
    created_at: str
    is_featured: bool

# ==================== REFERRAL MODELS ====================

class ReferralClick(BaseModel):
    referral_code: str
    source: Optional[str] = None
    app_id: Optional[str] = None

class ReferralStatsResponse(BaseModel):
    referral_code: str
    operator_referral_link: str
    operator_clicks: int
    operator_signups: int
    operator_opt_earned: float
    operator_pending_opt: float
    app_clicks: int
    app_signups: int
    app_opt_earned: float
    app_pending_opt: float
    total_opt_earned: float
    total_pending_opt: float
    app_referral_stats: List[dict]
    recent_referrals: List[dict]

class PromotionStats(BaseModel):
    app_link_clicks: int
    app_signups_driven: int
    app_opt_rewards: float
    operator_invites_sent: int
    operator_signups: int
    operator_opt_rewards: float
    app_share_links: List[dict]
    operator_referral_link: str
    recent_activity: List[dict]

# ==================== AI MODELS ====================

class AIRecommendation(BaseModel):
    type: str
    title: str
    description: str
    action: Optional[str] = None
    priority: str
    app_name: Optional[str] = None
    social_platforms: Optional[List[str]] = None
    post_content: Optional[str] = None
    hashtags: Optional[List[str]] = None

# ==================== ADMIN MODELS ====================

class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "support"

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

class AppReviewRequest(BaseModel):
    action: str  # approve, reject, request_changes
    reason: Optional[str] = None
    compliance_notes: Optional[str] = None

class SupportTicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    internal_notes: Optional[str] = None
    resolution: Optional[str] = None

# ==================== BILLING MODELS ====================

class Transaction(BaseModel):
    id: str
    user_id: str
    user_email: str
    type: str  # subscription, featured_listing, payout, refund
    amount: float
    currency: str
    status: str  # completed, pending, failed, refunded
    description: Optional[str] = None
    created_at: str

# ==================== EMAIL MODELS ====================

class TestEmailRequest(BaseModel):
    template: str
    to_email: EmailStr
