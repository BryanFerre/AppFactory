"""
Referral system service - signup processing, node initialization
"""
import uuid
import random
import logging
from datetime import datetime, timezone, timedelta

from utils.database import db
from utils.config import FRONTEND_URL, OPT_REWARD_OPERATOR_REFERRAL, OPT_REWARD_APP_SIGNUP
from services.email import send_notification_email

logger = logging.getLogger(__name__)


async def process_referral_signup(referred_user_id: str, referral_code: str, referral_type: str = "operator"):
    """Process a successful referral signup and credit OPT rewards"""
    # Find the referrer by code
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    if not referrer:
        logger.warning(f"Referral code {referral_code} not found")
        return False
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Determine reward amount
    opt_reward = OPT_REWARD_OPERATOR_REFERRAL if referral_type == "operator" else OPT_REWARD_APP_SIGNUP
    
    # Create referral record
    referral_record = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_id": referred_user_id,
        "referral_code": referral_code,
        "referral_type": referral_type,
        "opt_reward": opt_reward,
        "status": "pending",
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
    await send_notification_email("referral_signup", referrer["email"], {
        "opt_reward": opt_reward,
        "referral_type": referral_type,
        "total_referrals": total_referrals,
        "dashboard_url": FRONTEND_URL
    })
    
    logger.info(f"Referral processed: {referrer['id']} referred {referred_user_id} ({referral_type}), reward: {opt_reward} OPT")
    return True


async def initialize_user_node(user_id: str):
    """Initialize a new node and sample data for a user"""
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
            "revenue_usd": 487.50,
            "signups_driven": 45,
            "opt_rewards_earned": 90.0,
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
            "usd": round(random.uniform(25, 45), 2),
            "opt_rewards": round(random.uniform(2, 8), 2)
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
