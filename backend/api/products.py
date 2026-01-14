"""
Products API - Product management for admin
Handles CRUD operations for products (CloudNodes, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import db
from api.admin import get_current_admin

router = APIRouter(prefix="/products", tags=["products"])
admin_router = APIRouter(prefix="/admin/products", tags=["admin-products"])


# ==================== MODELS ====================

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    short_description: str = Field(None, max_length=500)
    price: float = Field(..., gt=0)
    currency: str = Field(default="USD")
    category: str = Field(default="node")
    image_url: Optional[str] = None
    features: List[str] = Field(default=[])
    specs: Dict[str, Any] = Field(default={})
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    stock: int = Field(default=-1)  # -1 = unlimited
    metadata: Dict[str, Any] = Field(default={})


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    features: Optional[List[str]] = None
    specs: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    stock: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


# ==================== PUBLIC ENDPOINTS ====================

@router.get("")
async def get_products(
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all active products (public)"""
    query = {"is_active": True}
    
    if category:
        query["category"] = category
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    products = await cursor.to_list(length=limit)
    
    total = await db.products.count_documents(query)
    
    return {
        "products": products,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID (public)"""
    product = await db.products.find_one(
        {"id": product_id, "is_active": True},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.get("/slug/{slug}")
async def get_product_by_slug(slug: str):
    """Get a single product by slug (public)"""
    product = await db.products.find_one(
        {"slug": slug, "is_active": True},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


# ==================== ADMIN ENDPOINTS ====================

@admin_router.get("")
async def admin_get_products(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    admin=Depends(get_current_admin)
):
    """Get all products (admin)"""
    query = {}
    
    if category:
        query["category"] = category
    if is_active is not None:
        query["is_active"] = is_active
    
    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    products = await cursor.to_list(length=limit)
    
    total = await db.products.count_documents(query)
    
    # Get sales stats for each product
    for product in products:
        sales_count = await db.orders.count_documents({
            "product_id": product["id"],
            "status": "completed"
        })
        product["sales_count"] = sales_count
    
    return {
        "products": products,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@admin_router.get("/{product_id}")
async def admin_get_product(product_id: str, admin=Depends(get_current_admin)):
    """Get a single product by ID (admin)"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get sales stats
    sales_count = await db.orders.count_documents({
        "product_id": product_id,
        "status": "completed"
    })
    product["sales_count"] = sales_count
    
    return product


@admin_router.post("")
async def create_product(product: ProductCreate, admin=Depends(get_current_admin)):
    """Create a new product"""
    # Check slug uniqueness
    existing = await db.products.find_one({"slug": product.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Product slug already exists")
    
    now = datetime.now(timezone.utc)
    product_id = str(uuid.uuid4())
    
    product_doc = {
        "id": product_id,
        **product.dict(),
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": admin["id"]
    }
    
    await db.products.insert_one(product_doc)
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "create_product",
        "target_id": product_id,
        "details": {"name": product.name, "price": product.price},
        "timestamp": now.isoformat()
    })
    
    return {"success": True, "product_id": product_id, "product": {**product_doc, "_id": None}}


@admin_router.put("/{product_id}")
async def update_product(
    product_id: str,
    updates: ProductUpdate,
    admin=Depends(get_current_admin)
):
    """Update a product"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "update_product",
        "target_id": product_id,
        "changes": update_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    return {"success": True, "product": updated_product}


@admin_router.delete("/{product_id}")
async def delete_product(product_id: str, admin=Depends(get_current_admin)):
    """Delete a product (soft delete by setting is_active=False)"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product has any completed orders
    orders_count = await db.orders.count_documents({
        "product_id": product_id,
        "status": "completed"
    })
    
    if orders_count > 0:
        # Soft delete
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        delete_type = "soft"
    else:
        # Hard delete if no orders
        await db.products.delete_one({"id": product_id})
        delete_type = "hard"
    
    # Audit log
    await db.admin_audit_log.insert_one({
        "admin_id": admin["id"],
        "action": "delete_product",
        "target_id": product_id,
        "details": {"delete_type": delete_type, "name": product.get("name")},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "delete_type": delete_type}


@admin_router.get("/stats/overview")
async def get_products_stats(admin=Depends(get_current_admin)):
    """Get products overview stats"""
    total_products = await db.products.count_documents({})
    active_products = await db.products.count_documents({"is_active": True})
    
    # Revenue by product
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {
            "_id": "$product_id",
            "total_revenue": {"$sum": "$amount"},
            "sales_count": {"$sum": 1}
        }},
        {"$sort": {"total_revenue": -1}},
        {"$limit": 10}
    ]
    top_products = await db.orders.aggregate(pipeline).to_list(length=10)
    
    # Enrich with product names
    for item in top_products:
        product = await db.products.find_one({"id": item["_id"]}, {"_id": 0, "name": 1})
        item["product_name"] = product.get("name") if product else "Unknown"
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "top_products_by_revenue": top_products
    }


# ==================== SEED DEFAULT PRODUCT ====================

async def seed_default_products():
    """Seed the default CloudNode product if not exists"""
    existing = await db.products.find_one({"slug": "optio-cloudnode"})
    if existing:
        return
    
    now = datetime.now(timezone.utc)
    
    cloudnode_product = {
        "id": str(uuid.uuid4()),
        "name": "Optio CloudNode",
        "slug": "optio-cloudnode",
        "description": """The Optio CloudNode is a next-generation, decentralized cloud node that turns everyday users into infrastructure owners. Built on Optio's purpose-built blockchain cloud, CloudNodes power apps, host workloads, distribute content, and earn recurring rewards—all without relying on Big Tech gatekeepers.

By combining decentralized hosting, built-in incentives, and a global network of independent operators, Optio CloudNode transforms cloud computing from a centralized service into a shared, revenue-generating ecosystem designed for blockchain, AI, and the apps of the future.""",
        "short_description": "Own a piece of the decentralized cloud. Earn passive income by powering the apps of tomorrow.",
        "price": 5000.00,
        "currency": "USD",
        "category": "node",
        "image_url": None,
        "features": [
            "Lifetime license with no recurring fees",
            "Earn passive income from app hosting",
            "No technical skills required",
            "24/7 automated operation",
            "Global decentralized network",
            "Built-in reward system",
            "Dashboard for monitoring earnings",
            "Community support access",
            "Future NFT license upgrade path"
        ],
        "specs": {
            "type": "Virtual CloudNode",
            "network": "Optio Blockchain Cloud",
            "license": "Lifetime",
            "setup": "Automated",
            "support": "Community + Priority"
        },
        "is_active": True,
        "is_featured": True,
        "stock": -1,
        "metadata": {
            "commission_rate": 0.05,
            "referral_bonus": 250
        },
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
        "created_by": "system"
    }
    
    await db.products.insert_one(cloudnode_product)
    print("Default CloudNode product seeded")
