"""
Database configuration and connection management
"""
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections (for reference)
# - users: User accounts
# - admins: Admin accounts
# - nodes: Node data per user
# - installed_apps: Apps installed by users
# - app_submissions: Developer app submissions
# - referral_stats: Referral statistics per user
# - referral_clicks: Click tracking
# - referral_conversions: Successful referrals
# - app_referral_stats: Per-app referral stats
# - earnings_history: Daily earnings records
# - transactions: Billing transactions
# - support_tickets: Support tickets
# - audit_logs: Admin action logs

async def init_indexes():
    """Create database indexes for better query performance"""
    # Users
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)
    
    # Admins
    await db.admins.create_index("email", unique=True)
    
    # Nodes
    await db.nodes.create_index("user_id", unique=True)
    
    # Apps
    await db.installed_apps.create_index([("user_id", 1), ("id", 1)])
    await db.app_submissions.create_index("user_id")
    await db.app_submissions.create_index("status")
    
    # Referrals
    await db.referral_stats.create_index("user_id", unique=True)
    await db.referral_clicks.create_index("referral_code")
    await db.referral_conversions.create_index("referrer_id")
    
    # Earnings
    await db.earnings_history.create_index([("user_id", 1), ("date", -1)])
    
    # Transactions
    await db.transactions.create_index([("user_id", 1), ("created_at", -1)])
    
    # Support
    await db.support_tickets.create_index([("user_id", 1), ("status", 1)])
    
    # Audit
    await db.audit_logs.create_index([("admin_id", 1), ("timestamp", -1)])
