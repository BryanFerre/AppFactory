"""
Badges and Achievements System

This module handles:
- Badge definitions and categories
- Badge awarding logic
- User badge tracking
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid

# Badge Categories
BADGE_CATEGORIES = {
    "streaks": "Login Streaks",
    "tier": "Tier Achievements",
    "milestones": "Milestones",
    "community": "Community",
    "builder": "Builder",
    "special": "Special"
}

# Badge Definitions
BADGES = [
    # Streak Badges
    {
        "id": "streak_7",
        "name": "Week Warrior",
        "description": "Login for 7 consecutive days",
        "category": "streaks",
        "icon": "flame",
        "color": "#F97316",
        "requirement": {"type": "streak", "days": 7},
        "points_bonus": 0  # Already awarded via action
    },
    {
        "id": "streak_30",
        "name": "Monthly Master",
        "description": "Login for 30 consecutive days",
        "category": "streaks",
        "icon": "flame",
        "color": "#EF4444",
        "requirement": {"type": "streak", "days": 30},
        "points_bonus": 0
    },
    {
        "id": "streak_90",
        "name": "Quarterly Champion",
        "description": "Login for 90 consecutive days",
        "category": "streaks",
        "icon": "flame",
        "color": "#A855F7",
        "requirement": {"type": "streak", "days": 90},
        "points_bonus": 0
    },
    {
        "id": "streak_365",
        "name": "Year Legend",
        "description": "Login for 365 consecutive days",
        "category": "streaks",
        "icon": "crown",
        "color": "#F59E0B",
        "requirement": {"type": "streak", "days": 365},
        "points_bonus": 0
    },
    
    # Tier Badges
    {
        "id": "tier_builder",
        "name": "Builder",
        "description": "Reach Builder tier (1,000 points)",
        "category": "tier",
        "icon": "zap",
        "color": "#22C55E",
        "requirement": {"type": "tier", "tier": "Builder"},
        "points_bonus": 100
    },
    {
        "id": "tier_contributor",
        "name": "Contributor",
        "description": "Reach Contributor tier (5,000 points)",
        "category": "tier",
        "icon": "award",
        "color": "#3B82F6",
        "requirement": {"type": "tier", "tier": "Contributor"},
        "points_bonus": 250
    },
    {
        "id": "tier_champion",
        "name": "Champion",
        "description": "Reach Champion tier (25,000 points)",
        "category": "tier",
        "icon": "trophy",
        "color": "#A855F7",
        "requirement": {"type": "tier", "tier": "Champion"},
        "points_bonus": 500
    },
    {
        "id": "tier_legend",
        "name": "Legend",
        "description": "Reach Legend tier (100,000 points)",
        "category": "tier",
        "icon": "crown",
        "color": "#F59E0B",
        "requirement": {"type": "tier", "tier": "Legend"},
        "points_bonus": 1000
    },
    
    # Milestone Badges
    {
        "id": "first_app",
        "name": "App Pioneer",
        "description": "Install your first app",
        "category": "milestones",
        "icon": "package",
        "color": "#06B6D4",
        "requirement": {"type": "action", "action_id": "first_app_installed"},
        "points_bonus": 0
    },
    {
        "id": "app_collector",
        "name": "App Collector",
        "description": "Install 10 apps",
        "category": "milestones",
        "icon": "package",
        "color": "#8B5CF6",
        "requirement": {"type": "action", "action_id": "host_10_apps"},
        "points_bonus": 0
    },
    {
        "id": "first_referral",
        "name": "Networker",
        "description": "Get your first referral signup",
        "category": "milestones",
        "icon": "users",
        "color": "#EC4899",
        "requirement": {"type": "action", "action_id": "referral_signup"},
        "points_bonus": 50
    },
    {
        "id": "first_revenue",
        "name": "Revenue Starter",
        "description": "Earn your first revenue",
        "category": "milestones",
        "icon": "dollar-sign",
        "color": "#10B981",
        "requirement": {"type": "action", "action_id": "app_first_revenue"},
        "points_bonus": 0
    },
    
    # Community Badges
    {
        "id": "social_sharer",
        "name": "Social Butterfly",
        "description": "Share 10 referral links",
        "category": "community",
        "icon": "share-2",
        "color": "#6366F1",
        "requirement": {"type": "action_count", "action_id": "share_referral_link", "count": 10},
        "points_bonus": 100
    },
    {
        "id": "ambassador",
        "name": "Ambassador",
        "description": "Enroll as an ambassador",
        "category": "community",
        "icon": "star",
        "color": "#F59E0B",
        "requirement": {"type": "action", "action_id": "enroll_ambassador"},
        "points_bonus": 0
    },
    {
        "id": "top_referrer",
        "name": "Top Referrer",
        "description": "Refer 25 users who sign up",
        "category": "community",
        "icon": "trending-up",
        "color": "#14B8A6",
        "requirement": {"type": "action_count", "action_id": "referral_signup", "count": 25},
        "points_bonus": 500
    },
    
    # Builder Badges
    {
        "id": "app_creator",
        "name": "App Creator",
        "description": "Submit your first app",
        "category": "builder",
        "icon": "code",
        "color": "#8B5CF6",
        "requirement": {"type": "action", "action_id": "submit_app_review"},
        "points_bonus": 0
    },
    {
        "id": "app_publisher",
        "name": "App Publisher",
        "description": "Get an app published",
        "category": "builder",
        "icon": "rocket",
        "color": "#06B6D4",
        "requirement": {"type": "action", "action_id": "publish_app"},
        "points_bonus": 0
    },
    
    # Special Badges
    {
        "id": "early_adopter",
        "name": "Early Adopter",
        "description": "Joined during beta period",
        "category": "special",
        "icon": "sparkles",
        "color": "#F59E0B",
        "requirement": {"type": "special", "condition": "beta_user"},
        "points_bonus": 500
    },
    {
        "id": "genesis",
        "name": "Genesis Pioneer",
        "description": "One of the first 100 users",
        "category": "special",
        "icon": "gem",
        "color": "#EC4899",
        "requirement": {"type": "special", "condition": "first_100"},
        "points_bonus": 1000
    },
    {
        "id": "weekly_champion",
        "name": "Weekly Champion",
        "description": "Top scorer for a week",
        "category": "special",
        "icon": "medal",
        "color": "#F97316",
        "requirement": {"type": "leaderboard", "position": 1, "period": "weekly"},
        "points_bonus": 200
    },
    {
        "id": "monthly_champion",
        "name": "Monthly Champion",
        "description": "Top scorer for a month",
        "category": "special",
        "icon": "trophy",
        "color": "#EF4444",
        "requirement": {"type": "leaderboard", "position": 1, "period": "monthly"},
        "points_bonus": 500
    },
]


class BadgesEngine:
    def __init__(self, db):
        self.db = db
        self.badges_by_id = {b["id"]: b for b in BADGES}
    
    async def initialize(self):
        """Create indexes"""
        await self.db.user_badges.create_index([("user_id", 1), ("badge_id", 1)], unique=True)
        await self.db.user_badges.create_index("user_id")
    
    async def get_all_badges(self) -> List[Dict]:
        """Get all badge definitions"""
        return BADGES
    
    async def get_user_badges(self, user_id: str) -> List[Dict]:
        """Get badges earned by a user"""
        cursor = self.db.user_badges.find({"user_id": user_id}, {"_id": 0})
        user_badges = await cursor.to_list(length=100)
        
        # Enrich with badge details
        enriched = []
        for ub in user_badges:
            badge_def = self.badges_by_id.get(ub["badge_id"])
            if badge_def:
                enriched.append({
                    **badge_def,
                    "earned_at": ub["earned_at"],
                    "earned": True
                })
        
        return enriched
    
    async def get_user_badges_summary(self, user_id: str) -> Dict:
        """Get summary of user's badges"""
        earned = await self.get_user_badges(user_id)
        earned_ids = {b["id"] for b in earned}
        
        # Group by category
        by_category = {}
        for badge in BADGES:
            cat = badge["category"]
            if cat not in by_category:
                by_category[cat] = {
                    "name": BADGE_CATEGORIES[cat],
                    "badges": [],
                    "earned_count": 0,
                    "total_count": 0
                }
            
            badge_info = {
                **badge,
                "earned": badge["id"] in earned_ids,
                "earned_at": next((b["earned_at"] for b in earned if b["id"] == badge["id"]), None)
            }
            by_category[cat]["badges"].append(badge_info)
            by_category[cat]["total_count"] += 1
            if badge["id"] in earned_ids:
                by_category[cat]["earned_count"] += 1
        
        return {
            "total_earned": len(earned),
            "total_available": len(BADGES),
            "by_category": by_category,
            "recent_badges": sorted(earned, key=lambda x: x.get("earned_at", ""), reverse=True)[:5]
        }
    
    async def award_badge(self, user_id: str, badge_id: str) -> Dict:
        """Award a badge to a user"""
        badge = self.badges_by_id.get(badge_id)
        if not badge:
            return {"success": False, "reason": "badge_not_found"}
        
        # Check if already earned
        existing = await self.db.user_badges.find_one({
            "user_id": user_id,
            "badge_id": badge_id
        })
        
        if existing:
            return {"success": False, "reason": "already_earned"}
        
        now = datetime.now(timezone.utc)
        
        # Award badge
        await self.db.user_badges.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "badge_id": badge_id,
            "earned_at": now.isoformat()
        })
        
        # Award bonus points if any
        if badge.get("points_bonus", 0) > 0:
            from services.points_engine import PointsEngine
            engine = PointsEngine(self.db)
            await engine.award_points(
                user_id=user_id,
                action_id=f"badge_bonus_{badge_id}",
                metadata={"badge_name": badge["name"], "bonus_points": badge["points_bonus"]}
            )
        
        return {
            "success": True,
            "badge": badge,
            "points_bonus": badge.get("points_bonus", 0)
        }
    
    async def check_and_award_badges(self, user_id: str) -> List[Dict]:
        """Check all badge conditions and award eligible badges"""
        awarded = []
        
        # Get user's current state
        user_badges = await self.get_user_badges(user_id)
        earned_ids = {b["id"] for b in user_badges}
        
        # Get user's activity summary
        from services.points_engine import PointsEngine
        points_engine = PointsEngine(self.db)
        summary = await points_engine.get_user_summary(user_id)
        streak = await points_engine.get_login_streak(user_id)
        
        # Get action counts
        action_counts = {}
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$action_id", "count": {"$sum": 1}}}
        ]
        results = await self.db.activity_events.aggregate(pipeline).to_list(100)
        for r in results:
            action_counts[r["_id"]] = r["count"]
        
        for badge in BADGES:
            if badge["id"] in earned_ids:
                continue
            
            req = badge["requirement"]
            should_award = False
            
            if req["type"] == "streak":
                should_award = streak.get("current_streak", 0) >= req["days"]
            
            elif req["type"] == "tier":
                should_award = summary.get("tier") == req["tier"]
            
            elif req["type"] == "action":
                should_award = action_counts.get(req["action_id"], 0) >= 1
            
            elif req["type"] == "action_count":
                should_award = action_counts.get(req["action_id"], 0) >= req["count"]
            
            elif req["type"] == "points":
                should_award = summary.get("total_points", 0) >= req["min_points"]
            
            # Skip special and leaderboard badges (awarded manually or via background job)
            
            if should_award:
                result = await self.award_badge(user_id, badge["id"])
                if result["success"]:
                    awarded.append(badge)
        
        return awarded
