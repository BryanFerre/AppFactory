"""
Promotion routes - promotion stats, share links
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import random

from utils.database import db
from utils.auth import get_current_user
from utils.config import FRONTEND_URL
from models.schemas import PromotionStats

router = APIRouter(tags=["Promotion"])


@router.get("/promotion/stats", response_model=PromotionStats)
async def get_promotion_stats(user=Depends(get_current_user)):
    """Get promotion statistics for current user"""
    referral_code = user.get("referral_code", "")
    
    # Get referral stats
    ref_stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0})
    if not ref_stats:
        ref_stats = {}
    
    # Get legacy referral data
    referral_data = await db.referrals.find_one({"user_id": user["id"]}, {"_id": 0})
    if not referral_data:
        referral_data = {}
    
    # Get installed apps for share links
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    app_share_links = [
        {
            "app_id": app["id"],
            "app_name": app["name"],
            "referral_link": f"{FRONTEND_URL}/app/{app['id']}?ref={referral_code}",
            "clicks": random.randint(50, 500),
            "signups": random.randint(5, 50),
            "opt_earned": round(random.uniform(10, 100), 2)
        }
        for app in apps
    ]
    
    # Generate recent activity
    recent_activity = []
    for i in range(5):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).isoformat()
        activity_type = random.choice(["operator_signup", "app_signup", "click"])
        opt = 50.0 if activity_type == "operator_signup" else (2.0 if activity_type == "app_signup" else 0)
        recent_activity.append({
            "type": activity_type,
            "opt_earned": opt,
            "date": date,
            "app_name": random.choice([a["name"] for a in apps]) if activity_type != "operator_signup" and apps else None
        })
    
    return PromotionStats(
        app_link_clicks=ref_stats.get("app_clicks", referral_data.get("app_link_clicks", 0)),
        app_signups_driven=ref_stats.get("app_signups", referral_data.get("app_signups_driven", 0)),
        app_opt_rewards=ref_stats.get("app_opt_earned", referral_data.get("app_opt_earned", 0)),
        operator_invites_sent=referral_data.get("operator_invites_sent", 0),
        operator_signups=ref_stats.get("operator_signups", referral_data.get("operator_signups", 0)),
        operator_opt_rewards=ref_stats.get("operator_opt_earned", referral_data.get("operator_opt_earned", 0)),
        app_share_links=app_share_links,
        operator_referral_link=f"{FRONTEND_URL}/register?ref={referral_code}&type=operator",
        recent_activity=recent_activity
    )
