"""
Coupons API - Discount codes and sales management
Handles coupon creation, validation, and redemption
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import secrets
import string

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import db
from api.admin import get_current_admin

router = APIRouter(prefix="/coupons", tags=["coupons"])
admin_router = APIRouter(prefix="/admin/coupons", tags=["admin-coupons"])


# ==================== MODELS ====================

class CouponCreate(BaseModel):
    code: Optional[str] = None  # Auto-generated if not provided
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")  # percentage or fixed amount
    discount_value: float = Field(..., gt=0)
    applicable_products: List[str] = Field(default=[])  # Empty = applies to all
    min_purchase_amount: float = Field(default=0)
    max_discount_amount: Optional[float] = None  # For percentage discounts
    usage_limit: int = Field(default=-1)  # -1 = unlimited
    usage_per_user: int = Field(default=1)  # How many times one user can use it
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = Field(default=True)
    requires_referral_code: bool = Field(default=False)


class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    applicable_products: Optional[List[str]] = None
    min_purchase_amount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_per_user: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: Optional[bool] = None


class ValidateCouponRequest(BaseModel):
    code: str
    product_id: str
    email: Optional[str] = None


# ==================== PUBLIC ENDPOINTS ====================

@router.post("/validate")
async def validate_coupon(request: ValidateCouponRequest):
    """Validate a coupon code for a specific product"""
    coupon = await db.coupons.find_one(
        {"code": request.code.upper(), "is_active": True},
        {"_id": 0}
    )
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    now = datetime.now(timezone.utc)
    
    # Check date validity
    if coupon.get("start_date"):
        start = datetime.fromisoformat(coupon["start_date"].replace("Z", "+00:00"))
        if now < start:
            raise HTTPException(status_code=400, detail="Coupon is not yet active")
    
    if coupon.get("end_date"):
        end = datetime.fromisoformat(coupon["end_date"].replace("Z", "+00:00"))
        if now > end:
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    # Check usage limit
    if coupon.get("usage_limit", -1) != -1:
        usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon["id"]})
        if usage_count >= coupon["usage_limit"]:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Check per-user limit
    if request.email and coupon.get("usage_per_user", 1) > 0:
        user_usage = await db.coupon_usages.count_documents({
            "coupon_id": coupon["id"],
            "email": request.email.lower()
        })
        if user_usage >= coupon["usage_per_user"]:
            raise HTTPException(status_code=400, detail="You have already used this coupon")
    
    # Check product applicability
    applicable_products = coupon.get("applicable_products", [])
    if applicable_products and request.product_id not in applicable_products:
        raise HTTPException(status_code=400, detail="Coupon not valid for this product")
    
    # Get product price
    product = await db.products.find_one({"id": request.product_id}, {"_id": 0, "price": 1, "name": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check minimum purchase
    if coupon.get("min_purchase_amount", 0) > product["price"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Minimum purchase amount is ${coupon['min_purchase_amount']}"
        )
    
    # Calculate discount
    if coupon["discount_type"] == "percentage":
        discount = product["price"] * (coupon["discount_value"] / 100)
        if coupon.get("max_discount_amount"):
            discount = min(discount, coupon["max_discount_amount"])
    else:  # fixed
        discount = min(coupon["discount_value"], product["price"])
    
    final_price = product["price"] - discount
    
    return {
        "valid": True,
        "coupon": {
            "id": coupon["id"],
            "code": coupon["code"],
            "name": coupon["name"],
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"]
        },
        "original_price": product["price"],
        "discount_amount": round(discount, 2),
        "final_price": round(final_price, 2),
        "savings_percent": round((discount / product["price"]) * 100, 1)
    }


# ==================== ADMIN ENDPOINTS ====================

def generate_coupon_code(length=8):
    """Generate a random coupon code"""
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    return ''.join(secrets.choice(chars) for _ in range(length))


@admin_router.get("")
async def admin_get_coupons(
    is_active: Optional[bool] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    admin=Depends(get_current_admin)
):
    """Get all coupons (admin)"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.coupons.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    coupons = await cursor.to_list(length=limit)
    
    # Get usage counts
    for coupon in coupons:
        usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon["id"]})
        coupon["usage_count"] = usage_count
    
    total = await db.coupons.count_documents(query)
    
    return {
        "coupons": coupons,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@admin_router.get("/{coupon_id}")
async def admin_get_coupon(coupon_id: str, admin=Depends(get_current_admin)):
    """Get a specific coupon (admin)"""
    coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Get usage stats
    usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon_id})
    
    # Get recent usages
    cursor = db.coupon_usages.find(
        {"coupon_id": coupon_id},
        {"_id": 0}
    ).sort("used_at", -1).limit(10)
    recent_usages = await cursor.to_list(length=10)
    
    # Calculate total discount given
    total_discount = 0
    async for usage in db.coupon_usages.find({"coupon_id": coupon_id}):
        total_discount += usage.get("discount_amount", 0)
    
    coupon["usage_count"] = usage_count
    coupon["recent_usages"] = recent_usages
    coupon["total_discount_given"] = round(total_discount, 2)
    
    return coupon


