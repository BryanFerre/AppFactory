"""
Admin routes - dashboard, user management, app review, billing, audit
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional, List
import uuid
import random
import logging

from utils.database import db
from utils.config import ROLE_PERMISSIONS
from utils.auth import (
    hash_password, verify_password, create_token, get_current_admin,
    generate_totp_secret, get_totp_uri, generate_qr_code, verify_totp,
    generate_backup_codes
)
from models.schemas import (
    AdminLogin, AdminCreate, AdminResponse, TwoFactorVerifyRequest,
    AppReviewRequest, SupportTicketUpdate
)

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


class AdminRole:
    SUPER_ADMIN = "super_admin"
    SUPPORT = "support"
    FINANCE = "finance"
    COMPLIANCE = "compliance"
    APP_REVIEW = "app_review"


ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.SUPPORT, AdminRole.FINANCE, AdminRole.COMPLIANCE, AdminRole.APP_REVIEW]


def check_admin_permission(admin: dict, required_permission: str) -> bool:
    """Check if admin has required permission"""
    permissions = ROLE_PERMISSIONS.get(admin.get("role"), [])
    if "*" in permissions:
        return True
    
    for perm in permissions:
        if perm == required_permission:
            return True
        if perm.endswith(":*"):
            prefix = perm[:-2]
            if required_permission.startswith(prefix + ":"):
                return True
    return False


async def log_admin_action(admin: dict, action: str, target_type: str, target_id: str, details: dict, request: Request = None):
    """Log admin action for audit trail"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "admin_role": admin["role"],
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "ip_address": request.client.host if request and request.client else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_audit_logs.insert_one(log_entry)
    return log_entry


# ==================== AUTH ====================

@router.post("/auth/login")
async def admin_login(login_data: AdminLogin):
    """Admin login endpoint with 2FA support"""
    admin = await db.admins.find_one({"email": login_data.email})
    
    if not admin or not verify_password(login_data.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account suspended")
    
    two_fa_enabled = admin.get("two_factor_enabled", False)
    
    if two_fa_enabled:
        if not login_data.totp_code:
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication code required",
                "access_token": None,
                "admin": None
            }
        
        totp_secret = admin.get("totp_secret")
        if not totp_secret or not verify_totp(totp_secret, login_data.totp_code):
            backup_codes = admin.get("backup_codes", [])
            if login_data.totp_code in backup_codes:
                backup_codes.remove(login_data.totp_code)
                await db.admins.update_one(
                    {"id": admin["id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
            else:
                raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_token(admin["id"], is_admin=True)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "admin": {
            "id": admin["id"],
            "email": admin["email"],
            "name": admin["name"],
            "role": admin["role"],
            "permissions": ROLE_PERMISSIONS.get(admin["role"], []),
            "two_factor_enabled": two_fa_enabled
        }
    }


@router.get("/auth/me")
async def get_admin_profile(admin=Depends(get_current_admin)):
    """Get current admin profile"""
    return {
        "id": admin["id"],
        "email": admin["email"],
        "name": admin["name"],
        "role": admin["role"],
        "permissions": ROLE_PERMISSIONS.get(admin["role"], []),
        "is_active": admin.get("is_active", True),
        "last_login": admin.get("last_login"),
        "created_at": admin["created_at"],
        "two_factor_enabled": admin.get("two_factor_enabled", False)
    }


# ==================== 2FA ====================

@router.post("/auth/2fa/setup")
async def admin_setup_2fa(admin=Depends(get_current_admin)):
    """Initialize 2FA setup for admin"""
    if admin.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, admin["email"])
    qr_code = generate_qr_code(uri)
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"pending_totp_secret": secret}}
    )
    
    return {"secret": secret, "qr_code": qr_code, "provisioning_uri": uri}


@router.post("/auth/2fa/verify")
async def admin_verify_2fa_setup(verify_data: TwoFactorVerifyRequest, admin=Depends(get_current_admin)):
    """Verify 2FA setup for admin"""
    pending_secret = admin.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found")
    
    if not verify_totp(pending_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    backup_codes = generate_backup_codes()
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {
            "$set": {
                "totp_secret": pending_secret,
                "two_factor_enabled": True,
                "backup_codes": backup_codes,
                "two_factor_enabled_at": datetime.now(timezone.utc).isoformat()
            },
            "$unset": {"pending_totp_secret": ""}
        }
    )
    
    await log_admin_action(admin, "2FA_ENABLED", "admin", admin["id"], {}, None)
    
    return {"message": "Two-factor authentication enabled successfully", "backup_codes": backup_codes}


