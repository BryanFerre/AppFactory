"""
Referral system routes
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional
import uuid

from utils.database import db
from utils.auth import get_current_user
from utils.config import FRONTEND_URL, OPT_REWARD_OPERATOR_REFERRAL, OPT_REWARD_APP_SIGNUP
from services.referral import process_referral_signup
from models.schemas import ReferralClick, ReferralStatsResponse

router = APIRouter(prefix="/referral", tags=["Referral"])


async def award_user_points(user_id: str, action_id: str, source_entity_id: str = None, metadata: dict = None):
    """Helper function to award points to a user"""
    try:
        from services.points_engine import PointsEngine
        engine = PointsEngine(db)
        return await engine.award_points(
            user_id=user_id,
            action_id=action_id,
            source_entity_id=source_entity_id,
            metadata=metadata
        )
    except Exception as e:
        import logging
        logging.error(f"Failed to award points: {e}")
        return None


@router.get("/code")
async def get_referral_code(user=Depends(get_current_user)):
    """Get user's referral code and links"""
    referral_code = user.get("referral_code")
    if not referral_code:
        raise HTTPException(status_code=404, detail="Referral code not found")
    
    return {
        "referral_code": referral_code,
        "referral_link": f"{FRONTEND_URL}/register?ref={referral_code}",
        "operator_referral_link": f"{FRONTEND_URL}/register?ref={referral_code}&type=operator"
    }


@router.post("/click")
async def track_referral_click(click: ReferralClick, request: Request):
    """Track a referral link click"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Find user by referral code
    referrer = await db.users.find_one({"referral_code": click.referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Record click
    click_record = {
        "id": str(uuid.uuid4()),
        "referral_code": click.referral_code,
        "referrer_id": referrer["id"],
        "source": click.source,
        "app_id": click.app_id,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "timestamp": now
    }
    await db.referral_clicks.insert_one(click_record)
    
    # Update click counts
    if click.app_id:
        await db.referral_stats.update_one(
            {"user_id": referrer["id"]},
            {"$inc": {"app_clicks": 1}},
            upsert=True
        )
        await db.app_referral_stats.update_one(
            {"user_id": referrer["id"], "app_id": click.app_id},
            {"$inc": {"clicks": 1}},
            upsert=True
        )
    else:
        await db.referral_stats.update_one(
            {"user_id": referrer["id"]},
            {"$inc": {"operator_clicks": 1}},
            upsert=True
        )
    
    return {"message": "Click tracked", "referrer_id": referrer["id"]}


@router.post("/app-signup")
async def track_app_signup(referral_code: str, app_id: str, new_user_id: Optional[str] = None):
    """Track when a user signs up through an app referral link"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    if not referrer:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # Get app name
    app = await db.installed_apps.find_one({"id": app_id}, {"_id": 0})
    app_name = app["name"] if app else "Unknown App"
    
    # Record conversion
    conversion = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referral_code": referral_code,
        "referred_id": new_user_id,
        "referral_type": "app_user",
        "app_id": app_id,
        "app_name": app_name,
        "opt_reward": OPT_REWARD_APP_SIGNUP,
        "status": "pending",
        "created_at": now
    }
    await db.referral_conversions.insert_one(conversion)
    
    # Update stats
    await db.referral_stats.update_one(
        {"user_id": referrer["id"]},
        {
            "$inc": {
                "app_signups": 1,
                "app_pending_opt": OPT_REWARD_APP_SIGNUP,
                "total_pending_opt": OPT_REWARD_APP_SIGNUP
            }
        },
        upsert=True
    )
    
    # Update app-specific stats
    await db.app_referral_stats.update_one(
        {"user_id": referrer["id"], "app_id": app_id},
        {
            "$inc": {"signups": 1, "pending_opt": OPT_REWARD_APP_SIGNUP},
            "$set": {"app_name": app_name}
        },
        upsert=True
    )
    
    return {"message": "App signup tracked", "opt_reward": OPT_REWARD_APP_SIGNUP}


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(user=Depends(get_current_user)):
    """Get detailed referral statistics for current user"""
    referral_code = user.get("referral_code", "")
    
    # Get or create referral stats
    stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0})
    if not stats:
        stats = {
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
    
    # Get per-app referral stats
    app_stats = await db.app_referral_stats.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Get recent conversions
    recent = await db.referral_conversions.find(
        {"referrer_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    recent_referrals = [
        {
            "type": r.get("referral_type", "operator"),
            "app_name": r.get("app_name"),
            "opt_reward": r.get("opt_reward", 0),
            "status": r.get("status", "pending"),
            "date": r.get("created_at")
        }
        for r in recent
    ]
    
    return ReferralStatsResponse(
        referral_code=referral_code,
        operator_referral_link=f"{FRONTEND_URL}/register?ref={referral_code}&type=operator",
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
        app_referral_stats=app_stats,
        recent_referrals=recent_referrals
    )


@router.post("/confirm/{conversion_id}")
async def confirm_referral(conversion_id: str, user=Depends(get_current_user)):
    """Confirm a pending referral conversion (admin or system use)"""
    conversion = await db.referral_conversions.find_one({"id": conversion_id})
    if not conversion:
        raise HTTPException(status_code=404, detail="Conversion not found")
    
    if conversion["status"] != "pending":
        raise HTTPException(status_code=400, detail="Conversion already processed")
    
    now = datetime.now(timezone.utc).isoformat()
    opt_reward = conversion.get("opt_reward", 0)
    referral_type = conversion.get("referral_type", "operator")
    
    # Update conversion status
    await db.referral_conversions.update_one(
        {"id": conversion_id},
        {"$set": {"status": "confirmed", "confirmed_at": now}}
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
    
    return {"message": "Referral confirmed", "opt_reward": opt_reward}