@admin_router.post("")
async def create_coupon(coupon: CouponCreate, admin=Depends(get_current_admin)):
    """Create a new coupon"""
    # Generate code if not provided
    code = coupon.code.upper() if coupon.code else generate_coupon_code()
    
    # Check code uniqueness
    existing = await db.coupons.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    now = datetime.now(timezone.utc)
    coupon_id = str(uuid.uuid4())
    
    coupon_doc = {
        "id": coupon_id,
        "code": code,
        **{k: v for k, v in coupon.dict().items() if k != 'code'},
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": admin["id"]
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "create_coupon",
        "target_id": coupon_id,
        "details": {"code": code, "discount_type": coupon.discount_type, "discount_value": coupon.discount_value},
        "timestamp": now.isoformat()
    })
    
    return {"success": True, "coupon_id": coupon_id, "code": code, "coupon": {**coupon_doc, "_id": None}}


@admin_router.put("/{coupon_id}")
async def update_coupon(
    coupon_id: str,
    updates: CouponUpdate,
    admin=Depends(get_current_admin)
):
    """Update a coupon"""
    coupon = await db.coupons.find_one({"id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.coupons.update_one(
        {"id": coupon_id},
        {"$set": update_data}
    )
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "update_coupon",
        "target_id": coupon_id,
        "changes": update_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    updated_coupon = await db.coupons.find_one({"id": coupon_id}, {"_id": 0})
    
    return {"success": True, "coupon": updated_coupon}


@admin_router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: str, admin=Depends(get_current_admin)):
    """Delete a coupon"""
    coupon = await db.coupons.find_one({"id": coupon_id})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Check if coupon has been used
    usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon_id})
    
    if usage_count > 0:
        # Soft delete
        await db.coupons.update_one(
            {"id": coupon_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        delete_type = "soft"
    else:
        # Hard delete
        await db.coupons.delete_one({"id": coupon_id})
        delete_type = "hard"
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "delete_coupon",
        "target_id": coupon_id,
        "details": {"delete_type": delete_type, "code": coupon.get("code")},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "delete_type": delete_type}


@admin_router.get("/stats/overview")
async def get_coupons_stats(admin=Depends(get_current_admin)):
    """Get coupons overview stats"""
    total_coupons = await db.coupons.count_documents({})
    active_coupons = await db.coupons.count_documents({"is_active": True})
    
    # Total usage and discount
    pipeline = [
        {"$group": {
            "_id": None,
            "total_usages": {"$sum": 1},
            "total_discount": {"$sum": "$discount_amount"}
        }}
    ]
    result = await db.coupon_usages.aggregate(pipeline).to_list(1)
    stats = result[0] if result else {"total_usages": 0, "total_discount": 0}
    
    # Top coupons by usage
    pipeline = [
        {"$group": {
            "_id": "$coupon_id",
            "usage_count": {"$sum": 1},
            "total_discount": {"$sum": "$discount_amount"}
        }},
        {"$sort": {"usage_count": -1}},
        {"$limit": 5}
    ]
    top_coupons = await db.coupon_usages.aggregate(pipeline).to_list(length=5)
    
    # Enrich with coupon details
    for item in top_coupons:
        coupon = await db.coupons.find_one({"id": item["_id"]}, {"_id": 0, "code": 1, "name": 1})
        item["code"] = coupon.get("code") if coupon else "Unknown"
        item["name"] = coupon.get("name") if coupon else "Unknown"
    
    return {
        "total_coupons": total_coupons,
        "active_coupons": active_coupons,
        "total_usages": stats["total_usages"],
        "total_discount_given": round(stats["total_discount"], 2),
        "top_coupons": top_coupons
    }


# ==================== INTERNAL FUNCTIONS ====================

async def record_coupon_usage(coupon_id: str, order_id: str, email: str, discount_amount: float):
    """Record a coupon usage"""
    await db.coupon_usages.insert_one({
        "id": str(uuid.uuid4()),
        "coupon_id": coupon_id,
        "order_id": order_id,
        "email": email.lower(),
        "discount_amount": discount_amount,
        "used_at": datetime.now(timezone.utc).isoformat()
    })