@router.post("/auth/2fa/disable")
async def admin_disable_2fa(verify_data: TwoFactorVerifyRequest, admin=Depends(get_current_admin)):
    """Disable 2FA for admin"""
    if not admin.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = admin.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        backup_codes = admin.get("backup_codes", [])
        if verify_data.code not in backup_codes:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.admins.update_one(
        {"id": admin["id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"totp_secret": "", "backup_codes": "", "pending_totp_secret": ""}
        }
    )
    
    await log_admin_action(admin, "2FA_DISABLED", "admin", admin["id"], {}, None)
    
    return {"message": "Two-factor authentication disabled successfully"}


@router.get("/auth/2fa/status")
async def admin_get_2fa_status(admin=Depends(get_current_admin)):
    """Get admin 2FA status"""
    return {
        "two_factor_enabled": admin.get("two_factor_enabled", False),
        "enabled_at": admin.get("two_factor_enabled_at"),
        "backup_codes_remaining": len(admin.get("backup_codes", []))
    }


@router.post("/auth/create")
async def create_admin(admin_data: AdminCreate, current_admin=Depends(get_current_admin), request: Request = None):
    """Create new admin (Super Admin only)"""
    if current_admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can create admin accounts")
    
    if admin_data.role not in ADMIN_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ADMIN_ROLES}")
    
    existing = await db.admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    admin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    new_admin = {
        "id": admin_id,
        "email": admin_data.email,
        "hashed_password": hash_password(admin_data.password),
        "name": admin_data.name,
        "role": admin_data.role,
        "is_active": True,
        "last_login": None,
        "created_at": now,
        "created_by": current_admin["id"]
    }
    
    await db.admins.insert_one(new_admin)
    await log_admin_action(current_admin, "create_admin", "admin", admin_id, {"email": admin_data.email, "role": admin_data.role}, request)
    
    return {"message": "Admin created successfully", "admin_id": admin_id}


# ==================== DASHBOARD ====================

@router.get("/dashboard/stats")
async def get_admin_dashboard_stats(admin=Depends(get_current_admin)):
    """Get admin dashboard statistics"""
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": {"$ne": False}})
    
    pending_apps = await db.app_submissions.count_documents({"status": "pending"})
    approved_apps = await db.app_submissions.count_documents({"status": "approved"})
    rejected_apps = await db.app_submissions.count_documents({"status": "rejected"})
    
    open_tickets = await db.support_tickets.count_documents({"status": {"$in": ["open", "in_progress"]}})
    
    return {
        "users": {"total": total_users, "active": active_users, "suspended": total_users - active_users},
        "nodes": {"total": 12450, "healthy": 11892, "warning": 423, "offline": 135},
        "apps": {"pending": pending_apps, "approved": approved_apps, "rejected": rejected_apps, "total": pending_apps + approved_apps + rejected_apps},
        "support": {"open_tickets": open_tickets},
        "billing": {"failed_payments": 23},
        "revenue": {"total": 2456789.50, "monthly": 342567.80}
    }


# ==================== USERS ====================

@router.get("/users")
async def list_users(search: Optional[str] = None, status: Optional[str] = None, limit: int = 50, offset: int = 0, admin=Depends(get_current_admin)):
    """List all users with filtering"""
    if not check_admin_permission(admin, "users:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"id": search}
        ]
    if status == "active":
        query["is_active"] = {"$ne": False}
    elif status == "suspended":
        query["is_active"] = False
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).skip(offset).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total, "limit": limit, "offset": offset}


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin=Depends(get_current_admin)):
    """Get detailed user information"""
    if not check_admin_permission(admin, "users:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    installed_apps = await db.installed_apps.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    submissions = await db.app_submissions.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    return {**user, "installed_apps": installed_apps, "app_submissions": submissions}


@router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, reason: str, admin=Depends(get_current_admin), request: Request = None):
    """Suspend a user account"""
    if not check_admin_permission(admin, "users:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False, "suspended_at": datetime.now(timezone.utc).isoformat(), "suspension_reason": reason}}
    )
    
    await log_admin_action(admin, "suspend_user", "user", user_id, {"reason": reason}, request)
    
    return {"message": "User suspended successfully"}


