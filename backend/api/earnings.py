"""
Earnings and payouts routes
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from typing import List
import random

from utils.database import db
from utils.auth import get_current_user
from utils.config import COINMARKETCAP_API_KEY

router = APIRouter(tags=["Earnings"])

# OPT Price Cache
OPT_PRICE_CACHE = {"price": 0.85, "last_updated": None}


async def get_opt_price() -> float:
    """Get current OPT token price"""
    global OPT_PRICE_CACHE
    
    # Check cache (5 minutes)
    if OPT_PRICE_CACHE["last_updated"]:
        elapsed = datetime.now(timezone.utc) - OPT_PRICE_CACHE["last_updated"]
        if elapsed.total_seconds() < 300:
            return OPT_PRICE_CACHE["price"]
    
    try:
        if COINMARKETCAP_API_KEY:
            # Mock realistic price behavior
            base_price = 0.85
            variation = random.uniform(-0.05, 0.05)
            price = base_price + variation
            OPT_PRICE_CACHE = {
                "price": round(price, 4),
                "last_updated": datetime.now(timezone.utc)
            }
            return OPT_PRICE_CACHE["price"]
    except Exception:
        pass
    
    return 0.85


@router.get("/earnings")
async def get_earnings(user=Depends(get_current_user)):
    """Get earnings data for current user"""
    # Get installed apps USD earnings
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    earnings_by_app = []
    total_today_usd = 0
    total_today_opt_rewards = 0
    
    for app in apps:
        daily_usd = app.get("revenue_usd", 0) / 30
        daily_opt_rewards = app.get("opt_rewards_earned", 0) / 30
        total_today_usd += daily_usd
        total_today_opt_rewards += daily_opt_rewards
        earnings_by_app.append({
            "app_name": app["name"],
            "usd": round(daily_usd, 2),
            "subscribers": app.get("subscribers_served", 0),
            "signups_driven": app.get("signups_driven", 0),
            "opt_rewards": round(daily_opt_rewards, 2)
        })
    
    # Get history
    history = await db.earnings_history.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    week_usd = sum(h.get("usd", 0) for h in history[:7])
    month_usd = sum(h.get("usd", 0) for h in history[:30])
    week_opt = sum(h.get("opt_rewards", 0) for h in history[:7])
    month_opt = sum(h.get("opt_rewards", 0) for h in history[:30])
    
    # Get total OPT rewards from referrals
    referral_data = await db.referrals.find_one({"user_id": user["id"]}, {"_id": 0})
    total_opt_rewards = referral_data.get("total_opt_earned", 0) if referral_data else 0
    
    daily_history = [
        {
            "date": h["date"], 
            "usd": h.get("usd", 0), 
            "opt_rewards": h.get("opt_rewards", 0)
        }
        for h in reversed(history[:30])
    ]
    
    return {
        "today_usd": round(total_today_usd, 2),
        "week_usd": round(week_usd, 2),
        "month_usd": round(month_usd, 2),
        "today_opt_rewards": round(total_today_opt_rewards, 2),
        "week_opt_rewards": round(week_opt, 2),
        "month_opt_rewards": round(month_opt, 2),
        "total_opt_rewards": round(total_opt_rewards, 2),
        "earnings_by_app": earnings_by_app,
        "daily_history": daily_history
    }


@router.get("/price/opt")
async def get_current_opt_price():
    """Get current OPT token price"""
    price = await get_opt_price()
    return {
        "symbol": "OPT",
        "price_usd": price,
        "change_24h": round(random.uniform(-5, 8), 2),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/payouts")
async def get_payouts(user=Depends(get_current_user)):
    """Get payout history for current user"""
    payouts = await db.payouts.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(50)
    
    if not payouts:
        # Return mock data for demo
        return [
            {
                "id": "payout-001",
                "date": "2025-01-01T00:00:00Z",
                "amount_opt": 245.50,
                "amount_usd": 208.68,
                "status": "completed",
                "tx_hash": "0x123...abc"
            },
            {
                "id": "payout-002",
                "date": "2024-12-01T00:00:00Z",
                "amount_opt": 198.30,
                "amount_usd": 168.56,
                "status": "completed",
                "tx_hash": "0x456...def"
            }
        ]
    
    return payouts
