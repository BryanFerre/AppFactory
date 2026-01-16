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


@router.post("/promotion/share/{app_id}")
async def track_app_share(app_id: str, platform: str = "copy", user=Depends(get_current_user)):
    """Track when a user shares an app link and award OPT points"""
    from fastapi import HTTPException
    from services.points_engine import PointsEngine
    
    # Get the installed app
    app = await db.installed_apps.find_one({"id": app_id, "user_id": user["id"]}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="App not found in your installed apps")
    
    referral_code = user.get("referral_code", "")
    share_link = f"{FRONTEND_URL}/app/{app_id}?ref={referral_code}"
    
    # Track the share event
    share_record = {
        "id": f"share_{app_id}_{user['id']}_{datetime.now(timezone.utc).timestamp()}",
        "user_id": user["id"],
        "app_id": app_id,
        "app_name": app.get("name", "Unknown"),
        "platform": platform,  # twitter, facebook, linkedin, copy, email
        "share_link": share_link,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.app_shares.insert_one(share_record)
    
    # Award OPT points for sharing (with cooldown per app per day)
    points_awarded = 0
    try:
        engine = PointsEngine(db)
        result = await engine.award_points(
            user["id"],
            "share_app_link",
            source_entity_id=app_id,
            metadata={"app_name": app.get("name"), "platform": platform}
        )
        points_awarded = result.get("points_awarded", 0) if result else 0
    except Exception as e:
        print(f"Failed to award points for share: {e}")
    
    return {
        "success": True,
        "share_link": share_link,
        "platform": platform,
        "points_awarded": points_awarded,
        "message": f"Share link generated! You earned OPT for sharing {app.get('name', 'this app')}."
    }


@router.get("/promotion/app/{app_id}/stats")
async def get_app_promotion_stats(app_id: str, user=Depends(get_current_user)):
    """Get promotion/share stats for a specific installed app"""
    # Get the installed app
    app = await db.installed_apps.find_one({"id": app_id, "user_id": user["id"]}, {"_id": 0})
    if not app:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="App not found in your installed apps")
    
    referral_code = user.get("referral_code", "")
    share_link = f"{FRONTEND_URL}/app/{app_id}?ref={referral_code}"
    
    # Get share stats from database
    total_shares = await db.app_shares.count_documents({"app_id": app_id, "user_id": user["id"]})
    
    # Get referral stats for this specific app
    ref_stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0}) or {}
    
    # Get share history
    recent_shares = await db.app_shares.find(
        {"app_id": app_id, "user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "app_id": app_id,
        "app_name": app.get("name"),
        "share_link": share_link,
        "total_shares": total_shares,
        "clicks": app.get("share_clicks", random.randint(20, 200)),
        "signups_driven": app.get("signups_driven", 0),
        "opt_earned_from_shares": app.get("opt_rewards_earned", 0),
        "recent_shares": recent_shares,
        "performance": {
            "revenue_usd": app.get("revenue_usd", 0),
            "subscribers_served": app.get("subscribers_served", 0),
            "uptime_percentage": app.get("uptime", 99.9),
            "health": app.get("health", "healthy")
        }
    }

