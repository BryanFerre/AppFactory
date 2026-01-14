"""
Stripe webhook handler
"""
from fastapi import APIRouter, Request, HTTPException
from datetime import datetime, timezone, timedelta
import logging

from utils.database import db
from utils.config import STRIPE_API_KEY

router = APIRouter(tags=["Webhooks"])
logger = logging.getLogger(__name__)


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if not STRIPE_API_KEY:
        return {"received": True}
    
    try:
        import stripe
        stripe.api_key = STRIPE_API_KEY
        
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        # In production, verify the webhook signature
        # event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        
        # For now, parse the JSON directly
        import json
        event = json.loads(payload)
        
        if event.get("type") == "checkout.session.completed":
            session = event["data"]["object"]
            session_id = session.get("id")
            
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                metadata = session.get("metadata", {})
                days = int(metadata.get("days", 30))
                featured_until = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
                
                await db.app_submissions.update_one(
                    {"id": transaction["submission_id"]},
                    {"$set": {
                        "featured": True,
                        "featured_until": featured_until,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}
