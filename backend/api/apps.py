"""
Apps routes - installed apps, app factory, available apps
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import random

from utils.database import db
from utils.auth import get_current_user
from utils.config import FRONTEND_URL

router = APIRouter(tags=["Apps"])

# Available apps catalog - Varied pricing and metrics for comparison
AVAILABLE_APPS = [
    {
        "id": "app-1",
        "name": "OneTask",
        "description": "Locks you into a single task for a set time to eliminate distraction.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 7.99,
        "revenue_share": 72,
        "revenue_per_node": 245.80,
        "active_nodes": 3420,
        "total_slots": 5000,
        "available_slots": 1580,
        "subscribers": 52400,
        "estimated_monthly_usd": 245.80,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-2",
        "name": "Top3 Today",
        "description": "Helps you choose the three most important things to do today.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 0.99,
        "revenue_share": 80,
        "revenue_per_node": 42.50,
        "active_nodes": 8920,
        "total_slots": 10000,
        "available_slots": 1080,
        "subscribers": 156200,
        "estimated_monthly_usd": 42.50,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-3",
        "name": "MeetTimer",
        "description": "A visual countdown timer designed for meetings with team sync.",
        "icon": "video",
        "category": "Productivity",
        "subscription_price": 12.99,
        "revenue_share": 65,
        "revenue_per_node": 312.40,
        "active_nodes": 1240,
        "total_slots": 2500,
        "available_slots": 1260,
        "subscribers": 18500,
        "estimated_monthly_usd": 312.40,
        "capacity_required": 4,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-4",
        "name": "PomoLite",
        "description": "A no-setup Pomodoro focus timer with analytics.",
        "icon": "cpu",
        "category": "Productivity",
        "subscription_price": 1.99,
        "revenue_share": 78,
        "revenue_per_node": 58.90,
        "active_nodes": 5680,
        "total_slots": 8000,
        "available_slots": 2320,
        "subscribers": 89400,
        "estimated_monthly_usd": 58.90,
        "capacity_required": 1,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-5",
        "name": "DoneLog",
        "description": "Tracks what you completed instead of what you planned.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 4.99,
        "revenue_share": 70,
        "revenue_per_node": 124.60,
        "active_nodes": 2340,
        "total_slots": 4000,
        "available_slots": 1660,
        "subscribers": 34800,
        "estimated_monthly_usd": 124.60,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-6",
        "name": "BlockDay Pro",
        "description": "Enterprise-grade time blocking with calendar integration.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 19.99,
        "revenue_share": 60,
        "revenue_per_node": 478.60,
        "active_nodes": 680,
        "total_slots": 1500,
        "available_slots": 820,
        "subscribers": 8200,
        "estimated_monthly_usd": 478.60,
        "capacity_required": 6,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-7",
        "name": "FocusTune",
        "description": "AI-curated background sounds for deep focus sessions.",
        "icon": "video",
        "category": "Productivity",
        "subscription_price": 3.49,
        "revenue_share": 74,
        "revenue_per_node": 98.20,
        "active_nodes": 4120,
        "total_slots": 6000,
        "available_slots": 1880,
        "subscribers": 67500,
        "estimated_monthly_usd": 98.20,
        "capacity_required": 5,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-8",
        "name": "ToneCheck AI",
        "description": "AI-powered message tone analysis for clarity and professionalism.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 14.99,
        "revenue_share": 62,
        "revenue_per_node": 356.80,
        "active_nodes": 1280,
        "total_slots": 2000,
        "available_slots": 720,
        "subscribers": 19200,
        "estimated_monthly_usd": 356.80,
        "capacity_required": 7,
        "is_trending": True,
        "is_new": True
    },
    {
        "id": "app-9",
        "name": "ReframeIt",
        "description": "Cognitive reframing tool to transform negative thoughts.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 8.99,
        "revenue_share": 68,
        "revenue_per_node": 198.40,
        "active_nodes": 1920,
        "total_slots": 3000,
        "available_slots": 1080,
        "subscribers": 28600,
        "estimated_monthly_usd": 198.40,
        "capacity_required": 3,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-10",
        "name": "BreatheEasy",
        "description": "Guided breathing exercises with biometric feedback.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 2.49,
        "revenue_share": 76,
        "revenue_per_node": 72.30,
        "active_nodes": 3890,
        "total_slots": 5000,
        "available_slots": 1110,
        "subscribers": 58400,
        "estimated_monthly_usd": 72.30,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-11",
        "name": "QuickNotes",
        "description": "Lightning-fast note capture with AI tagging.",
        "icon": "database",
        "category": "Productivity",
        "subscription_price": 5.99,
        "revenue_share": 71,
        "revenue_per_node": 156.40,
        "active_nodes": 2780,
        "total_slots": 4500,
        "available_slots": 1720,
        "subscribers": 41200,
        "estimated_monthly_usd": 156.40,
        "capacity_required": 2,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-12",
        "name": "TeamSync",
        "description": "Real-time team collaboration with presence indicators.",
        "icon": "globe",
        "category": "Communication",
        "subscription_price": 24.99,
        "revenue_share": 58,
        "revenue_per_node": 542.80,
        "active_nodes": 520,
        "total_slots": 1000,
        "available_slots": 480,
        "subscribers": 6800,
        "estimated_monthly_usd": 542.80,
        "capacity_required": 8,
        "is_trending": False,
        "is_new": True
    },
    {
        "id": "app-13",
        "name": "MoodTrack",
        "description": "Daily mood journaling with pattern insights.",
        "icon": "shield",
        "category": "Wellness",
        "subscription_price": 3.99,
        "revenue_share": 73,
        "revenue_per_node": 112.60,
        "active_nodes": 2640,
        "total_slots": 4000,
        "available_slots": 1360,
        "subscribers": 39200,
        "estimated_monthly_usd": 112.60,
        "capacity_required": 2,
        "is_trending": True,
        "is_new": False
    },
    {
        "id": "app-14",
        "name": "VoiceMemo Pro",
        "description": "Voice-to-text memos with automatic summarization.",
        "icon": "video",
        "category": "Productivity",
        "subscription_price": 9.99,
        "revenue_share": 66,
        "revenue_per_node": 267.40,
        "active_nodes": 1560,
        "total_slots": 2500,
        "available_slots": 940,
        "subscribers": 23400,
        "estimated_monthly_usd": 267.40,
        "capacity_required": 5,
        "is_trending": False,
        "is_new": False
    },
    {
        "id": "app-15",
        "name": "ChatHelper",
        "description": "AI writing assistant for emails and messages.",
        "icon": "cpu",
        "category": "Communication",
        "subscription_price": 6.99,
        "revenue_share": 69,
        "revenue_per_node": 178.20,
        "active_nodes": 2180,
        "total_slots": 3500,
        "available_slots": 1320,
        "subscribers": 32600,
        "estimated_monthly_usd": 178.20,
        "capacity_required": 4,
        "is_trending": True,
        "is_new": False
    }
]

# Featured apps for demo
MOCK_FEATURED_APPS = [
    {
        "id": "featured-1",
        "name": "FocusTune",
        "description": "One-tap background sounds for deep focus.",
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
        "description": "Reviews message tone for clarity and politeness.",
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
        "description": "Helps rewrite negative thoughts with cognitive reframing.",
        "category": "Wellness",
        "subscription_price": 4.99,
        "revenue_share": 70,
        "capacity_required": 3,
        "icon_url": None,
        "is_featured": True,
        "featured_until": "2025-02-18T00:00:00Z"
    }
]


@router.get("/apps/installed")
async def get_installed_apps(user=Depends(get_current_user)):
    """Get all installed apps for current user"""
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for app in apps:
        result.append({
            "id": app["id"],
            "name": app["name"],
            "icon": app["icon"],
            "status": app["status"],
            "subscribers_served": app.get("subscribers_served", 0),
            "revenue_usd": app.get("revenue_usd", 0),
            "signups_driven": app.get("signups_driven", 0),
            "opt_rewards_earned": app.get("opt_rewards_earned", 0),
            "health": app["health"],
            "installed_at": app["installed_at"]
        })
    return result


@router.delete("/apps/installed/{app_id}")
async def uninstall_app(app_id: str, user=Depends(get_current_user)):
    """Uninstall an app"""
    result = await db.installed_apps.delete_one({"id": app_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="App not found")
    return {"message": "App uninstalled successfully"}


@router.get("/apps/available")
async def get_available_apps(
    category: Optional[str] = None,
    trending: Optional[bool] = None,
    new: Optional[bool] = None,
    sort_by: Optional[str] = None,  # revenue, subscribers, price, capacity
    sort_order: Optional[str] = "desc",  # asc, desc
    min_revenue: Optional[float] = None,
    max_capacity: Optional[int] = None,
    user=Depends(get_current_user)
):
    """Get available apps from app factory with filtering and sorting"""
    # Get user's installed apps
    installed = await db.installed_apps.find({"user_id": user["id"]}, {"id": 1}).to_list(100)
    installed_ids = {app["id"] for app in installed}
    
    result = []
    for app in AVAILABLE_APPS:
        if app["id"] in installed_ids:
            continue
        if category and app["category"] != category:
            continue
        if trending is True and not app.get("is_trending"):
            continue
        if new is True and not app.get("is_new"):
            continue
        if min_revenue is not None and app.get("revenue_per_node", 0) < min_revenue:
            continue
        if max_capacity is not None and app.get("capacity_required", 0) > max_capacity:
            continue
        
        result.append({
            **app,
            "is_installed": False
        })
    
    # Apply sorting
    if sort_by:
        sort_key_map = {
            "revenue": "revenue_per_node",
            "subscribers": "subscribers",
            "price": "subscription_price",
            "capacity": "capacity_required",
            "popularity": "active_nodes"
        }
        key = sort_key_map.get(sort_by, "revenue_per_node")
        reverse = sort_order != "asc"
        result.sort(key=lambda x: x.get(key, 0), reverse=reverse)
    
    return result


@router.get("/apps/compare")
async def compare_apps(
    app_ids: str,  # Comma-separated app IDs
    user=Depends(get_current_user)
):
    """Compare multiple apps side by side"""
    ids = [id.strip() for id in app_ids.split(",")]
    
    if len(ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 apps can be compared")
    
    # Get user's installed apps
    installed = await db.installed_apps.find({"user_id": user["id"]}, {"id": 1}).to_list(100)
    installed_ids = {app["id"] for app in installed}
    
    # Find the requested apps
    result = []
    for app in AVAILABLE_APPS:
        if app["id"] in ids:
            result.append({
                **app,
                "is_installed": app["id"] in installed_ids
            })
    
    # Also check featured apps
    for app in MOCK_FEATURED_APPS:
        if app["id"] in ids and app["id"] not in [r["id"] for r in result]:
            result.append({
                **app,
                "is_installed": app["id"] in installed_ids,
                "active_nodes": 1500,
                "subscribers": 20000,
                "total_slots": 3000,
                "available_slots": 1500
            })
    
    return result


@router.get("/apps/categories")
async def get_app_categories():
    """Get list of available app categories with counts"""
    categories = {}
    for app in AVAILABLE_APPS:
        cat = app["category"]
        if cat not in categories:
            categories[cat] = {"name": cat, "count": 0, "trending_count": 0}
        categories[cat]["count"] += 1
        if app.get("is_trending"):
            categories[cat]["trending_count"] += 1
    
    return list(categories.values())


@router.post("/apps/install/{app_id}")
async def install_app(app_id: str, user=Depends(get_current_user)):
    """Install an app from the app factory"""
    # Check if already installed
    existing = await db.installed_apps.find_one({"id": app_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="App already installed")
    
    # Find app in catalog
    app_data = next((a for a in AVAILABLE_APPS if a["id"] == app_id), None)
    if not app_data:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Check capacity
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=400, detail="No node configured")
    
    installed_apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    used_capacity = sum(a.get("capacity_used", 0) for a in installed_apps)
    available = node.get("total_capacity", 100) - used_capacity
    
    if app_data["capacity_required"] > available:
        raise HTTPException(status_code=400, detail="Insufficient capacity")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create installed app
    new_app = {
        "id": app_id,
        "user_id": user["id"],
        "name": app_data["name"],
        "icon": app_data["icon"],
        "status": "running",
        "subscribers_served": 0,
        "revenue_usd": 0,
        "signups_driven": 0,
        "opt_rewards_earned": 0,
        "health": "healthy",
        "installed_at": now,
        "capacity_used": app_data["capacity_required"]
    }
    
    await db.installed_apps.insert_one(new_app)
    
    return {
        "message": "App installed successfully",
        "app": {
            "id": app_id,
            "name": app_data["name"],
            "status": "running"
        }
    }


@router.get("/apps/featured")
async def get_featured_apps():
    """Get currently featured apps for display in App Factory"""
    now = datetime.now(timezone.utc).isoformat()
    
    # First check for real featured apps from database
    featured = await db.app_submissions.find({
        "featured": True,
        "featured_until": {"$gt": now},
        "status": "approved"
    }, {"_id": 0}).to_list(10)
    
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
    
    # If no real featured apps, return mock featured apps
    if not result:
        return MOCK_FEATURED_APPS
    
    return result
