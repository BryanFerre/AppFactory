"""
Activity Points API - User Activity Points System endpoints

Endpoints:
- POST /api/activity/event - Award points for an action (internal)
- GET /api/activity/summary - User's points summary
- GET /api/activity/history - User's activity history
- GET /api/activity/actions - List all action types
- GET /api/activity/leaderboard - Top users by points
- GET /api/activity/streak - User's login streak info
- GET /api/activity/badges - User's badges
- GET /api/activity/rewards - Available rewards
- POST /api/activity/redeem - Redeem a reward

Admin endpoints:
- GET /api/admin/activity/actions - All actions with config
- PUT /api/admin/activity/actions/{id} - Update action config
- GET /api/admin/activity/stats - System-wide stats
- POST /api/admin/activity/reverse - Reverse points
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.auth import get_current_user
from utils.database import db
from services.points_engine import PointsEngine, CATEGORIES, TIERS
from services.badges_engine import BadgesEngine, BADGE_CATEGORIES
from services.redemption_engine import RedemptionEngine, REWARD_CATEGORIES

router = APIRouter(prefix="/activity", tags=["activity"])
admin_router = APIRouter(prefix="/admin/activity", tags=["admin-activity"])

# Initialize engines
points_engine = None
badges_engine = None
redemption_engine = None

async def get_points_engine() -> PointsEngine:
    global points_engine
    if points_engine is None:
        points_engine = PointsEngine(db)
        await points_engine.initialize()
    return points_engine

async def get_badges_engine() -> BadgesEngine:
    global badges_engine
    if badges_engine is None:
        badges_engine = BadgesEngine(db)
        await badges_engine.initialize()
    return badges_engine

async def get_redemption_engine() -> RedemptionEngine:
    global redemption_engine
    if redemption_engine is None:
        redemption_engine = RedemptionEngine(db)
        await redemption_engine.initialize()
    return redemption_engine


# ==================== USER ENDPOINTS ====================

class AwardPointsRequest(BaseModel):
    action_id: str = Field(..., description="Action identifier")
    source_entity_id: Optional[str] = Field(None, description="Related entity ID (app_id, node_id, etc.)")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    idempotency_key: Optional[str] = Field(None, description="Unique key to prevent duplicates")


@router.post("/event")
async def award_points(
    request: AwardPointsRequest,
    user: dict = Depends(get_current_user)
):
    """Award points to the current user for an action"""
    engine = await get_points_engine()
    
    result = await engine.award_points(
        user_id=user["id"],
        action_id=request.action_id,
        source_entity_id=request.source_entity_id,
        metadata=request.metadata,
        idempotency_key=request.idempotency_key
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=400 if result["reason"] != "duplicate_event" else 409,
            detail=result["message"]
        )
    
    return result


@router.get("/summary")
async def get_user_summary(user: dict = Depends(get_current_user)):
    """Get current user's points summary"""
    engine = await get_points_engine()
    summary = await engine.get_user_summary(user["id"])
    
    # Add streak info
    streak = await engine.get_login_streak(user["id"])
    summary["login_streak"] = streak.get("current_streak", 0)
    summary["longest_streak"] = streak.get("longest_streak", 0)
    
    # Add tier progression info
    summary["tiers"] = TIERS
    summary["categories"] = CATEGORIES
    
    return summary


@router.get("/history")
async def get_user_history(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get current user's activity history"""
    engine = await get_points_engine()
    history = await engine.get_user_history(
        user_id=user["id"],
        limit=limit,
        offset=offset,
        category=category
    )
    
    return {
        "history": history,
        "total": len(history),
        "limit": limit,
        "offset": offset
    }


@router.get("/actions")
async def get_actions():
    """Get all available action types"""
    engine = await get_points_engine()
    actions = await engine.get_all_actions()
    
    # Group by category
    by_category = {}
    for action in actions:
        if action.get("enabled", True):
            cat = action.get("category", "other")
            if cat not in by_category:
                by_category[cat] = {
                    "name": CATEGORIES.get(cat, cat),
                    "actions": []
                }
            by_category[cat]["actions"].append(action)
    
    return {
        "categories": CATEGORIES,
        "actions_by_category": by_category,
        "total_actions": len(actions)
    }


@router.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    """Get current user's login streak info"""
    engine = await get_points_engine()
    streak = await engine.get_login_streak(user["id"])
    
    # Add milestone info
    streak_milestones = [
        {"days": 7, "action_id": "login_streak_7", "name": "7-Day Streak", "points": 100},
        {"days": 30, "action_id": "login_streak_30", "name": "30-Day Streak", "points": 300},
        {"days": 90, "action_id": "login_streak_90", "name": "90-Day Streak", "points": 750},
        {"days": 365, "action_id": "login_streak_365", "name": "365-Day Streak", "points": 2000},
    ]
    
    milestones_awarded = streak.get("milestones_awarded", [])
    
    milestones = []
    for m in streak_milestones:
        milestones.append({
            **m,
            "achieved": m["action_id"] in milestones_awarded,
            "progress": min(100, (streak.get("current_streak", 0) / m["days"]) * 100)
        })
    
    return {
        "current_streak": streak.get("current_streak", 0),
        "longest_streak": streak.get("longest_streak", 0),
        "last_login_date": streak.get("last_login_date"),
        "milestones": milestones
    }


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(50, le=100),
    category: Optional[str] = None
):
    """Get top users by points"""
    engine = await get_points_engine()
    leaderboard = await engine.get_leaderboard(limit=limit, category=category)
    
    return {
        "leaderboard": leaderboard,
        "total": len(leaderboard),
        "category": category
    }


