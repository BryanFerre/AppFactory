"""
Configuration and constants
"""
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Admin JWT (separate secret for admin tokens)
ADMIN_JWT_SECRET = os.environ.get('ADMIN_JWT_SECRET', JWT_SECRET + '-admin')

# 2FA Configuration
TOTP_ISSUER = "AppCloud Dashboard"

# API Keys
COINMARKETCAP_API_KEY = os.environ.get('COINMARKETCAP_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Frontend URL for emails and referral links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://appcloud.io')

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

# Admin Role Permissions
ROLE_PERMISSIONS = {
    "super_admin": ["*"],  # All permissions
    "support": ["users:read", "users:update", "tickets:*", "nodes:read"],
    "finance": ["billing:*", "payouts:*", "revenue:read", "reports:read"],
    "compliance": ["audit:*", "reports:*", "users:read"],
    "app_review": ["apps:*", "submissions:*"]
}

# OPT Rewards
OPT_REWARD_OPERATOR_REFERRAL = 50.0  # OPT for referring new node operators
OPT_REWARD_APP_SIGNUP = 2.0  # OPT for app user signups
