"""
Node stats and management routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import List

from utils.database import db
from utils.auth import get_current_user
from models.schemas import NodeStats

router = APIRouter(tags=["Node"])


@router.get("/node/stats")
async def get_node_stats(user=Depends(get_current_user)):
    """Get node statistics for current user"""
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    return {
        "node_id": node["node_id"],
        "status": node["status"],
        "uptime_percent": node["uptime_percent"],
        "cpu_usage": node["cpu_usage"],
        "memory_usage": node["memory_usage"],
        "storage_usage": node["storage_usage"],
        "latency_ms": node["latency_ms"],
        "last_heartbeat": node["last_heartbeat"],
        "reliability_score": node["reliability_score"],
        "reputation_score": node["reputation_score"]
    }


@router.post("/node/verify")
async def verify_node(user=Depends(get_current_user)):
    """Verify node health and update heartbeat"""
    now = datetime.now(timezone.utc).isoformat()
    await db.nodes.update_one(
        {"user_id": user["id"]},
        {"$set": {"last_heartbeat": now, "status": "healthy"}}
    )
    return {"message": "Node verified successfully", "verified_at": now}


@router.get("/capacity")
async def get_capacity(user=Depends(get_current_user)):
    """Get capacity allocation data"""
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    total = node.get("total_capacity", 100)
    used = sum(app.get("capacity_used", 0) for app in apps)
    
    app_usage = [
        {
            "app_name": app["name"],
            "capacity_used": app.get("capacity_used", 0),
            "percentage": round(app.get("capacity_used", 0) / total * 100, 1) if total > 0 else 0
        }
        for app in apps
    ]
    
    return {
        "total_capacity": total,
        "used_capacity": used,
        "available_capacity": total - used,
        "app_usage": app_usage
    }
