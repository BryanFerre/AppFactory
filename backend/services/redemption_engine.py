"""
Points Redemption System

This module handles:
- Rewards catalog management
- Points redemption
- Redemption history
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid

# Default Rewards Catalog
DEFAULT_REWARDS = [
    {
        "id": "fee_discount_5",
        "name": "5% Fee Discount",
        "description": "Get 5% off platform fees for 30 days",
        "category": "discounts",
        "points_cost": 500,
        "icon": "percent",
        "color": "#10B981",
        "type": "discount",
        "value": {"discount_percent": 5, "duration_days": 30},
        "stock": -1,  # -1 = unlimited
        "enabled": True
    },
    {
        "id": "fee_discount_10",
        "name": "10% Fee Discount",
        "description": "Get 10% off platform fees for 30 days",
        "category": "discounts",
        "points_cost": 1000,
        "icon": "percent",
        "color": "#22C55E",
        "type": "discount",
        "value": {"discount_percent": 10, "duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "fee_discount_25",
        "name": "25% Fee Discount",
        "description": "Get 25% off platform fees for 30 days",
        "category": "discounts",
        "points_cost": 2500,
        "icon": "percent",
        "color": "#059669",
        "type": "discount",
        "value": {"discount_percent": 25, "duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "featured_app_week",
        "name": "Featured App (1 Week)",
        "description": "Feature your app on the marketplace for 1 week",
        "category": "promotion",
        "points_cost": 2000,
        "icon": "star",
        "color": "#F59E0B",
        "type": "featured",
        "value": {"duration_days": 7},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "featured_app_month",
        "name": "Featured App (1 Month)",
        "description": "Feature your app on the marketplace for 1 month",
        "category": "promotion",
        "points_cost": 5000,
        "icon": "star",
        "color": "#D97706",
        "type": "featured",
        "value": {"duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "priority_support",
        "name": "Priority Support",
        "description": "Get priority support for 30 days",
        "category": "support",
        "points_cost": 1500,
        "icon": "headphones",
        "color": "#8B5CF6",
        "type": "support",
        "value": {"duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "extra_capacity_1gb",
        "name": "Extra Capacity (1 GB)",
        "description": "Add 1 GB extra capacity to your node for 30 days",
        "category": "resources",
        "points_cost": 750,
        "icon": "hard-drive",
        "color": "#06B6D4",
        "type": "capacity",
        "value": {"capacity_gb": 1, "duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "extra_capacity_5gb",
        "name": "Extra Capacity (5 GB)",
        "description": "Add 5 GB extra capacity to your node for 30 days",
        "category": "resources",
        "points_cost": 3000,
        "icon": "hard-drive",
        "color": "#0891B2",
        "type": "capacity",
        "value": {"capacity_gb": 5, "duration_days": 30},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "opt_bonus_10",
        "name": "10 OPT Bonus",
        "description": "Receive 10 OPT tokens",
        "category": "tokens",
        "points_cost": 1000,
        "icon": "coins",
        "color": "#EC4899",
        "type": "tokens",
        "value": {"opt_amount": 10},
        "stock": 100,  # Limited stock
        "enabled": True
    },
    {
        "id": "opt_bonus_50",
        "name": "50 OPT Bonus",
        "description": "Receive 50 OPT tokens",
        "category": "tokens",
        "points_cost": 4500,
        "icon": "coins",
        "color": "#DB2777",
        "type": "tokens",
        "value": {"opt_amount": 50},
        "stock": 50,
        "enabled": True
    },
    {
        "id": "exclusive_badge",
        "name": "Exclusive Badge",
        "description": "Unlock an exclusive profile badge",
        "category": "cosmetic",
        "points_cost": 2000,
        "icon": "award",
        "color": "#A855F7",
        "type": "badge",
        "value": {"badge_id": "points_redeemer"},
        "stock": -1,
        "enabled": True
    },
    {
        "id": "early_access",
        "name": "Early Access Pass",
        "description": "Get early access to new features for 60 days",
        "category": "access",
        "points_cost": 3500,
        "icon": "rocket",
        "color": "#6366F1",
        "type": "access",
        "value": {"duration_days": 60},
        "stock": -1,
        "enabled": True
    }
]

# Reward Categories
REWARD_CATEGORIES = {
    "discounts": {"name": "Fee Discounts", "icon": "percent", "color": "#10B981"},
    "promotion": {"name": "App Promotion", "icon": "star", "color": "#F59E0B"},
    "support": {"name": "Support", "icon": "headphones", "color": "#8B5CF6"},
    "resources": {"name": "Resources", "icon": "hard-drive", "color": "#06B6D4"},
    "tokens": {"name": "OPT Tokens", "icon": "coins", "color": "#EC4899"},
    "cosmetic": {"name": "Cosmetic", "icon": "award", "color": "#A855F7"},
    "access": {"name": "Early Access", "icon": "rocket", "color": "#6366F1"}
}


class RedemptionEngine:
    def __init__(self, db):
        self.db = db
    
    async def initialize(self):
        """Initialize rewards catalog and indexes"""
        await self.db.rewards_catalog.create_index("id", unique=True)
        await self.db.redemptions.create_index([("user_id", 1), ("created_at", -1)])
        await self.db.redemptions.create_index("status")
        await self.db.user_active_rewards.create_index([("user_id", 1), ("expires_at", 1)])
        
        # Seed default rewards if empty
        existing = await self.db.rewards_catalog.count_documents({})
        if existing == 0:
            for reward in DEFAULT_REWARDS:
                reward["created_at"] = datetime.now(timezone.utc).isoformat()
                await self.db.rewards_catalog.insert_one(reward)
    
    async def get_rewards_catalog(self, include_disabled: bool = False) -> List[Dict]:
        """Get all available rewards"""
        query = {} if include_disabled else {"enabled": True}
        cursor = self.db.rewards_catalog.find(query, {"_id": 0})
        rewards = await cursor.to_list(length=100)
        
        # Add stock info
        for reward in rewards:
            if reward.get("stock", -1) >= 0:
                # Count redemptions
                redeemed = await self.db.redemptions.count_documents({
                    "reward_id": reward["id"],
                    "status": {"$in": ["completed", "pending"]}
                })
                reward["remaining_stock"] = max(0, reward["stock"] - redeemed)
            else:
                reward["remaining_stock"] = -1  # Unlimited
        
        return rewards
    
    async def get_reward(self, reward_id: str) -> Optional[Dict]:
        """Get a specific reward"""
        return await self.db.rewards_catalog.find_one({"id": reward_id}, {"_id": 0})
    
    async def redeem_reward(self, user_id: str, reward_id: str) -> Dict:
        """Redeem a reward using points"""
        # Get reward
        reward = await self.get_reward(reward_id)
        if not reward:
            return {"success": False, "reason": "reward_not_found", "message": "Reward not found"}
        
        if not reward.get("enabled", True):
            return {"success": False, "reason": "reward_disabled", "message": "This reward is not available"}
        
        # Check stock
        if reward.get("stock", -1) >= 0:
            redeemed = await self.db.redemptions.count_documents({
                "reward_id": reward_id,
                "status": {"$in": ["completed", "pending"]}
            })
            if redeemed >= reward["stock"]:
                return {"success": False, "reason": "out_of_stock", "message": "This reward is out of stock"}
        
        # Get user points
        from services.points_engine import PointsEngine
        points_engine = PointsEngine(self.db)
        summary = await points_engine.get_user_summary(user_id)
        
        points_cost = reward["points_cost"]
        if summary.get("total_points", 0) < points_cost:
            return {
                "success": False, 
                "reason": "insufficient_points",
                "message": f"You need {points_cost} points but only have {summary.get('total_points', 0)}"
            }
        
        now = datetime.now(timezone.utc)
        redemption_id = str(uuid.uuid4())
        
        # Create redemption record
        redemption = {
            "id": redemption_id,
            "user_id": user_id,
            "reward_id": reward_id,
            "reward_name": reward["name"],
            "points_spent": points_cost,
            "status": "completed",
            "value": reward.get("value", {}),
            "created_at": now.isoformat(),
            "completed_at": now.isoformat()
        }
        await self.db.redemptions.insert_one(redemption)
        
        # Deduct points (negative entry in ledger)
        await self.db.activity_points_ledger.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action_id": "points_redemption",
            "action_name": f"Redeemed: {reward['name']}",
            "category": "redemption",
            "points": -points_cost,  # Negative
            "event_id": redemption_id,
            "created_at": now.isoformat()
        })
        
        # Update user summary
        await points_engine.update_user_summary(user_id)
        
        # Create active reward entry if applicable
        if reward.get("value", {}).get("duration_days"):
            from datetime import timedelta
            expires_at = now + timedelta(days=reward["value"]["duration_days"])
            await self.db.user_active_rewards.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "reward_id": reward_id,
                "reward_type": reward["type"],
                "value": reward["value"],
                "redemption_id": redemption_id,
                "activated_at": now.isoformat(),
                "expires_at": expires_at.isoformat()
            })
        
        return {
            "success": True,
            "redemption_id": redemption_id,
            "reward": reward,
            "points_spent": points_cost,
            "message": f"Successfully redeemed {reward['name']}"
        }
    
    async def get_user_redemptions(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's redemption history"""
        cursor = self.db.redemptions.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    
    async def get_user_active_rewards(self, user_id: str) -> List[Dict]:
        """Get user's currently active rewards"""
        now = datetime.now(timezone.utc).isoformat()
        cursor = self.db.user_active_rewards.find(
            {"user_id": user_id, "expires_at": {"$gt": now}},
            {"_id": 0}
        )
        active = await cursor.to_list(length=50)
        
        # Enrich with reward details
        for item in active:
            reward = await self.get_reward(item["reward_id"])
            if reward:
                item["reward_name"] = reward["name"]
                item["reward_icon"] = reward["icon"]
                item["reward_color"] = reward["color"]
        
        return active
    
    async def update_reward(self, reward_id: str, updates: Dict) -> bool:
        """Update reward configuration (admin only)"""
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await self.db.rewards_catalog.update_one(
            {"id": reward_id},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    async def get_redemption_stats(self) -> Dict:
        """Get overall redemption statistics"""
        # Total redemptions
        total = await self.db.redemptions.count_documents({})
        completed = await self.db.redemptions.count_documents({"status": "completed"})
        
        # Points spent
        pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total_points": {"$sum": "$points_spent"}}}
        ]
        result = await self.db.redemptions.aggregate(pipeline).to_list(1)
        total_points_spent = result[0]["total_points"] if result else 0
        
        # By reward
        pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {
                "_id": "$reward_id",
                "count": {"$sum": 1},
                "points": {"$sum": "$points_spent"}
            }}
        ]
        by_reward = await self.db.redemptions.aggregate(pipeline).to_list(50)
        
        return {
            "total_redemptions": total,
            "completed_redemptions": completed,
            "total_points_spent": total_points_spent,
            "by_reward": by_reward
        }