@router.post("/users/{user_id}/reinstate")
async def reinstate_user(user_id: str, admin=Depends(get_current_admin), request: Request = None):
    """Reinstate a suspended user account"""
    if not check_admin_permission(admin, "users:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": True}, "$unset": {"suspended_at": "", "suspension_reason": ""}}
    )
    
    await log_admin_action(admin, "reinstate_user", "user", user_id, {}, request)
    
    return {"message": "User reinstated successfully"}


# ==================== NODES ====================

@router.get("/nodes")
async def list_nodes(status: Optional[str] = None, limit: int = 50, offset: int = 0, admin=Depends(get_current_admin)):
    """List all nodes with filtering"""
    if not check_admin_permission(admin, "nodes:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    nodes = [
        {"id": f"node-{i}", "owner_id": f"user-{i%100}", "owner_email": f"user{i}@example.com", 
         "status": "healthy" if i % 10 != 0 else ("warning" if i % 20 != 0 else "offline"),
         "license_status": "active", "capacity_tier": "pro" if i % 3 == 0 else "basic",
         "capacity_gb": 100 if i % 3 == 0 else 50, "used_gb": random.randint(20, 80),
         "installed_apps": random.randint(1, 8), "monthly_earnings": round(random.uniform(50, 500), 2),
         "uptime_percent": round(random.uniform(95, 99.99), 2), "last_seen": datetime.now(timezone.utc).isoformat()}
        for i in range(1, 51)
    ]
    
    if status:
        nodes = [n for n in nodes if n["status"] == status]
    
    return {"nodes": nodes[offset:offset+limit], "total": len(nodes), "limit": limit, "offset": offset}


@router.get("/nodes/{node_id}")
async def get_node_detail(node_id: str, admin=Depends(get_current_admin)):
    """Get detailed node information"""
    if not check_admin_permission(admin, "nodes:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return {
        "id": node_id, "owner_id": "user-123", "owner_email": "nodeowner@example.com",
        "owner_name": "John Operator", "status": "healthy", "license_status": "active",
        "license_expires": "2025-12-31T00:00:00Z", "capacity_tier": "pro",
        "capacity_gb": 100, "used_gb": 67,
        "installed_apps": [{"id": "app-1", "name": "OneTask", "installed_at": "2025-01-01T00:00:00Z"}],
        "earnings": {"total_usd": 2456.78, "total_opt": 1234.56, "this_month_usd": 342.50, "this_month_opt": 156.20},
        "uptime_history": [{"date": "2025-01-10", "uptime_percent": 99.8}],
        "flags": [], "created_at": "2024-06-15T00:00:00Z"
    }


