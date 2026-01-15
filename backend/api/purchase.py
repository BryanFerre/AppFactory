"""
Purchase API - Handles checkout and purchase flow with Stripe
Includes auto-registration for new users
Supports both one-time payment and recurring subscription
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
from utils.auth import get_current_user, create_token, hash_password
from utils.config import FRONTEND_URL
from api.licenses import issue_license
from services.points_engine import PointsEngine
from services.email import send_notification_email

router = APIRouter(prefix="/purchase", tags=["purchase"])

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY", "")


@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY
    }


# ==================== MODELS ====================

class CreateCheckoutRequest(BaseModel):
    product_id: str
    email: EmailStr
    name: str = Field(..., min_length=1)
    referral_code: Optional[str] = None
    coupon_code: Optional[str] = None
    success_url: str
    cancel_url: str


class CreatePaymentIntentRequest(BaseModel):
    product_id: str
    email: EmailStr
    name: str = Field(..., min_length=1)
    referral_code: Optional[str] = None
    coupon_code: Optional[str] = None


class CreateSubscriptionCheckoutRequest(BaseModel):
    product_id: str
    email: EmailStr
    name: str = Field(..., min_length=1)
    referral_code: Optional[str] = None
    coupon_code: Optional[str] = None


class ConfirmPaymentRequest(BaseModel):
    payment_intent_id: str
    order_id: str


class VerifyPurchaseRequest(BaseModel):
    session_id: str


# ==================== STRIPE PRODUCT MANAGEMENT ====================

async def get_or_create_stripe_products(product: dict):
    """Get or create Stripe products and prices for one-time and subscription"""
    
    stripe_metadata = product.get("stripe_metadata", {})
    
    # Check if we already have Stripe IDs stored
    one_time_price_id = stripe_metadata.get("one_time_price_id")
    subscription_price_id = stripe_metadata.get("subscription_price_id")
    
    if one_time_price_id and subscription_price_id:
        return {
            "one_time_price_id": one_time_price_id,
            "subscription_price_id": subscription_price_id
        }
    
    # Create Stripe product if not exists
    stripe_product_id = stripe_metadata.get("stripe_product_id")
    
    if not stripe_product_id:
        stripe_product = stripe.Product.create(
            name=product["name"],
            description=product.get("short_description", ""),
            metadata={"internal_id": product["id"]}
        )
        stripe_product_id = stripe_product.id
    
    # Create one-time price
    if not one_time_price_id:
        one_time_price = stripe.Price.create(
            product=stripe_product_id,
            unit_amount=int(product["price"] * 100),
            currency=product.get("currency", "usd").lower(),
            metadata={"type": "one_time", "internal_product_id": product["id"]}
        )
        one_time_price_id = one_time_price.id
    
    # Create subscription price
    if not subscription_price_id and product.get("monthly_fee"):
        subscription_price = stripe.Price.create(
            product=stripe_product_id,
            unit_amount=int(product["monthly_fee"] * 100),
            currency=product.get("currency", "usd").lower(),
            recurring={"interval": "month"},
            metadata={"type": "subscription", "internal_product_id": product["id"]}
        )
        subscription_price_id = subscription_price.id
    
    # Store in database for future use
    await db.products.update_one(
        {"id": product["id"]},
        {"$set": {
            "stripe_metadata": {
                "stripe_product_id": stripe_product_id,
                "one_time_price_id": one_time_price_id,
                "subscription_price_id": subscription_price_id
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "one_time_price_id": one_time_price_id,
        "subscription_price_id": subscription_price_id
    }


# ==================== ENDPOINTS ====================

@router.post("/create-checkout-session")
async def create_checkout_session(request: CreateSubscriptionCheckoutRequest):
    """Create a Stripe Checkout session with both one-time payment and subscription"""
    
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
    
    # Get or create Stripe products/prices
    try:
        stripe_prices = await get_or_create_stripe_products(product)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to setup payment: {str(e)}")
    
    # Calculate discount if coupon provided
    discount_amount = 0
    coupon_id = None
    final_one_time_price = product["price"]
    
    if request.coupon_code:
        coupon = await db.coupons.find_one(
            {"code": request.coupon_code.upper(), "is_active": True},
            {"_id": 0}
        )
        
        if coupon:
            now_check = datetime.now(timezone.utc)
            is_valid = True
            
            if coupon.get("start_date"):
                start = datetime.fromisoformat(coupon["start_date"].replace("Z", "+00:00"))
                if now_check < start:
                    is_valid = False
            
            if coupon.get("end_date"):
                end = datetime.fromisoformat(coupon["end_date"].replace("Z", "+00:00"))
                if now_check > end:
                    is_valid = False
            
            applicable_products = coupon.get("applicable_products", [])
            if applicable_products and request.product_id not in applicable_products:
                is_valid = False
            
            if coupon.get("usage_limit", -1) != -1:
                usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon["id"]})
                if usage_count >= coupon["usage_limit"]:
                    is_valid = False
            
            if is_valid:
                if coupon["discount_type"] == "percentage":
                    discount_amount = product["price"] * (coupon["discount_value"] / 100)
                    if coupon.get("max_discount_amount"):
                        discount_amount = min(discount_amount, coupon["max_discount_amount"])
                else:
                    discount_amount = min(coupon["discount_value"], product["price"])
                
                final_one_time_price = product["price"] - discount_amount
                coupon_id = coupon["id"]
    
    # Create pending order
    now = datetime.now(timezone.utc)
    order_id = str(uuid.uuid4())
    
    order_doc = {
        "id": order_id,
        "product_id": request.product_id,
        "product_name": product.get("name"),
        "customer_email": request.email.lower(),
        "customer_name": request.name,
        "original_amount": product["price"],
        "discount_amount": round(discount_amount, 2),
        "amount": round(final_one_time_price, 2),
        "monthly_fee": product.get("monthly_fee", 0),
        "currency": product.get("currency", "USD"),
        "status": "pending",
        "payment_type": "hybrid",  # one-time + subscription
        "referral_code": request.referral_code,
        "coupon_code": request.coupon_code,
        "coupon_id": coupon_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    try:
        # Build line items for Stripe Checkout
        line_items = []
        
        # One-time payment for license
        if discount_amount > 0:
            # Create a custom price with discount applied
            line_items.append({
                "price_data": {
                    "currency": product.get("currency", "usd").lower(),
                    "product_data": {
                        "name": f"{product['name']} - Lifetime License",
                        "description": "One-time purchase for lifetime access",
                    },
                    "unit_amount": int(final_one_time_price * 100),
                },
                "quantity": 1,
            })
        else:
            line_items.append({
                "price_data": {
                    "currency": product.get("currency", "usd").lower(),
                    "product_data": {
                        "name": f"{product['name']} - Lifetime License",
                        "description": "One-time purchase for lifetime access",
                    },
                    "unit_amount": int(product["price"] * 100),
                },
                "quantity": 1,
            })
        
        # Monthly subscription
        if product.get("monthly_fee"):
            line_items.append({
                "price_data": {
                    "currency": product.get("currency", "usd").lower(),
                    "product_data": {
                        "name": f"{product['name']} - Monthly Service",
                        "description": "Monthly operational fee",
                    },
                    "unit_amount": int(product["monthly_fee"] * 100),
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            })
        
        # Create Stripe Checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="subscription" if product.get("monthly_fee") else "payment",
            success_url=f"{FRONTEND_URL}/?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}&purchase=success",
            cancel_url=f"{FRONTEND_URL}/?purchase=cancelled",
            customer_email=request.email,
            metadata={
                "order_id": order_id,
                "product_id": request.product_id,
                "customer_name": request.name,
                "referral_code": request.referral_code or "",
                "coupon_code": request.coupon_code or "",
                "discount_amount": str(discount_amount)
            },
            subscription_data={
                "metadata": {
                    "order_id": order_id,
                    "product_id": request.product_id
                }
            } if product.get("monthly_fee") else None
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
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-payment-intent")
async def create_payment_intent(request: CreatePaymentIntentRequest):
    """Create a Stripe PaymentIntent for inline checkout (one-time only, subscription added after)"""
    
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
    
    # Calculate final price (apply coupon if provided)
    final_price = product["price"]
    discount_amount = 0
    coupon_id = None
    
    if request.coupon_code:
        coupon = await db.coupons.find_one(
            {"code": request.coupon_code.upper(), "is_active": True},
            {"_id": 0}
        )
        
        if coupon:
            now_check = datetime.now(timezone.utc)
            is_valid = True
            
            # Check date validity
            if coupon.get("start_date"):
                start = datetime.fromisoformat(coupon["start_date"].replace("Z", "+00:00"))
                if now_check < start:
                    is_valid = False
            
            if coupon.get("end_date"):
                end = datetime.fromisoformat(coupon["end_date"].replace("Z", "+00:00"))
                if now_check > end:
                    is_valid = False
            
            # Check product applicability
            applicable_products = coupon.get("applicable_products", [])
            if applicable_products and request.product_id not in applicable_products:
                is_valid = False
            
            # Check usage limit
            if coupon.get("usage_limit", -1) != -1:
                usage_count = await db.coupon_usages.count_documents({"coupon_id": coupon["id"]})
                if usage_count >= coupon["usage_limit"]:
                    is_valid = False
            
            if is_valid:
                # Calculate discount
                if coupon["discount_type"] == "percentage":
                    discount_amount = product["price"] * (coupon["discount_value"] / 100)
                    if coupon.get("max_discount_amount"):
                        discount_amount = min(discount_amount, coupon["max_discount_amount"])
                else:  # fixed
                    discount_amount = min(coupon["discount_value"], product["price"])
                
                final_price = product["price"] - discount_amount
                coupon_id = coupon["id"]
    
    # Total first payment = one-time + first month subscription
    monthly_fee = product.get("monthly_fee", 0)
    total_first_payment = final_price + monthly_fee
    
    # Create pending order
    now = datetime.now(timezone.utc)
    order_id = str(uuid.uuid4())
    
    order_doc = {
        "id": order_id,
        "product_id": request.product_id,
        "product_name": product.get("name"),
        "customer_email": request.email.lower(),
        "customer_name": request.name,
        "original_amount": product["price"],
        "discount_amount": round(discount_amount, 2),
        "amount": round(final_price, 2),
        "monthly_fee": monthly_fee,
        "total_first_payment": round(total_first_payment, 2),
        "currency": product.get("currency", "USD"),
        "status": "pending",
        "payment_type": "hybrid",
        "referral_code": request.referral_code,
        "coupon_code": request.coupon_code,
        "coupon_id": coupon_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    try:
        # Create Stripe PaymentIntent for total first payment
        payment_intent = stripe.PaymentIntent.create(
            amount=int(total_first_payment * 100),  # Stripe uses cents
            currency=product.get("currency", "usd").lower(),
            metadata={
                "order_id": order_id,
                "product_id": request.product_id,
                "customer_name": request.name,
                "customer_email": request.email,
                "referral_code": request.referral_code or "",
                "coupon_code": request.coupon_code or "",
                "discount_amount": str(discount_amount),
                "one_time_amount": str(final_price),
                "monthly_fee": str(monthly_fee)
            },
            receipt_email=request.email,
            description=f"Purchase: {product['name']} (License + First Month)",
            setup_future_usage="off_session"  # Allow future subscription charges
        )
        
        # Update order with PaymentIntent ID
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"stripe_payment_intent_id": payment_intent.id}}
        )
        
        return {
            "client_secret": payment_intent.client_secret,
            "payment_intent_id": payment_intent.id,
            "order_id": order_id,
            "amount": round(final_price, 2),
            "monthly_fee": monthly_fee,
            "total_first_payment": round(total_first_payment, 2),
            "original_amount": product["price"],
            "discount_amount": round(discount_amount, 2),
            "currency": product.get("currency", "USD")
        }
        
    except stripe.error.StripeError as e:
        # Clean up failed order
        await db.orders.delete_one({"id": order_id})
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/confirm-payment")
async def confirm_payment(request: ConfirmPaymentRequest):
    """Confirm payment completion and create user account + license + subscription"""
    
    try:
        # Retrieve the PaymentIntent from Stripe
        payment_intent = stripe.PaymentIntent.retrieve(request.payment_intent_id)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid payment: {str(e)}")
    
    if payment_intent.status != "succeeded":
        raise HTTPException(status_code=400, detail="Payment not completed")
    
    # Get order
    order = await db.orders.find_one({"id": request.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify payment intent matches order
    if order.get("stripe_payment_intent_id") != request.payment_intent_id:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Check if already processed
    if order.get("status") == "completed":
        # Return existing user credentials
        user = await db.users.find_one({"id": order.get("user_id")})
        license_doc = await db.licenses.find_one({"order_id": order["id"]})
        
        if user and license_doc:
            token = create_token(user["id"])
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
                    "id": license_doc["id"],
                    "license_key": license_doc["license_key"],
                    "status": license_doc["status"]
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
        hashed_password = hash_password(password)
        
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
    
    # Create Stripe subscription for recurring monthly fee
    subscription_id = None
    if order.get("monthly_fee", 0) > 0:
        try:
            # Create or get Stripe customer
            customers = stripe.Customer.list(email=customer_email, limit=1)
            if customers.data:
                stripe_customer = customers.data[0]
            else:
                stripe_customer = stripe.Customer.create(
                    email=customer_email,
                    name=customer_name,
                    metadata={"user_id": user_id}
                )
            
            # Attach payment method to customer
            payment_method_id = payment_intent.payment_method
            if payment_method_id:
                stripe.PaymentMethod.attach(payment_method_id, customer=stripe_customer.id)
                stripe.Customer.modify(
                    stripe_customer.id,
                    invoice_settings={"default_payment_method": payment_method_id}
                )
            
            # Get product for Stripe price creation
            product = await db.products.find_one({"id": order["product_id"]})
            
            # Create subscription (billing starts next month since first month was paid)
            subscription = stripe.Subscription.create(
                customer=stripe_customer.id,
                items=[{
                    "price_data": {
                        "currency": order.get("currency", "usd").lower(),
                        "product_data": {
                            "name": f"{order['product_name']} - Monthly Service",
                        },
                        "unit_amount": int(order["monthly_fee"] * 100),
                        "recurring": {"interval": "month"},
                    },
                }],
                metadata={
                    "order_id": order["id"],
                    "user_id": user_id,
                    "product_id": order["product_id"]
                },
                # Start billing next month (first month already paid)
                billing_cycle_anchor=int((now.timestamp()) + 30 * 24 * 60 * 60),  # 30 days from now
                proration_behavior="none"
            )
            subscription_id = subscription.id
            
            # Store subscription info
            await db.subscriptions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "order_id": order["id"],
                "stripe_subscription_id": subscription.id,
                "stripe_customer_id": stripe_customer.id,
                "amount": order["monthly_fee"],
                "currency": order.get("currency", "USD"),
                "status": "active",
                "created_at": now.isoformat()
            })
            
        except stripe.error.StripeError as e:
            print(f"Failed to create subscription: {e}")
            # Continue without subscription - can be set up later
    
    # Issue license
    license_doc = await issue_license(
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
            "license_id": license_doc["id"],
            "stripe_subscription_id": subscription_id,
            "completed_at": now.isoformat(),
            "updated_at": now.isoformat()
        }}
    )
    
    # Record coupon usage if applicable
    if order.get("coupon_id"):
        await db.coupon_usages.insert_one({
            "id": str(uuid.uuid4()),
            "coupon_id": order["coupon_id"],
            "order_id": order["id"],
            "user_id": user_id,
            "email": customer_email,
            "created_at": now.isoformat()
        })
    
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
    token = create_token(user_id)
    
    # Get user for response
    user = await db.users.find_one({"id": user_id})
    
    # Get product details for email
    product = await db.products.find_one({"id": order["product_id"]})
    
    response = {
        "success": True,
        "is_new_user": is_new_user,
        "token": token,
        "user": {
            "id": user_id,
            "name": customer_name,
            "email": customer_email
        },
        "license": license_doc,
        "order_id": order["id"],
        "has_subscription": subscription_id is not None
    }
    
    # Include temp password for new users
    temp_password = None
    if is_new_user and user.get("temp_password"):
        temp_password = user["temp_password"]
        response["temp_password"] = temp_password
        # Clear temp password after returning
        await db.users.update_one(
            {"id": user_id},
            {"$unset": {"temp_password": ""}}
        )
    
    # Send purchase confirmation email
    try:
        email_data = {
            "name": customer_name,
            "email": customer_email,
            "order_id": order["id"],
            "product_name": product.get("name", "Optio CloudNode") if product else "Optio CloudNode",
            "license_key": license_doc.get("license_key", ""),
            "amount": order.get("amount", 0),
            "monthly_fee": order.get("monthly_fee", 0),
            "total_first_payment": order.get("total_first_payment", order.get("amount", 0)),
            "original_amount": order.get("original_amount", order.get("amount", 0)),
            "discount": order.get("discount_amount", 0),
            "coupon_code": order.get("coupon_code"),
            "currency": order.get("currency", "USD"),
            "is_new_user": is_new_user,
            "temp_password": temp_password,
            "dashboard_url": FRONTEND_URL
        }
        await send_notification_email("purchase_confirmation", customer_email, email_data)
    except Exception as e:
        print(f"Failed to send purchase confirmation email: {e}")
    
    return response


@router.post("/verify")
async def verify_purchase(request: VerifyPurchaseRequest):
    """Verify purchase completion from Stripe Checkout redirect"""
    
    try:
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
        user = await db.users.find_one({"id": order.get("user_id")})
        license_doc = await db.licenses.find_one({"order_id": order["id"]})
        
        if user and license_doc:
            token = create_token(user["id"])
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
                    "id": license_doc["id"],
                    "license_key": license_doc["license_key"],
                    "status": license_doc["status"]
                }
            }
    
    # Process the order (similar to confirm_payment but for checkout sessions)
    now = datetime.now(timezone.utc)
    customer_email = order["customer_email"]
    customer_name = order["customer_name"]
    
    existing_user = await db.users.find_one({"email": customer_email})
    
    if existing_user:
        user_id = existing_user["id"]
        is_new_user = False
    else:
        user_id = str(uuid.uuid4())
        password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        hashed_password = hash_password(password)
        referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        
        user_doc = {
            "id": user_id,
            "email": customer_email,
            "name": customer_name,
            "password": hashed_password,
            "temp_password": password,
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
    
    # Store subscription ID from Stripe checkout
    subscription_id = session.subscription if hasattr(session, 'subscription') else None
    
    # Issue license
    license_doc = await issue_license(
        user_id=user_id,
        product_id=order["product_id"],
        order_id=order["id"]
    )
    
    # Update order
    await db.orders.update_one(
        {"id": order["id"]},
        {"$set": {
            "status": "completed",
            "user_id": user_id,
            "license_id": license_doc["id"],
            "stripe_subscription_id": subscription_id,
            "completed_at": now.isoformat(),
            "updated_at": now.isoformat()
        }}
    )
    
    token = create_token(user_id)
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
        "license": license_doc,
        "order_id": order["id"]
    }
    
    if is_new_user and user.get("temp_password"):
        response["temp_password"] = user["temp_password"]
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
    
    referrer = await db.users.find_one({"referral_code": referral_code})
    if not referrer:
        return
    
    product = await db.products.find_one({"id": order["product_id"]})
    commission_rate = product.get("metadata", {}).get("commission_rate", 0.05)
    commission_amount = order["amount"] * commission_rate
    
    now = datetime.now(timezone.utc)
    
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
    
    await db.referral_signups.insert_one({
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referred_id": new_user_id,
        "referral_code": referral_code,
        "conversion_type": "purchase",
        "order_id": order["id"],
        "created_at": now.isoformat()
    })
    
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
    
    try:
        event = stripe.Event.construct_from(
            stripe.util.convert_to_dict(stripe.util.json.loads(payload)),
            stripe.api_key
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    
    if event.type == "checkout.session.completed":
        session = event.data.object
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
        await db.orders.update_one(
            {"stripe_payment_intent": payment_intent.id},
            {"$set": {
                "status": "failed",
                "failure_reason": payment_intent.last_payment_error.message if payment_intent.last_payment_error else "Unknown",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    elif event.type == "invoice.payment_failed":
        # Handle failed subscription payment
        invoice = event.data.object
        subscription_id = invoice.subscription
        if subscription_id:
            await db.subscriptions.update_one(
                {"stripe_subscription_id": subscription_id},
                {"$set": {
                    "status": "payment_failed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    elif event.type == "customer.subscription.deleted":
        # Handle subscription cancellation
        subscription = event.data.object
        await db.subscriptions.update_one(
            {"stripe_subscription_id": subscription.id},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat(),
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
    
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0
    
    # Monthly recurring revenue
    mrr_pipeline = [
        {"$match": {"status": "completed", "monthly_fee": {"$gt": 0}}},
        {"$group": {"_id": None, "total": {"$sum": "$monthly_fee"}}}
    ]
    mrr_result = await db.orders.aggregate(mrr_pipeline).to_list(1)
    mrr = mrr_result[0]["total"] if mrr_result else 0
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "total_revenue": total_revenue,
        "monthly_recurring_revenue": mrr
    }
