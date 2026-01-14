"""
Licenses API - License management for node operators
Handles license issuance, retrieval, and management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import secrets
import string

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import db
from utils.auth import get_current_user
from api.admin import get_current_admin

router = APIRouter(prefix="/licenses", tags=["licenses"])
admin_router = APIRouter(prefix="/admin/licenses", tags=["admin-licenses"])


def generate_license_key():
    """Generate a unique license key in format: XXXX-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    segments = [''.join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
    return '-'.join(segments)


# ==================== USER ENDPOINTS ====================

@router.get("")
async def get_user_licenses(user: dict = Depends(get_current_user)):
    """Get all licenses for the current user"""
    cursor = db.licenses.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("issue_date", -1)
    
    licenses = await cursor.to_list(length=100)
    
    # Enrich with product info
    for license in licenses:
        product = await db.products.find_one(
            {"id": license.get("product_id")},
            {"_id": 0, "name": 1, "image_url": 1, "category": 1}
        )
        if product:
            license["product_name"] = product.get("name")
            license["product_image"] = product.get("image_url")
            license["product_category"] = product.get("category")
    
    return {
        "licenses": licenses,
        "total": len(licenses)
    }


@router.get("/{license_id}")
async def get_license(license_id: str, user: dict = Depends(get_current_user)):
    """Get a specific license"""
    license = await db.licenses.find_one(
        {"id": license_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Enrich with product info
    product = await db.products.find_one(
        {"id": license.get("product_id")},
        {"_id": 0, "name": 1, "image_url": 1, "category": 1, "features": 1}
    )
    if product:
        license["product"] = product
    
    return license


# ==================== ADMIN ENDPOINTS ====================

@admin_router.get("")
async def admin_get_licenses(
    user_id: Optional[str] = None,
    product_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    admin=Depends(get_current_admin)
):
    """Get all licenses (admin)"""
    query = {}
    
    if user_id:
        query["user_id"] = user_id
    if product_id:
        query["product_id"] = product_id
    if status:
        query["status"] = status
    
    cursor = db.licenses.find(query, {"_id": 0}).sort("issue_date", -1).skip(offset).limit(limit)
    licenses = await cursor.to_list(length=limit)
    
    # Enrich with user and product info
    for license in licenses:
        user = await db.users.find_one({"id": license.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        product = await db.products.find_one({"id": license.get("product_id")}, {"_id": 0, "name": 1})
        
        license["user_name"] = user.get("name") if user else "Unknown"
        license["user_email"] = user.get("email") if user else "Unknown"
        license["product_name"] = product.get("name") if product else "Unknown"
    
    total = await db.licenses.count_documents(query)
    
    return {
        "licenses": licenses,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@admin_router.get("/{license_id}")
async def admin_get_license(license_id: str, admin=Depends(get_current_admin)):
    """Get a specific license (admin)"""
    license = await db.licenses.find_one({"id": license_id}, {"_id": 0})
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Enrich
    user = await db.users.find_one({"id": license.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
    product = await db.products.find_one({"id": license.get("product_id")}, {"_id": 0})
    order = await db.orders.find_one({"id": license.get("order_id")}, {"_id": 0})
    
    license["user"] = user
    license["product"] = product
    license["order"] = order
    
    return license


class UpdateLicenseStatus(BaseModel):
    status: str = Field(..., pattern="^(active|suspended|revoked)$")
    reason: Optional[str] = None


@admin_router.put("/{license_id}/status")
async def update_license_status(
    license_id: str,
    update: UpdateLicenseStatus,
    admin=Depends(get_current_admin)
):
    """Update license status (admin)"""
    license = await db.licenses.find_one({"id": license_id})
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    now = datetime.now(timezone.utc)
    
    await db.licenses.update_one(
        {"id": license_id},
        {"$set": {
            "status": update.status,
            "status_reason": update.reason,
            "status_updated_at": now.isoformat(),
            "status_updated_by": admin["id"]
        }}
    )
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "update_license_status",
        "target_id": license_id,
        "details": {"new_status": update.status, "reason": update.reason},
        "timestamp": now.isoformat()
    })
    
    return {"success": True, "status": update.status}


@admin_router.get("/stats/overview")
async def get_licenses_stats(admin=Depends(get_current_admin)):
    """Get licenses overview stats"""
    total_licenses = await db.licenses.count_documents({})
    active_licenses = await db.licenses.count_documents({"status": "active"})
    
    # Licenses by product
    pipeline = [
        {"$group": {
            "_id": "$product_id",
            "count": {"$sum": 1}
        }}
    ]
    by_product = await db.licenses.aggregate(pipeline).to_list(length=50)
    
    # Enrich with product names
    for item in by_product:
        product = await db.products.find_one({"id": item["_id"]}, {"_id": 0, "name": 1})
        item["product_name"] = product.get("name") if product else "Unknown"
    
    # Recent licenses
    cursor = db.licenses.find({}, {"_id": 0}).sort("issue_date", -1).limit(5)
    recent = await cursor.to_list(length=5)
    
    return {
        "total_licenses": total_licenses,
        "active_licenses": active_licenses,
        "by_product": by_product,
        "recent_licenses": recent
    }


# ==================== INTERNAL FUNCTIONS ====================

async def issue_license(user_id: str, product_id: str, order_id: str) -> dict:
    """Issue a new license to a user"""
    now = datetime.now(timezone.utc)
    license_id = str(uuid.uuid4())
    license_key = generate_license_key()
    
    # Get product info
    product = await db.products.find_one({"id": product_id}, {"_id": 0, "name": 1, "category": 1})
    
    license_doc = {
        "id": license_id,
        "license_key": license_key,
        "user_id": user_id,
        "product_id": product_id,
        "order_id": order_id,
        "status": "active",
        "issue_date": now.isoformat(),
        "purchase_date": now.isoformat(),
        "license_type": "lifetime",
        "metadata": {
            "product_name": product.get("name") if product else "Unknown",
            "product_category": product.get("category") if product else "unknown"
        }
    }
    
    await db.licenses.insert_one(license_doc)
    
    return {
        "id": license_id,
        "license_key": license_key,
        "status": "active",
        "issue_date": now.isoformat()
    }