@router.post("/nodes/{node_id}/action")
async def node_action(node_id: str, action: str, reason: Optional[str] = None, admin=Depends(get_current_admin), request: Request = None):
    """Perform action on a node"""
    if not check_admin_permission(admin, "nodes:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    valid_actions = ["flag", "suspend", "reinstate", "adjust_capacity"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    await log_admin_action(admin, f"node_{action}", "node", node_id, {"reason": reason}, request)
    
    return {"message": f"Node {action} action completed successfully"}


# ==================== APP SUBMISSIONS ====================

@router.get("/apps/submissions")
async def list_app_submissions(status: Optional[str] = None, category: Optional[str] = None, limit: int = 50, offset: int = 0, admin=Depends(get_current_admin)):
    """List all app submissions for review"""
    if not check_admin_permission(admin, "apps:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    
    submissions = await db.app_submissions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.app_submissions.count_documents(query)
    
    for sub in submissions:
        user = await db.users.find_one({"id": sub.get("user_id")}, {"_id": 0, "password": 0})
        sub["developer"] = user
    
    return {"submissions": submissions, "total": total, "limit": limit, "offset": offset}


@router.get("/apps/submissions/{submission_id}")
async def get_app_submission_detail(submission_id: str, admin=Depends(get_current_admin)):
    """Get detailed app submission for review"""
    if not check_admin_permission(admin, "apps:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    user = await db.users.find_one({"id": submission.get("user_id")}, {"_id": 0, "password": 0})
    submission["developer"] = user
    
    reviews = await db.app_reviews.find({"submission_id": submission_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    submission["review_history"] = reviews
    
    return submission


@router.post("/apps/submissions/{submission_id}/review")
async def review_app_submission(submission_id: str, review: AppReviewRequest, admin=Depends(get_current_admin), request: Request = None):
    """Review an app submission"""
    if not check_admin_permission(admin, "apps:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    valid_actions = ["approve", "reject", "request_changes"]
    if review.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    now = datetime.now(timezone.utc).isoformat()
    status_map = {"approve": "approved", "reject": "rejected", "request_changes": "needs_revision"}
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "status": status_map[review.action],
            "reviewed_by": admin["id"],
            "reviewed_at": now,
            "review_reason": review.reason,
            "compliance_notes": review.compliance_notes,
            "updated_at": now
        }}
    )
    
    review_record = {
        "id": str(uuid.uuid4()),
        "submission_id": submission_id,
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "action": review.action,
        "reason": review.reason,
        "compliance_notes": review.compliance_notes,
        "created_at": now
    }
    await db.app_reviews.insert_one(review_record)
    
    await log_admin_action(admin, f"app_{review.action}", "app", submission_id, {"reason": review.reason, "app_name": submission["app_name"]}, request)
    
    return {"message": f"App {review.action}d successfully", "new_status": status_map[review.action]}


@router.post("/apps/submissions/{submission_id}/feature")
async def admin_feature_app(
    submission_id: str, 
    days: int = 30,
    admin=Depends(get_current_admin), 
    request: Request = None
):
    """Admin: Feature an approved app for specified number of days"""
    if not check_admin_permission(admin, "apps:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved apps can be featured")
    
    now = datetime.now(timezone.utc)
    from datetime import timedelta
    featured_until = (now + timedelta(days=days)).isoformat()
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "featured": True,
            "featured_until": featured_until,
            "featured_by_admin": admin["id"],
            "updated_at": now.isoformat()
        }}
    )
    
    await log_admin_action(
        admin, 
        "feature_app", 
        "app", 
        submission_id, 
        {"days": days, "featured_until": featured_until, "app_name": submission["app_name"]}, 
        request
    )
    
    return {
        "message": f"App featured for {days} days",
        "featured_until": featured_until
    }


