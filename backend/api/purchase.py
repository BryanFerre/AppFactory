"""
Purchase API - Handles checkout and purchase flow with Stripe
Includes auto-registration for new users
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import os
import stripe
import secrets
import string

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import db
from utils.auth import get_current_user, create_access_token, get_password_hash
from api.licenses import issue_license
from services.points_engine import PointsEngine

router = APIRouter(prefix="/purchase", tags=["purchase"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")


# ==================== MODELS ====================

class CreateCheckoutRequest(BaseModel):
    product_id: str
    email: EmailStr
    name: str = Field(..., min_length=1)
    referral_code: Optional[str] = None
    success_url: str
    cancel_url: str


class VerifyPurchaseRequest(BaseModel):
    session_id: str


# ==================== ENDPOINTS ====================

@router.post("/create-checkout")
async def create_checkout_session(request: CreateCheckoutRequest):
    """Create a Stripe checkout session for purchasing a product"""
    
    # Get product
    product = await db.products.find_one({"id": request.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if product.get("stock", -1) != -1:
        sold_count = await db.orders.count_documents({
            "product_id": request.product_id,
            "status": "completed"
        })
        if sold_count >= product["stock"]:
            raise HTTPException(status_code=400, detail="Product is out of stock")
    
    # Check if email already has this product
    existing_user = await db.users.find_one({"email": request.email.lower()})
    if existing_user:
        existing_license = await db.licenses.find_one({
            "user_id": existing_user["id"],
            "product_id": request.product_id,
            "status": "active"
        })
        if existing_license:
            raise HTTPException(
                status_code=400, 
                detail="You already own this product. Please log in to access your dashboard."
            )
    
    # Create pending order
    now = datetime.now(timezone.utc)
    order_id = str(uuid.uuid4())
    
    order_doc = {
        "id": order_id,
        "product_id": request.product_id,
        "product_name": product.get("name"),
        "customer_email": request.email.lower(),
        "customer_name": request.name,
        "amount": product["price"],
        "currency": product.get("currency", "USD"),
        "status": "pending",
        "referral_code": request.referral_code,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": product.get("currency", "usd").lower(),
                    "product_data": {
                        "name": product["name"],
                        "description": product.get("short_description", ""),
                    },
                    "unit_amount": int(product["price"] * 100),  # Stripe uses cents
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{request.success_url}?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
            cancel_url=request.cancel_url,
            customer_email=request.email,
            metadata={
                "order_id": order_id,
                "product_id": request.product_id,
                "customer_name": request.name,
                "referral_code": request.referral_code or ""
            }
        )
        
        # Update order with Stripe session ID
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"stripe_session_id": checkout_session.id}}
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id,
            "order_id": order_id
        }
        
    except stripe.error.StripeError as e:
        # Clean up failed order
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify")
async def verify_purchase(request: VerifyPurchaseRequest):
    """Verify purchase completion and create user account + license"""
    
    try:
        # Retrieve the checkout session from Stripe
        session = stripe.checkout.Session.retrieve(request.session_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid session: {str(e)}")
    
    if session.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Payment not completed")
    
    # Get order
    order = await db.orders.find_one({"stripe_session_id": request.session_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if already processed
    if order.get("status") == "completed":
        # Return existing user credentials
        user = await db.users.find_one({"id": order.get("user_id")})
        license = await db.licenses.find_one({"order_id": order["id"]})
        
        if user and license:
            token = create_access_token(data={"sub": user["id"]})
            return {
                "success": True,
                "already_processed": True,
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user.get("name"),
                    "email": user.get("email")
                },
                "license": {
                    "id": license["id"],
                    "license_key": license["license_key"],
                    "status": license["status"]
                }
            }
    
    now = datetime.now(timezone.utc)
    customer_email = order["customer_email"]
    customer_name = order["customer_name"]
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": customer_email})
    
    if existing_user:
        user_id = existing_user["id"]
        is_new_user = False
    else:
        # Create new user account
        user_id = str(uuid.uuid4())
        
        # Generate random password
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        hashed_password = get_password_hash(password)
        
        # Generate referral code
        referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        
        user_doc = {
            "id": user_id,
            "email": customer_email,
            "name": customer_name,
            "password": hashed_password,
            "temp_password": password,  # Store temporarily for display
            "referral_code": referral_code,
            "referred_by": order.get("referral_code"),
            "role": "operator",
            "wallet_address": None,
            "two_factor_enabled": False,
            "two_factor_secret": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.users.insert_one(user_doc)
        is_new_user = True
        
        # Award registration points
        try:
            points_engine = PointsEngine(db)
            await points_engine.initialize()
            await points_engine.award_points(
                user_id=user_id,
                action_id="complete_onboarding",
                metadata={"source": "purchase_registration"}
            )
        except Exception as e:
            print(f"Failed to award registration points: {e}")
    
    # Issue license
    license = await issue_license(
        user_id=user_id,
        product_id=order["product_id"],
        order_id=order["id"]
    )
    
    # Update order status
    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": {
            "status": "completed",
            "user_id": user_id,
            "license_id": license["id"],
            "completed_at": now.isoformat(),
            "updated_at": now.isoformat()
        }}
    )
    
    # Process referral commission if applicable
    if order.get("referral_code"):
        await process_referral_commission(order, user_id)
    
    # Award purchase points
    try:
        points_engine = PointsEngine(db)
        await points_engine.initialize()
        await points_engine.award_points(
            user_id=user_id,
            action_id="purchase_node",
            source_entity_id=order["id"],
            metadata={"product_id": order["product_id"]}
        )
    except Exception as e:
        print(f"Failed to award purchase points: {e}")
    
    # Generate auth token
    token = create_access_token(data={"sub": user_id})
    
    # Get user for response
    user = await db.users.find_one({"id": user_id})
    
    response = {
        "success": True,
        "is_new_user": is_new_user,
        "token": token,
        "user": {
            "id": user_id,
            "name": customer_name,
            "email": customer_email
        },
        "license": license,
        "order_id": order["id"]
    }
    
    # Include temp password for new users
    if is_new_user and user.get("temp_password"):
        response["temp_password"] = user["temp_password"]
        # Clear temp password after returning
        await db.users.update_one(
            {"id": user_id},
            {"$unset": {"temp_password": ""}}
        )
    
    return response


async def process_referral_commission(order: dict, new_user_id: str):
    """Process referral commission for a purchase"""
    referral_code = order.get("referral_code")
    if not referral_code:
        return
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        return
    
    # Get product commission rate
    product = await db.products.find_one({"id": order["product_id"]})
    commission_rate = product.get("metadata", {}).get("commission_rate", 0.05)  # Default 5%
    commission_amount = order["amount"] * commission_rate
    
    now = datetime.now(timezone.utc)
    
    # Create commission record
    commission_doc = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_user_id": new_user_id,
        "order_id": order["id"],
        "product_id": order["product_id"],
        "type": "node_sale",
        "amount": commission_amount,
        "commission_rate": commission_rate,
        "status": "pending",
        "created_at": now.isoformat()
    }
    
    await db.commissions.insert_one(commission_doc)
    
    # Track referral
    await db.referral_signups.insert_one({
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_id": new_user_id,
        "referral_code": referral_code,
        "conversion_type": "purchase",
        "order_id": order["id"],
        "created_at": now.isoformat()
    })
    
    # Award referral points
    try:
        points_engine = PointsEngine(db)
        await points_engine.initialize()
        await points_engine.award_points(
            user_id=referrer["id"],
            action_id="refer_node_purchase",
            source_entity_id=order["id"],
            metadata={"referred_user_id": new_user_id, "commission": commission_amount}
        )
    except Exception as e:
        print(f"Failed to award referral points: {e}")


@router.get("/orders")
async def get_user_orders(user: dict = Depends(get_current_user)):
    """Get user's purchase history"""
    cursor = db.orders.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1)
    
    orders = await cursor.to_list(length=100)
    
    return {"orders": orders, "total": len(orders)}