@router.get("/tiers")
async def get_tiers():
    """Get tier definitions"""
    return {
        "tiers": TIERS,
        "categories": CATEGORIES
    }


# ==================== INTERNAL ENDPOINT ====================
# This endpoint is for internal service-to-service calls

class InternalAwardRequest(BaseModel):
    user_id: str
    action_id: str
    source_entity_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    idempotency_key: Optional[str] = None


@router.post("/internal/award")
async def internal_award_points(request: InternalAwardRequest):
    """
    Internal endpoint for awarding points from other services
    Should be protected by internal API key in production
    """
    engine = await get_points_engine()
    
    result = await engine.award_points(
        user_id=request.user_id,
        action_id=request.action_id,
        source_entity_id=request.source_entity_id,
        metadata=request.metadata,
        idempotency_key=request.idempotency_key
    )
    
    return result


# ==================== ADMIN ENDPOINTS ====================

# Import admin auth
from api.admin import get_current_admin


@admin_router.get("/actions")
async def admin_get_actions(admin=Depends(get_current_admin)):
    """Get all actions with full config (admin only)"""
    engine = await get_points_engine()
    actions = await engine.get_all_actions()
    
    return {
        "actions": actions,
        "categories": CATEGORIES,
        "total": len(actions)
    }


class UpdateActionRequest(BaseModel):
    base_points: Optional[int] = None
    enabled: Optional[bool] = None
    cooldown: Optional[str] = None
    description: Optional[str] = None


@admin_router.put("/actions/{action_id}")
async def admin_update_action(
    action_id: str,
    request: UpdateActionRequest,
    admin=Depends(get_current_admin)
):
    """Update action configuration (admin only)"""
    engine = await get_points_engine()
    
    updates = {}
    if request.base_points is not None:
        updates["base_points"] = request.base_points
    if request.enabled is not None:
        updates["enabled"] = request.enabled
    if request.cooldown is not None:
        updates["cooldown"] = request.cooldown
    if request.description is not None:
        updates["description"] = request.description
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    # Add audit info
    updates["last_modified_by"] = admin["id"]
    
    success = await engine.update_action(action_id, updates)
    
    if not success:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Log admin action
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "update_activity_action",
        "target_id": action_id,
        "changes": updates,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "action_id": action_id}


@admin_router.get("/stats")
async def admin_get_stats(admin=Depends(get_current_admin)):
    """Get system-wide activity stats (admin only)"""
    engine = await get_points_engine()
    
    # Category stats
    category_stats = await engine.get_category_stats()
    
    # Total users with points
    total_users = await db.user_points_summary.count_documents({})
    
    # Total points issued
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$points"}}}]
    result = await db.activity_points_ledger.aggregate(pipeline).to_list(1)
    total_points = result[0]["total"] if result else 0
    
    # Total events
    total_events = await db.activity_events.count_documents({})
    
    # Tier distribution
    tier_pipeline = [
        {"$group": {"_id": "$tier", "count": {"$sum": 1}}}
    ]
    tier_results = await db.user_points_summary.aggregate(tier_pipeline).to_list(10)
    tier_distribution = {r["_id"]: r["count"] for r in tier_results}
    
    return {
        "total_users_with_points": total_users,
        "total_points_issued": total_points,
        "total_events": total_events,
        "category_stats": category_stats,
        "tier_distribution": tier_distribution,
        "tiers": TIERS
    }


class ReversePointsRequest(BaseModel):
    user_id: str
    event_id: str
    reason: str


@admin_router.post("/reverse")
async def admin_reverse_points(
    request: ReversePointsRequest,
    admin=Depends(get_current_admin)
):
    """Reverse points for an event (admin only)"""
    engine = await get_points_engine()
    
    result = await engine.reverse_points(
        user_id=request.user_id,
        event_id=request.event_id,
        reason=request.reason
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["reason"])
    
    # Log admin action
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "reverse_points",
        "target_user_id": request.user_id,
        "event_id": request.event_id,
        "reason": request.reason,
        "points_reversed": result["points_reversed"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return result


@admin_router.get("/user/{user_id}/summary")
async def admin_get_user_summary(user_id: str, admin=Depends(get_current_admin)):
    """Get specific user's points summary (admin only)"""
    engine = await get_points_engine()
    summary = await engine.get_user_summary(user_id)
    
    if not summary:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add streak info
    streak = await engine.get_login_streak(user_id)
    summary["login_streak"] = streak.get("current_streak", 0)
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
    if user:
        summary["user_name"] = user.get("name")
        summary["user_email"] = user.get("email")
    
    return summary


@admin_router.get("/user/{user_id}/history")
async def admin_get_user_history(
    user_id: str,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    admin=Depends(get_current_admin)
):
    """Get specific user's activity history (admin only)"""
    engine = await get_points_engine()
    history = await engine.get_user_history(
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    
    return {
        "user_id": user_id,
        "history": history,
        "total": len(history)
    }
