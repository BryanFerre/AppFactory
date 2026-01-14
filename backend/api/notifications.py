"""
Notification routes
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import random

from utils.database import db
from utils.auth import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    """Get notifications for current user"""
    notifications = await db.notifications.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    if not notifications:
        # Return mock notifications for demo
        now = datetime.now(timezone.utc)
        notifications = [
            {
                "id": "notif-1",
                "type": "earning",
                "title": "New earnings received",
                "message": "You earned $12.50 from DataVault Pro today",
                "read": False,
                "created_at": (now - timedelta(hours=2)).isoformat()
            },
            {
                "id": "notif-2",
                "type": "referral",
                "title": "New referral signup!",
                "message": "Someone signed up using your referral link. You earned 50 OPT!",
                "read": False,
                "created_at": (now - timedelta(days=1)).isoformat()
            },
            {
                "id": "notif-3",
                "type": "system",
                "title": "Node health check",
                "message": "Your node passed the daily health check with 99.7% uptime",
                "read": True,
                "created_at": (now - timedelta(days=2)).isoformat()
            }
        ]
    
    return notifications
