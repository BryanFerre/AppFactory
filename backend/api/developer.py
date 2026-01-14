"""
Developer portal routes - app submissions, featured listings
"""
from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
import logging
import os

from utils.database import db
from utils.auth import get_current_user
from utils.config import STRIPE_API_KEY, FRONTEND_URL

router = APIRouter(prefix="/developer", tags=["Developer"])
logger = logging.getLogger(__name__)


@router.post("/submit")
async def submit_app(
    app_name: str,
    description: str,
    category: str,
    resources_required: float,
    monthly_subscription_fee: float,
    revenue_sharing: float,
    nodes_available: int,
    contact_email: str,
    terms_accepted: bool,
    github_url: Optional[str] = None,
    documentation_url: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Submit a new app to the App Factory"""
    if not terms_accepted:
        raise HTTPException(status_code=400, detail="Terms must be accepted")
    
    submission_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    submission = {
        "id": submission_id,
        "user_id": user["id"],
        "app_name": app_name,
        "description": description,
        "category": category,
        "resources_required": resources_required,
        "monthly_subscription_fee": monthly_subscription_fee,
        "revenue_sharing": revenue_sharing,
        "nodes_available": nodes_available,
        "github_url": github_url,
        "documentation_url": documentation_url,
        "contact_email": contact_email,
        "terms_accepted": terms_accepted,
        "icon_url": None,
        "code_file_url": None,
        "status": "pending",
        "featured": False,
        "featured_until": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.app_submissions.insert_one(submission)
    
    return {
        "message": "App submitted successfully",
        "submission_id": submission_id,
        "status": "pending"
    }


@router.post("/upload-icon/{submission_id}")
async def upload_app_icon(submission_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload app icon for a submission"""
    submission = await db.app_submissions.find_one({"id": submission_id, "user_id": user["id"]})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Save file (in production, upload to cloud storage)
    icon_url = f"/uploads/icons/{submission_id}_{file.filename}"
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {"icon_url": icon_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Icon uploaded", "icon_url": icon_url}


@router.post("/upload-code/{submission_id}")
async def upload_app_code(submission_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload app code package for a submission"""
    submission = await db.app_submissions.find_one({"id": submission_id, "user_id": user["id"]})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    code_url = f"/uploads/code/{submission_id}_{file.filename}"
    
    await db.app_submissions.update_one(
        {"id": submission_id},
        {"$set": {"code_file_url": code_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Code uploaded", "code_url": code_url}


@router.get("/submissions")
async def get_submissions(user=Depends(get_current_user)):
    """Get all app submissions for current user"""
    submissions = await db.app_submissions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return submissions


@router.get("/submission/{submission_id}")
async def get_submission_detail(submission_id: str, user=Depends(get_current_user)):
    """Get detailed information about a specific submission"""
    submission = await db.app_submissions.find_one(
        {"id": submission_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission


@router.post("/featured/checkout")
async def create_featured_checkout(submission_id: str, plan: str, origin_url: str, user=Depends(get_current_user)):
    """Create Stripe checkout session for featured listing"""
    submission = await db.app_submissions.find_one({"id": submission_id, "user_id": user["id"]})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved apps can be featured")
    
    # Pricing
    prices = {
        "30_days": {"amount": 9900, "days": 30, "label": "30 Days Featured"},
        "60_days": {"amount": 14900, "days": 60, "label": "60 Days Featured"}
    }
    
    if plan not in prices:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    price_info = prices[plan]
    
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Featured Listing: {submission['app_name']}",
                        "description": price_info["label"]
                    },
                    "unit_amount": price_info["amount"]
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{origin_url}/developer?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin_url}/developer?canceled=true",
            metadata={
                "submission_id": submission_id,
                "user_id": user["id"],
                "plan": plan,
                "days": str(price_info["days"])
            }
        )
        
        # Store transaction
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "session_id": session.id,
            "submission_id": submission_id,
            "user_id": user["id"],
            "amount": price_info["amount"],
            "plan": plan,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"checkout_url": session.url, "session_id": session.id}
        
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")


@router.get("/featured/status/{session_id}")
async def get_featured_status(session_id: str, user=Depends(get_current_user)):
    """Check status of a featured listing payment"""
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check Stripe for status
    if STRIPE_API_KEY and transaction.get("payment_status") == "pending":
        try:
            import stripe
            stripe.api_key = STRIPE_API_KEY
            
            session = stripe.checkout.Session.retrieve(session_id)
            
            if session.payment_status == "paid":
                # Update transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
                
                # Activate featured listing
                plan = transaction.get("plan", "30_days")
                days = 30 if plan == "30_days" else 60
                featured_until = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
                
                await db.app_submissions.update_one(
                    {"id": transaction["submission_id"]},
                    {"$set": {
                        "featured": True,
                        "featured_until": featured_until,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                transaction["payment_status"] = "paid"
                transaction["featured_until"] = featured_until
                
        except Exception as e:
            logger.error(f"Error checking Stripe status: {e}")
    
    return transaction
