"""
Admin Accounting routes - Commissions approval and App Earnings payouts
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import random

from utils.database import db
from utils.auth import get_current_admin
from models.schemas import AdminResponse

router = APIRouter(prefix="/admin/accounting", tags=["Admin Accounting"])


# ==================== MODELS ====================

class CommissionAction(BaseModel):
    action: str  # approve, reject
    reason: Optional[str] = None

class BulkCommissionAction(BaseModel):
    commission_ids: List[str]
    action: str  # approve, reject
    reason: Optional[str] = None

class PayoutAction(BaseModel):
    action: str  # process, reject
    payment_method: Optional[str] = "bank_transfer"
    notes: Optional[str] = None

class BulkPayoutAction(BaseModel):
    payout_ids: List[str]
    action: str  # process, reject
    payment_method: Optional[str] = "bank_transfer"
    notes: Optional[str] = None


# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def get_accounting_dashboard(admin=Depends(get_current_admin)):
    """Get accounting dashboard overview"""
    
    # Get commission stats
    pending_commissions = await db.commissions.count_documents({"status": "pending"})
    approved_commissions = await db.commissions.count_documents({"status": "approved"})
    
    pending_commission_amount = 0
    async for comm in db.commissions.find({"status": "pending"}):
        pending_commission_amount += comm.get("amount", 0)
    
    # Get payout stats
    pending_payouts = await db.app_earnings_payouts.count_documents({"status": "pending"})
    processing_payouts = await db.app_earnings_payouts.count_documents({"status": "processing"})
    
    pending_payout_amount = 0
    async for payout in db.app_earnings_payouts.find({"status": "pending"}):
        pending_payout_amount += payout.get("amount", 0)
    
    # Get this month's totals
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    paid_commissions_month = 0
    async for comm in db.commissions.find({"status": "paid", "paid_at": {"$gte": month_start.isoformat()}}):
        paid_commissions_month += comm.get("amount", 0)
    
    paid_payouts_month = 0
    async for payout in db.app_earnings_payouts.find({"status": "paid", "paid_at": {"$gte": month_start.isoformat()}}):
        paid_payouts_month += payout.get("amount", 0)
    
    return {
        "commissions": {
            "pending_count": pending_commissions,
            "pending_amount": round(pending_commission_amount, 2),
            "approved_awaiting_payment": approved_commissions,
            "paid_this_month": round(paid_commissions_month, 2)
        },
        "app_earnings": {
            "pending_count": pending_payouts,
            "pending_amount": round(pending_payout_amount, 2),
            "processing_count": processing_payouts,
            "paid_this_month": round(paid_payouts_month, 2)
        },
        "totals": {
            "total_pending": pending_commissions + pending_payouts,
            "total_pending_amount": round(pending_commission_amount + pending_payout_amount, 2)
        }
    }


# ==================== COMMISSIONS ====================

@router.get("/commissions")
async def list_commissions(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List all commissions with filtering"""
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = user_id
    
    commissions = await db.commissions.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.commissions.count_documents(query)
    
    # Enrich with user info
    for comm in commissions:
        user = await db.users.find_one({"id": comm.get("user_id")}, {"_id": 0, "password": 0})
        comm["user"] = user
    
    return {
        "commissions": commissions,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/commissions/{commission_id}")
async def get_commission_detail(commission_id: str, admin=Depends(get_current_admin)):
    """Get detailed commission info"""
    commission = await db.commissions.find_one({"id": commission_id}, {"_id": 0})
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    user = await db.users.find_one({"id": commission.get("user_id")}, {"_id": 0, "password": 0})
    commission["user"] = user
    
    # Get related node sale info
    if commission.get("node_sale_id"):
        node_sale = await db.node_sales.find_one({"id": commission["node_sale_id"]}, {"_id": 0})
        commission["node_sale"] = node_sale
    
    return commission


@router.post("/commissions/{commission_id}/action")
async def commission_action(
    commission_id: str,
    action_data: CommissionAction,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Approve or reject a commission"""
    commission = await db.commissions.find_one({"id": commission_id})
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    if commission["status"] not in ["pending"]:
        raise HTTPException(status_code=400, detail=f"Cannot {action_data.action} a commission with status: {commission['status']}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if action_data.action == "approve":
        new_status = "approved"
        update_data = {
            "status": new_status,
            "approved_by": admin["id"],
            "approved_at": now,
            "updated_at": now
        }
    elif action_data.action == "reject":
        new_status = "rejected"
        update_data = {
            "status": new_status,
            "rejected_by": admin["id"],
            "rejected_at": now,
            "rejection_reason": action_data.reason,
            "updated_at": now
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'")
    
    await db.commissions.update_one({"id": commission_id}, {"$set": update_data})
    
    # Log the action
    await db.admin_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "action": f"commission_{action_data.action}",
        "target_type": "commission",
        "target_id": commission_id,
        "details": {
            "amount": commission["amount"],
            "user_id": commission["user_id"],
            "reason": action_data.reason
        },
        "timestamp": now
    })
    
    return {"message": f"Commission {action_data.action}d successfully", "new_status": new_status}


@router.post("/commissions/bulk-action")
async def bulk_commission_action(
    action_data: BulkCommissionAction,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Bulk approve or reject commissions"""
    now = datetime.now(timezone.utc).isoformat()
    success_count = 0
    failed_ids = []
    
    for commission_id in action_data.commission_ids:
        commission = await db.commissions.find_one({"id": commission_id})
        if not commission or commission["status"] != "pending":
            failed_ids.append(commission_id)
            continue
        
        if action_data.action == "approve":
            update_data = {
                "status": "approved",
                "approved_by": admin["id"],
                "approved_at": now,
                "updated_at": now
            }
        elif action_data.action == "reject":
            update_data = {
                "status": "rejected",
                "rejected_by": admin["id"],
                "rejected_at": now,
                "rejection_reason": action_data.reason,
                "updated_at": now
            }
        else:
            continue
        
        await db.commissions.update_one({"id": commission_id}, {"$set": update_data})
        success_count += 1
    
    return {
        "message": f"Bulk action completed",
        "success_count": success_count,
        "failed_count": len(failed_ids),
        "failed_ids": failed_ids
    }


@router.post("/commissions/{commission_id}/pay")
async def mark_commission_paid(
    commission_id: str,
    payment_reference: Optional[str] = None,
    admin=Depends(get_current_admin)
):
    """Mark an approved commission as paid"""
    commission = await db.commissions.find_one({"id": commission_id})
    if not commission:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    if commission["status"] != "approved":
        raise HTTPException(status_code=400, detail="Commission must be approved before marking as paid")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.commissions.update_one(
        {"id": commission_id},
        {"$set": {
            "status": "paid",
            "paid_by": admin["id"],
            "paid_at": now,
            "payment_reference": payment_reference,
            "updated_at": now
        }}
    )
    
    return {"message": "Commission marked as paid"}


# ==================== APP EARNINGS PAYOUTS ====================

@router.get("/payouts")
async def list_payouts(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """List all app earnings payouts"""
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = user_id
    
    payouts = await db.app_earnings_payouts.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.app_earnings_payouts.count_documents(query)
    
    # Enrich with user and app info
    for payout in payouts:
        user = await db.users.find_one({"id": payout.get("user_id")}, {"_id": 0, "password": 0})
        payout["user"] = user
    
    return {
        "payouts": payouts,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/payouts/{payout_id}")
async def get_payout_detail(payout_id: str, admin=Depends(get_current_admin)):
    """Get detailed payout info"""
    payout = await db.app_earnings_payouts.find_one({"id": payout_id}, {"_id": 0})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    user = await db.users.find_one({"id": payout.get("user_id")}, {"_id": 0, "password": 0})
    payout["user"] = user
    
    # Get earnings breakdown by app
    if payout.get("earnings_breakdown"):
        for item in payout["earnings_breakdown"]:
            app = await db.installed_apps.find_one({"id": item.get("app_id")}, {"_id": 0})
            item["app"] = app
    
    return payout


@router.post("/payouts/{payout_id}/action")
async def payout_action(
    payout_id: str,
    action_data: PayoutAction,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Process or reject a payout"""
    payout = await db.app_earnings_payouts.find_one({"id": payout_id})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    if payout["status"] not in ["pending", "processing"]:
        raise HTTPException(status_code=400, detail=f"Cannot {action_data.action} a payout with status: {payout['status']}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    if action_data.action == "process":
        if payout["status"] == "pending":
            new_status = "processing"
            update_data = {
                "status": new_status,
                "processing_started_by": admin["id"],
                "processing_started_at": now,
                "payment_method": action_data.payment_method,
                "updated_at": now
            }
        else:
            # Already processing, mark as paid
            new_status = "paid"
            update_data = {
                "status": new_status,
                "paid_by": admin["id"],
                "paid_at": now,
                "payment_notes": action_data.notes,
                "updated_at": now
            }
    elif action_data.action == "reject":
        new_status = "rejected"
        update_data = {
            "status": new_status,
            "rejected_by": admin["id"],
            "rejected_at": now,
            "rejection_reason": action_data.notes,
            "updated_at": now
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'process' or 'reject'")
    
    await db.app_earnings_payouts.update_one({"id": payout_id}, {"$set": update_data})
    
    # Log the action
    await db.admin_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "admin_email": admin["email"],
        "action": f"payout_{action_data.action}",
        "target_type": "payout",
        "target_id": payout_id,
        "details": {
            "amount": payout["amount"],
            "user_id": payout["user_id"],
            "notes": action_data.notes
        },
        "timestamp": now
    })
    
    return {"message": f"Payout {action_data.action}ed successfully", "new_status": new_status}


@router.post("/payouts/bulk-action")
async def bulk_payout_action(
    action_data: BulkPayoutAction,
    admin=Depends(get_current_admin),
    request: Request = None
):
    """Bulk process or reject payouts"""
    now = datetime.now(timezone.utc).isoformat()
    success_count = 0
    failed_ids = []
    
    for payout_id in action_data.payout_ids:
        payout = await db.app_earnings_payouts.find_one({"id": payout_id})
        if not payout or payout["status"] not in ["pending", "processing"]:
            failed_ids.append(payout_id)
            continue
        
        if action_data.action == "process":
            if payout["status"] == "pending":
                update_data = {
                    "status": "processing",
                    "processing_started_by": admin["id"],
                    "processing_started_at": now,
                    "payment_method": action_data.payment_method,
                    "updated_at": now
                }
            else:
                update_data = {
                    "status": "paid",
                    "paid_by": admin["id"],
                    "paid_at": now,
                    "payment_notes": action_data.notes,
                    "updated_at": now
                }
        elif action_data.action == "reject":
            update_data = {
                "status": "rejected",
                "rejected_by": admin["id"],
                "rejected_at": now,
                "rejection_reason": action_data.notes,
                "updated_at": now
            }
        else:
            continue
        
        await db.app_earnings_payouts.update_one({"id": payout_id}, {"$set": update_data})
        success_count += 1
    
    return {
        "message": f"Bulk action completed",
        "success_count": success_count,
        "failed_count": len(failed_ids),
        "failed_ids": failed_ids
    }


# ==================== SEED DATA ====================

@router.post("/seed-demo-data")
async def seed_demo_data(admin=Depends(get_current_admin)):
    """Seed demo data for testing (admin only)"""
    now = datetime.now(timezone.utc)
    
    # Get some users
    users = await db.users.find({}, {"_id": 0}).limit(5).to_list(5)
    if not users:
        return {"message": "No users found to create demo data"}
    
    # Create demo commissions
    commission_types = ["node_sale", "node_referral", "upgrade_commission"]
    commission_count = 0
    
    for user in users:
        for i in range(random.randint(1, 3)):
            commission = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "type": random.choice(commission_types),
                "description": f"Commission for node sale #{random.randint(1000, 9999)}",
                "amount": round(random.uniform(50, 500), 2),
                "status": random.choice(["pending", "pending", "pending", "approved", "paid"]),
                "node_sale_id": str(uuid.uuid4()),
                "created_at": (now - timedelta(days=random.randint(1, 30))).isoformat(),
                "updated_at": now.isoformat()
            }
            await db.commissions.insert_one(commission)
            commission_count += 1
    
    # Create demo app earnings payouts
    payout_count = 0
    for user in users:
        # Get user's installed apps
        user_apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(10)
        if user_apps:
            earnings_breakdown = []
            total_amount = 0
            for app in user_apps[:3]:
                app_earnings = round(random.uniform(20, 150), 2)
                earnings_breakdown.append({
                    "app_id": app["id"],
                    "app_name": app["name"],
                    "amount": app_earnings,
                    "period": f"{(now - timedelta(days=30)).strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}"
                })
                total_amount += app_earnings
            
            payout = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "amount": round(total_amount, 2),
                "earnings_breakdown": earnings_breakdown,
                "status": random.choice(["pending", "pending", "processing", "paid"]),
                "period_start": (now - timedelta(days=30)).isoformat(),
                "period_end": now.isoformat(),
                "created_at": (now - timedelta(days=random.randint(1, 7))).isoformat(),
                "updated_at": now.isoformat()
            }
            await db.app_earnings_payouts.insert_one(payout)
            payout_count += 1
    
    return {
        "message": "Demo data seeded successfully",
        "commissions_created": commission_count,
        "payouts_created": payout_count
    }