# ==================== STRIPE WEBHOOK ====================

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # Note: In production, verify webhook signature
    # endpoint_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.convert_to_dict(stripe.util.json.loads(payload)),
            stripe.api_key
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    
    # Handle the event
    if event.type == "checkout.session.completed":
        session = event.data.object
        
        # Mark order as paid if not already processed
        order = await db.orders.find_one({"stripe_session_id": session.id})
        if order and order.get("status") == "pending":
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {
                    "status": "paid",
                    "stripe_payment_intent": session.payment_intent,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        # Handle failed payment
        await db.orders.update_one(
            {"stripe_payment_intent": payment_intent.id},
            {"$set": {
                "status": "failed",
                "failure_reason": payment_intent.last_payment_error.message if payment_intent.last_payment_error else "Unknown",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {"received": True}


# ==================== ADMIN ENDPOINTS ====================

admin_router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])

from api.admin import get_current_admin


@admin_router.get("")
async def admin_get_orders(
    status: Optional[str] = None,
    product_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    """Get all orders (admin)"""
    query = {}
    if status:
        query["status"] = status
    if product_id:
        query["product_id"] = product_id
    
    cursor = db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit)
    orders = await cursor.to_list(length=limit)
    
    total = await db.orders.count_documents(query)
    
    return {
        "orders": orders,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@admin_router.get("/stats")
async def admin_get_order_stats(admin=Depends(get_current_admin)):
    """Get order statistics"""
    total_orders = await db.orders.count_documents({})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    
    # Total revenue
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue
    }
