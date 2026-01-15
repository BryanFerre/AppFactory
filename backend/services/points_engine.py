"""
Points Engine Service - Core logic for the User Activity Points System

This service handles:
- Event-driven points awarding
- Idempotent processing (prevent double-awarding)
- Cooldown enforcement (daily/weekly/monthly)
- Milestone detection
- Streak tracking
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase

# Tier definitions
TIERS = [
    {"name": "Starter", "min_points": 0, "badge_color": "#94A3B8"},
    {"name": "Builder", "min_points": 1000, "badge_color": "#22C55E"},
    {"name": "Contributor", "min_points": 5000, "badge_color": "#3B82F6"},
    {"name": "Champion", "min_points": 25000, "badge_color": "#A855F7"},
    {"name": "Legend", "min_points": 100000, "badge_color": "#F59E0B"},
]

# Cooldown types
COOLDOWN_NONE = "none"
COOLDOWN_DAILY = "daily"
COOLDOWN_WEEKLY = "weekly"
COOLDOWN_MONTHLY = "monthly"
COOLDOWN_ONCE = "once"  # One-time only

# Action categories
CATEGORIES = {
    "ecosystem": "Ecosystem-Defining",
    "growth": "Growth & Distribution",
    "revenue": "Revenue & Monetization",
    "builder": "Builder & Developer",
    "operations": "Node Operations",
    "community": "Community & Ambassador",
    "feedback": "Feedback & Quality",
    "engagement": "Engagement & Consistency",
    "milestones": "Milestones & Achievements",
    "longterm": "Long-Term Impact",
}

# Default action catalog - configurable via admin
DEFAULT_ACTIONS = [
    # Tier 1 – Ecosystem-Defining (1,000–5,000 pts)
    {"id": "publish_app", "name": "Publish an App", "category": "ecosystem", "base_points": 2000, "cooldown": COOLDOWN_NONE, "description": "Successfully publish an app to the marketplace"},
    {"id": "app_100_users", "name": "App Reaches 100 Users", "category": "ecosystem", "base_points": 3000, "cooldown": COOLDOWN_ONCE, "description": "Your app reaches 100 active users"},
    {"id": "app_1000_users", "name": "App Reaches 1,000 Users", "category": "ecosystem", "base_points": 5000, "cooldown": COOLDOWN_ONCE, "description": "Your app reaches 1,000 active users"},
    {"id": "purchase_node", "name": "Purchase NAPP Node", "category": "ecosystem", "base_points": 5000, "cooldown": COOLDOWN_ONCE, "description": "Purchase your first NAPP Node"},
    {"id": "refer_node_purchase", "name": "Referral Node Purchase", "category": "ecosystem", "base_points": 2500, "cooldown": COOLDOWN_NONE, "description": "Someone you referred purchases a node"},
    {"id": "app_adopted_10_nodes", "name": "App Adopted by 10 Nodes", "category": "ecosystem", "base_points": 1500, "cooldown": COOLDOWN_ONCE, "description": "Your app is installed on 10+ nodes"},
    {"id": "app_adopted_50_nodes", "name": "App Adopted by 50 Nodes", "category": "ecosystem", "base_points": 3000, "cooldown": COOLDOWN_ONCE, "description": "Your app is installed on 50+ nodes"},
    
    # Tier 2 – Growth & Distribution (250–1,000 pts)
    {"id": "install_app", "name": "Install an App", "category": "growth", "base_points": 250, "cooldown": COOLDOWN_NONE, "description": "Install an app on your node"},
    {"id": "promote_app", "name": "Promote an App", "category": "growth", "base_points": 300, "cooldown": COOLDOWN_DAILY, "description": "Share an app via social media"},
    {"id": "referral_signup", "name": "Referral Signup", "category": "growth", "base_points": 500, "cooldown": COOLDOWN_NONE, "description": "Someone signs up using your referral link"},
    {"id": "referral_conversion", "name": "Referral Conversion", "category": "growth", "base_points": 1000, "cooldown": COOLDOWN_NONE, "description": "Your referral makes a purchase"},
    {"id": "early_app_adopter", "name": "Early App Adopter", "category": "growth", "base_points": 400, "cooldown": COOLDOWN_NONE, "description": "Install a trending app within first week"},
    {"id": "run_campaign", "name": "Run Promotion Campaign", "category": "growth", "base_points": 750, "cooldown": COOLDOWN_WEEKLY, "description": "Complete a promotional campaign"},
    
    # Tier 3 – Revenue & Monetization (200–1,500 pts)
    {"id": "app_first_revenue", "name": "App First Revenue", "category": "revenue", "base_points": 1000, "cooldown": COOLDOWN_ONCE, "description": "Your app earns its first revenue"},
    {"id": "app_revenue_100", "name": "App Earns $100", "category": "revenue", "base_points": 500, "cooldown": COOLDOWN_ONCE, "description": "Your app earns $100 total"},
    {"id": "app_revenue_1000", "name": "App Earns $1,000", "category": "revenue", "base_points": 1500, "cooldown": COOLDOWN_ONCE, "description": "Your app earns $1,000 total"},
    {"id": "enable_opt_payments", "name": "Enable OPT Payments", "category": "revenue", "base_points": 300, "cooldown": COOLDOWN_ONCE, "description": "Enable OPT token payments"},
    {"id": "node_first_payout", "name": "Node First Payout", "category": "revenue", "base_points": 750, "cooldown": COOLDOWN_ONCE, "description": "Receive your first node payout"},
    {"id": "monthly_revenue_growth", "name": "Monthly Revenue Growth", "category": "revenue", "base_points": 200, "cooldown": COOLDOWN_MONTHLY, "description": "Increase revenue month-over-month"},
    
    # Tier 4 – Builder & Developer Actions (150–750 pts)
    {"id": "create_app_draft", "name": "Create App Draft", "category": "builder", "base_points": 150, "cooldown": COOLDOWN_NONE, "description": "Start building a new app"},
    {"id": "sdk_integration", "name": "SDK Integration", "category": "builder", "base_points": 500, "cooldown": COOLDOWN_NONE, "description": "Integrate with Optio SDK"},
    {"id": "app_feature_update", "name": "App Feature Update", "category": "builder", "base_points": 300, "cooldown": COOLDOWN_WEEKLY, "description": "Release a new feature for your app"},
    {"id": "app_performance_improvement", "name": "Performance Improvement", "category": "builder", "base_points": 400, "cooldown": COOLDOWN_MONTHLY, "description": "Improve app performance metrics"},
    {"id": "submit_app_review", "name": "Submit App for Review", "category": "builder", "base_points": 200, "cooldown": COOLDOWN_NONE, "description": "Submit app for marketplace review"},
    
    # Tier 5 – Node Operations & Reliability (100–600 pts) - No uptime streaks per user request
    {"id": "node_health_check", "name": "Node Health Check", "category": "operations", "base_points": 100, "cooldown": COOLDOWN_DAILY, "description": "Complete daily node health check"},
    {"id": "pass_node_audit", "name": "Pass Node Audit", "category": "operations", "base_points": 500, "cooldown": COOLDOWN_MONTHLY, "description": "Pass a node compliance audit"},
    {"id": "software_upgrade", "name": "Software Upgrade", "category": "operations", "base_points": 200, "cooldown": COOLDOWN_NONE, "description": "Upgrade node software to latest version"},
    {"id": "configure_security", "name": "Configure Security", "category": "operations", "base_points": 300, "cooldown": COOLDOWN_ONCE, "description": "Enable advanced security features"},
    
    # Tier 6 – Community & Ambassador (100–750 pts)
    {"id": "enroll_ambassador", "name": "Become Ambassador", "category": "community", "base_points": 500, "cooldown": COOLDOWN_ONCE, "description": "Enroll in the ambassador program"},
    {"id": "share_referral_link", "name": "Share Referral Link", "category": "community", "base_points": 100, "cooldown": COOLDOWN_DAILY, "description": "Share your referral link"},
    {"id": "refer_developer", "name": "Refer Developer", "category": "community", "base_points": 750, "cooldown": COOLDOWN_NONE, "description": "Refer a developer who publishes an app"},
    {"id": "participate_launch", "name": "Participate in Launch", "category": "community", "base_points": 400, "cooldown": COOLDOWN_NONE, "description": "Participate in a product launch event"},
    {"id": "community_contribution", "name": "Community Contribution", "category": "community", "base_points": 200, "cooldown": COOLDOWN_WEEKLY, "description": "Contribute to community discussions"},
    
    # Tier 7 – Feedback & Quality (75–250 pts)
    {"id": "submit_bug_report", "name": "Submit Bug Report", "category": "feedback", "base_points": 150, "cooldown": COOLDOWN_NONE, "description": "Report a verified bug"},
    {"id": "write_app_review", "name": "Write App Review", "category": "feedback", "base_points": 100, "cooldown": COOLDOWN_NONE, "description": "Write a review for an app"},
    {"id": "beta_testing", "name": "Beta Testing", "category": "feedback", "base_points": 250, "cooldown": COOLDOWN_NONE, "description": "Participate in beta testing"},
    {"id": "ux_feedback", "name": "UX Feedback", "category": "feedback", "base_points": 75, "cooldown": COOLDOWN_WEEKLY, "description": "Provide UX feedback"},
    {"id": "feature_suggestion", "name": "Feature Suggestion", "category": "feedback", "base_points": 100, "cooldown": COOLDOWN_WEEKLY, "description": "Submit a feature suggestion"},
    
    # Tier 8 – Engagement & Consistency (25–300 pts)
    {"id": "daily_login", "name": "Daily Login", "category": "engagement", "base_points": 25, "cooldown": COOLDOWN_DAILY, "description": "Log in to your account"},
    {"id": "login_streak_7", "name": "7-Day Login Streak", "category": "engagement", "base_points": 100, "cooldown": COOLDOWN_ONCE, "description": "Log in for 7 consecutive days"},
    {"id": "login_streak_30", "name": "30-Day Login Streak", "category": "engagement", "base_points": 300, "cooldown": COOLDOWN_ONCE, "description": "Log in for 30 consecutive days"},
    {"id": "login_streak_90", "name": "90-Day Login Streak", "category": "engagement", "base_points": 750, "cooldown": COOLDOWN_ONCE, "description": "Log in for 90 consecutive days"},
    {"id": "login_streak_365", "name": "365-Day Login Streak", "category": "engagement", "base_points": 2000, "cooldown": COOLDOWN_ONCE, "description": "Log in for 365 consecutive days"},
    {"id": "complete_onboarding", "name": "Complete Onboarding", "category": "engagement", "base_points": 200, "cooldown": COOLDOWN_ONCE, "description": "Complete the onboarding process"},
    {"id": "complete_tutorial", "name": "Complete OPT Tutorial", "category": "engagement", "base_points": 200, "cooldown": COOLDOWN_ONCE, "description": "Complete the OPT Points tutorial walkthrough"},
    {"id": "weekly_active", "name": "Weekly Active", "category": "engagement", "base_points": 50, "cooldown": COOLDOWN_WEEKLY, "description": "Be active for a full week"},
    
    # Tier 9 – Milestones & Achievements (300–2,000 pts)
    {"id": "first_app_installed", "name": "First App Installed", "category": "milestones", "base_points": 300, "cooldown": COOLDOWN_ONCE, "description": "Install your first app"},
    {"id": "first_payout_received", "name": "First Payout", "category": "milestones", "base_points": 500, "cooldown": COOLDOWN_ONCE, "description": "Receive your first payout"},
    {"id": "host_10_apps", "name": "Host 10 Apps", "category": "milestones", "base_points": 1000, "cooldown": COOLDOWN_ONCE, "description": "Host 10 apps on your node"},
    {"id": "top_performer_monthly", "name": "Top Performer (Monthly)", "category": "milestones", "base_points": 1500, "cooldown": COOLDOWN_MONTHLY, "description": "Reach top 10% of performers"},
    {"id": "top_app_status", "name": "Top App Status", "category": "milestones", "base_points": 2000, "cooldown": COOLDOWN_ONCE, "description": "Your app reaches top 10 in marketplace"},
    
    # Tier 10 – Long-Term Impact (1,000–5,000 pts)
    {"id": "one_year_member", "name": "1-Year Member", "category": "longterm", "base_points": 1000, "cooldown": COOLDOWN_ONCE, "description": "Be a member for 1 year"},
    {"id": "two_year_member", "name": "2-Year Member", "category": "longterm", "base_points": 2000, "cooldown": COOLDOWN_ONCE, "description": "Be a member for 2 years"},
    {"id": "top_percentile_operator", "name": "Top 1% Operator", "category": "longterm", "base_points": 5000, "cooldown": COOLDOWN_ONCE, "description": "Reach top 1% of all operators"},
    {"id": "genesis_pioneer", "name": "Genesis Pioneer", "category": "longterm", "base_points": 5000, "cooldown": COOLDOWN_ONCE, "description": "Early platform adopter bonus"},
    {"id": "ecosystem_builder", "name": "Ecosystem Builder", "category": "longterm", "base_points": 3000, "cooldown": COOLDOWN_ONCE, "description": "Major contribution to ecosystem growth"},
]


class PointsEngine:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def initialize(self):
        """Initialize collections and seed default actions"""
        # Create indexes
        await self.db.activity_actions.create_index("id", unique=True)
        await self.db.activity_events.create_index([("user_id", 1), ("action_id", 1), ("occurred_at", -1)])
        await self.db.activity_events.create_index("idempotency_key", unique=True, sparse=True)
        await self.db.activity_points_ledger.create_index([("user_id", 1), ("created_at", -1)])
        await self.db.user_points_summary.create_index("user_id", unique=True)
        await self.db.user_login_streaks.create_index("user_id", unique=True)
        
        # Seed default actions if empty
        existing = await self.db.activity_actions.count_documents({})
        if existing == 0:
            for action in DEFAULT_ACTIONS:
                action["enabled"] = True
                action["created_at"] = datetime.now(timezone.utc).isoformat()
                await self.db.activity_actions.insert_one(action)
    
    async def get_action(self, action_id: str) -> Optional[Dict]:
        """Get action configuration by ID"""
        return await self.db.activity_actions.find_one({"id": action_id}, {"_id": 0})
    
    async def get_all_actions(self) -> List[Dict]:
        """Get all action configurations"""
        cursor = self.db.activity_actions.find({}, {"_id": 0})
        return await cursor.to_list(length=100)
    
    async def update_action(self, action_id: str, updates: Dict) -> bool:
        """Update action configuration (admin only)"""
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await self.db.activity_actions.update_one(
            {"id": action_id},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    async def check_cooldown(self, user_id: str, action_id: str, cooldown: str) -> bool:
        """Check if user can perform action based on cooldown"""
        if cooldown == COOLDOWN_NONE:
            return True
        
        now = datetime.now(timezone.utc)
        
        if cooldown == COOLDOWN_ONCE:
            # Check if ever done
            existing = await self.db.activity_events.find_one({
                "user_id": user_id,
                "action_id": action_id
            })
            return existing is None
        
        # Calculate cooldown window
        if cooldown == COOLDOWN_DAILY:
            window_start = now - timedelta(days=1)
        elif cooldown == COOLDOWN_WEEKLY:
            window_start = now - timedelta(weeks=1)
        elif cooldown == COOLDOWN_MONTHLY:
            window_start = now - timedelta(days=30)
        else:
            return True
        
        existing = await self.db.activity_events.find_one({
            "user_id": user_id,
            "action_id": action_id,
            "occurred_at": {"$gte": window_start.isoformat()}
        })
        
        return existing is None
    
    async def award_points(
        self,
        user_id: str,
        action_id: str,
        source_entity_id: Optional[str] = None,
        metadata: Optional[Dict] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Award points to a user for an action
        
        Returns:
            dict with success status, points awarded, and user's new total
        """
        # Check idempotency
        if idempotency_key:
            existing = await self.db.activity_events.find_one({"idempotency_key": idempotency_key})
            if existing:
                return {
                    "success": False,
                    "reason": "duplicate_event",
                    "message": "This event has already been processed"
                }
        
        # Get action config
        action = await self.get_action(action_id)
        if not action:
            return {
                "success": False,
                "reason": "invalid_action",
                "message": f"Action '{action_id}' not found"
            }
        
        if not action.get("enabled", True):
            return {
                "success": False,
                "reason": "action_disabled",
                "message": f"Action '{action_id}' is currently disabled"
            }
        
        # Check cooldown
        can_perform = await self.check_cooldown(user_id, action_id, action.get("cooldown", COOLDOWN_NONE))
        if not can_perform:
            return {
                "success": False,
                "reason": "cooldown_active",
                "message": f"Action '{action_id}' is on cooldown"
            }
        
        now = datetime.now(timezone.utc)
        event_id = str(uuid.uuid4())
        points = action["base_points"]
        
        # Create event record
        event = {
            "id": event_id,
            "user_id": user_id,
            "action_id": action_id,
            "source_entity_id": source_entity_id,
            "occurred_at": now.isoformat(),
            "metadata": metadata or {}
        }
        if idempotency_key:
            event["idempotency_key"] = idempotency_key
        
        await self.db.activity_events.insert_one(event)
        
        # Create ledger entry (immutable)
        ledger_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action_id": action_id,
            "action_name": action["name"],
            "category": action["category"],
            "points": points,
            "event_id": event_id,
            "created_at": now.isoformat()
        }
        await self.db.activity_points_ledger.insert_one(ledger_entry)
        
        # Update user summary
        summary = await self.update_user_summary(user_id)
        
        # Check for streak milestones if this is a daily login
        if action_id == "daily_login":
            await self.update_login_streak(user_id)
        
        return {
            "success": True,
            "points_awarded": points,
            "action_name": action["name"],
            "total_points": summary["total_points"],
            "tier": summary["tier"]
        }
    
    async def update_user_summary(self, user_id: str) -> Dict:
        """Recalculate and update user's points summary"""
        # Get all ledger entries for user
        cursor = self.db.activity_points_ledger.find({"user_id": user_id}, {"_id": 0})
        entries = await cursor.to_list(length=10000)
        
        # Calculate totals
        total_points = sum(e["points"] for e in entries)
        
        # Calculate by category
        by_category = {}
        for entry in entries:
            cat = entry.get("category", "other")
            by_category[cat] = by_category.get(cat, 0) + entry["points"]
        
        # Determine tier
        tier = TIERS[0]
        for t in TIERS:
            if total_points >= t["min_points"]:
                tier = t
        
        summary = {
            "user_id": user_id,
            "total_points": total_points,
            "points_by_category": by_category,
            "tier": tier["name"],
            "tier_color": tier["badge_color"],
            "next_tier": None,
            "points_to_next_tier": None,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        # Find next tier
        for i, t in enumerate(TIERS):
            if t["name"] == tier["name"] and i < len(TIERS) - 1:
                next_tier = TIERS[i + 1]
                summary["next_tier"] = next_tier["name"]
                summary["points_to_next_tier"] = next_tier["min_points"] - total_points
                break
        
        # Upsert summary
        await self.db.user_points_summary.update_one(
            {"user_id": user_id},
            {"$set": summary},
            upsert=True
        )
        
        return summary
    
    async def get_user_summary(self, user_id: str) -> Optional[Dict]:
        """Get user's points summary"""
        summary = await self.db.user_points_summary.find_one({"user_id": user_id}, {"_id": 0})
        if not summary:
            # Create initial summary
            summary = await self.update_user_summary(user_id)
        return summary
    
    async def get_user_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        category: Optional[str] = None
    ) -> List[Dict]:
        """Get user's activity history"""
        query = {"user_id": user_id}
        if category:
            query["category"] = category
        
        cursor = self.db.activity_points_ledger.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).skip(offset).limit(limit)
        
        return await cursor.to_list(length=limit)
    
    async def update_login_streak(self, user_id: str):
        """Update user's login streak and award milestone bonuses"""
        now = datetime.now(timezone.utc)
        today = now.date()
        
        streak_doc = await self.db.user_login_streaks.find_one({"user_id": user_id})
        
        if not streak_doc:
            # First login
            streak_doc = {
                "user_id": user_id,
                "current_streak": 1,
                "longest_streak": 1,
                "last_login_date": today.isoformat(),
                "milestones_awarded": []
            }
            await self.db.user_login_streaks.insert_one(streak_doc)
        else:
            last_login = datetime.fromisoformat(streak_doc["last_login_date"]).date()
            
            if last_login == today:
                # Already logged in today
                return
            elif last_login == today - timedelta(days=1):
                # Consecutive day
                streak_doc["current_streak"] += 1
                if streak_doc["current_streak"] > streak_doc.get("longest_streak", 0):
                    streak_doc["longest_streak"] = streak_doc["current_streak"]
            else:
                # Streak broken
                streak_doc["current_streak"] = 1
            
            streak_doc["last_login_date"] = today.isoformat()
            
            await self.db.user_login_streaks.update_one(
                {"user_id": user_id},
                {"$set": streak_doc}
            )
        
        # Check for streak milestones
        streak = streak_doc["current_streak"]
        milestones_awarded = streak_doc.get("milestones_awarded", [])
        
        streak_milestones = [
            (7, "login_streak_7"),
            (30, "login_streak_30"),
            (90, "login_streak_90"),
            (365, "login_streak_365"),
        ]
        
        for days, action_id in streak_milestones:
            if streak >= days and action_id not in milestones_awarded:
                # Award milestone
                result = await self.award_points(
                    user_id=user_id,
                    action_id=action_id,
                    metadata={"streak_days": days}
                )
                
                if result["success"]:
                    milestones_awarded.append(action_id)
                    await self.db.user_login_streaks.update_one(
                        {"user_id": user_id},
                        {"$set": {"milestones_awarded": milestones_awarded}}
                    )
    
    async def get_login_streak(self, user_id: str) -> Dict:
        """Get user's current login streak info"""
        streak_doc = await self.db.user_login_streaks.find_one({"user_id": user_id}, {"_id": 0})
        if not streak_doc:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "milestones_awarded": []
            }
        return streak_doc
    
    async def reverse_points(
        self,
        user_id: str,
        event_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Reverse points for an event (negative ledger entry)
        Used for fraud, errors, or policy violations
        """
        # Find original event
        event = await self.db.activity_events.find_one({"id": event_id})
        if not event:
            return {"success": False, "reason": "event_not_found"}
        
        if event["user_id"] != user_id:
            return {"success": False, "reason": "user_mismatch"}
        
        # Find original ledger entry
        ledger = await self.db.activity_points_ledger.find_one({"event_id": event_id})
        if not ledger:
            return {"success": False, "reason": "ledger_not_found"}
        
        now = datetime.now(timezone.utc)
        
        # Create reversal entry (negative points)
        reversal = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action_id": f"reversal_{event['action_id']}",
            "action_name": f"Reversal: {ledger['action_name']}",
            "category": ledger["category"],
            "points": -ledger["points"],  # Negative
            "event_id": event_id,
            "reversal_reason": reason,
            "created_at": now.isoformat()
        }
        await self.db.activity_points_ledger.insert_one(reversal)
        
        # Update summary
        summary = await self.update_user_summary(user_id)
        
        return {
            "success": True,
            "points_reversed": ledger["points"],
            "new_total": summary["total_points"]
        }
    
    async def get_leaderboard(self, limit: int = 100, category: Optional[str] = None) -> List[Dict]:
        """Get top users by points"""
        if category:
            # Aggregate by category
            pipeline = [
                {"$match": {"category": category}},
                {"$group": {
                    "_id": "$user_id",
                    "total_points": {"$sum": "$points"}
                }},
                {"$sort": {"total_points": -1}},
                {"$limit": limit}
            ]
            results = await self.db.activity_points_ledger.aggregate(pipeline).to_list(length=limit)
        else:
            # Use pre-calculated summaries
            cursor = self.db.user_points_summary.find(
                {},
                {"_id": 0, "user_id": 1, "total_points": 1, "tier": 1, "tier_color": 1}
            ).sort("total_points", -1).limit(limit)
            results = await cursor.to_list(length=limit)
        
        # Enrich with user info
        enriched = []
        for i, result in enumerate(results):
            user_id = result.get("user_id") or result.get("_id")
            user = await self.db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
            
            enriched.append({
                "rank": i + 1,
                "user_id": user_id,
                "name": user.get("name") if user else "Unknown",
                "email": user.get("email") if user else None,
                "total_points": result.get("total_points", 0),
                "tier": result.get("tier", "Starter"),
                "tier_color": result.get("tier_color", "#94A3B8")
            })
        
        return enriched
    
    async def get_category_stats(self) -> Dict:
        """Get system-wide stats by category"""
        pipeline = [
            {"$group": {
                "_id": "$category",
                "total_points": {"$sum": "$points"},
                "event_count": {"$sum": 1}
            }}
        ]
        results = await self.db.activity_points_ledger.aggregate(pipeline).to_list(length=20)
        
        stats = {}
        for r in results:
            cat = r["_id"]
            stats[cat] = {
                "name": CATEGORIES.get(cat, cat),
                "total_points": r["total_points"],
                "event_count": r["event_count"]
            }
        
        return stats