@router.post("/apps/submissions/{submission_id}/unfeature")
async def admin_unfeature_app(
    submission_id: str,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Admin: Remove featured status from an app"""
    if not check_admin_permission(admin, "apps:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {
            "featured": False,
            "featured_until": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_admin_action(
        admin, 
        "unfeature_app", 
        "app", 
        submission_id, 
        {"app_name": submission["app_name"]}, 
        request
    )
    
    return {"message": "App unfeatured successfully"}


@router.patch("/apps/submissions/{submission_id}/tags")
async def admin_update_app_tags(
    submission_id: str,
    tags: List[str],
    is_trending: Optional[bool] = None,
    is_new: Optional[bool] = None,
    staff_pick: Optional[bool] = None,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Admin: Update app tags and special flags"""
    if not check_admin_permission(admin, "apps:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    submission = await db.app_submissions.find_one({"id": submission_id})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    update_data = {
        "tags": tags,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if is_trending is not None:
        update_data["is_trending"] = is_trending
    if is_new is not None:
        update_data["is_new"] = is_new
    if staff_pick is not None:
        update_data["staff_pick"] = staff_pick
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": update_data}
    )
    
    await log_admin_action(
        admin, 
        "update_app_tags", 
        "app", 
        submission_id, 
        {"tags": tags, "is_trending": is_trending, "is_new": is_new, "staff_pick": staff_pick}, 
        request
    )
    
    return {"message": "App tags updated successfully"}


# ==================== SUPPORT TICKETS ====================

@router.get("/support/tickets")
async def list_support_tickets(status: Optional[str] = None, priority: Optional[str] = None, limit: int = 50, offset: int = 0, admin=Depends(get_current_admin)):
    """List support tickets"""
    if not check_admin_permission(admin, "tickets:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tickets = await db.support_tickets.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.support_tickets.count_documents(query)
    
    return {"tickets": tickets, "total": total, "limit": limit, "offset": offset}


@router.patch("/support/tickets/{ticket_id}")
async def update_support_ticket(ticket_id: str, update: SupportTicketUpdate, admin=Depends(get_current_admin), request: Request = None):
    """Update a support ticket"""
    if not check_admin_permission(admin, "tickets:update"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    ticket = await db.support_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if update.status:
        update_data["status"] = update.status
    if update.assigned_to:
        update_data["assigned_to"] = update.assigned_to
    if update.resolution:
        update_data["resolution"] = update.resolution
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
        update_data["resolved_by"] = admin["id"]
    
    await db.support_tickets.update_one({"id": ticket_id}, {"$set": update_data})
    
    await log_admin_action(admin, "update_ticket", "ticket", ticket_id, update.model_dump(exclude_none=True), request)
    
    return {"message": "Ticket updated"}


# ==================== BILLING ====================

@router.get("/billing/transactions")
async def list_billing_transactions(status: Optional[str] = None, limit: int = 50, offset: int = 0, admin=Depends(get_current_admin)):
    """List billing transactions"""
    if not check_admin_permission(admin, "billing:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if status:
        query["payment_status"] = status
    
    transactions = await db.payment_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.payment_transactions.count_documents(query)
    
    return {"transactions": transactions, "total": total, "limit": limit, "offset": offset}


# ==================== REVENUE ====================

@router.get("/revenue/summary")
async def get_revenue_summary(admin=Depends(get_current_admin)):
    """Get network-wide revenue summary"""
    if not check_admin_permission(admin, "revenue:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return {
        "total_revenue": 2456789.50,
        "monthly_revenue": 342567.80,
        "daily_average": 11418.93,
        "by_category": {"Productivity": 1234567.80, "Communication": 567890.20, "Wellness": 654331.50},
        "top_apps": [{"name": "OneTask", "revenue": 456789.00}, {"name": "FocusTune", "revenue": 345678.00}],
        "pending_payouts": 45678.90,
        "processed_payouts": 2411110.60
    }


# ==================== AUDIT LOGS ====================

@router.get("/audit/logs")
async def get_audit_logs(admin_id: Optional[str] = None, target_type: Optional[str] = None, limit: int = 100, offset: int = 0, admin=Depends(get_current_admin)):
    """Get admin audit logs"""
    if not check_admin_permission(admin, "audit:read"):
        raise HTTPException(status_code=403, detail="Permission denied")
    
    query = {}
    if admin_id:
        query["admin_id"] = admin_id
    if target_type:
        query["target_type"] = target_type
    
    logs = await db.admin_audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.admin_audit_logs.count_documents(query)
    
    return {"logs": logs, "total": total, "limit": limit, "offset": offset}


# ==================== ADMIN MANAGEMENT ====================

@router.get("/admins")
async def list_admins(admin=Depends(get_current_admin)):
    """List all admin accounts (Super Admin only)"""
    if admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    admins = await db.admins.find({}, {"_id": 0, "hashed_password": 0}).to_list(100)
    return {"admins": admins}


@router.patch("/admins/{admin_id}")
async def update_admin(admin_id: str, role: Optional[str] = None, is_active: Optional[bool] = None, current_admin=Depends(get_current_admin), request: Request = None):
    """Update admin account (Super Admin only)"""
    if current_admin["role"] != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    
    if admin_id == current_admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot modify your own account")
    
    update_data = {}
    if role:
        if role not in ADMIN_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ADMIN_ROLES}")
        update_data["role"] = role
    if is_active is not None:
        update_data["is_active"] = is_active
    
    if update_data:
        await db.admins.update_one({"id": admin_id}, {"$set": update_data})
        await log_admin_action(current_admin, "update_admin", "admin", admin_id, update_data, request)
    
    return {"message": "Admin updated"}


# ==================== INITIALIZATION ====================

async def init_super_admin():
    """Create default super admin if none exists"""
    existing = await db.admins.find_one({"role": AdminRole.SUPER_ADMIN})
    if not existing:
        admin_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        default_admin = {
            "id": admin_id,
            "email": "admin@optio.com",
            "hashed_password": hash_password("admin123"),
            "name": "Super Admin",
            "role": AdminRole.SUPER_ADMIN,
            "is_active": True,
            "last_login": None,
            "created_at": now
        }
        await db.admins.insert_one(default_admin)
        logger.info(f"Created default super admin: admin@optio.com")
