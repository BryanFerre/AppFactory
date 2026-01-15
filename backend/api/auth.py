"""
Authentication routes - User registration, login, 2FA
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid

from utils.database import db
from utils.config import FRONTEND_URL
from utils.auth import (
    hash_password, verify_password, create_token, get_current_user,
    generate_totp_secret, get_totp_uri, generate_qr_code, verify_totp,
    generate_backup_codes, generate_referral_code
)
from models.schemas import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    TwoFactorSetupResponse, TwoFactorVerifyRequest, TestEmailRequest
)
from services.email import send_notification_email
from services.referral import process_referral_signup, initialize_user_node

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def award_user_points(user_id: str, action_id: str, source_entity_id: str = None, metadata: dict = None):
    """Helper function to award points to a user"""
    try:
        from services.points_engine import PointsEngine
        engine = PointsEngine(db)
        await engine.award_points(
            user_id=user_id,
            action_id=action_id,
            source_entity_id=source_entity_id,
            metadata=metadata
        )
    except Exception as e:
        # Don't fail the main operation if points fail
        import logging
        logging.error(f"Failed to award points: {e}")


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user account"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    wallet_address = f"0x{uuid.uuid4().hex[:40]}"
    now = datetime.now(timezone.utc).isoformat()
    referral_code = generate_referral_code(user_id)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "wallet_address": wallet_address,
        "referral_code": referral_code,
        "referred_by": user_data.referral_code,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Initialize referral stats for new user
    await db.referral_stats.insert_one({
        "user_id": user_id,
        "operator_clicks": 0,
        "operator_signups": 0,
        "operator_opt_earned": 0.0,
        "operator_pending_opt": 0.0,
        "app_clicks": 0,
        "app_signups": 0,
        "app_opt_earned": 0.0,
        "app_pending_opt": 0.0,
        "total_opt_earned": 0.0,
        "total_pending_opt": 0.0,
        "created_at": now
    })
    
    # Process referral if user was referred
    if user_data.referral_code:
        await process_referral_signup(user_id, user_data.referral_code, "operator")
    
    # Initialize node for user
    await initialize_user_node(user_id)
    
    # Send welcome email
    await send_notification_email("welcome", user_data.email, {
        "name": user_data.name,
        "referral_code": referral_code,
        "dashboard_url": FRONTEND_URL
    })
    
    token = create_token(user_id)
    
    # Award onboarding points
    await award_user_points(user_id, "complete_onboarding")
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            wallet_address=wallet_address,
            created_at=now
        )
    )


@router.post("/login")
async def login(user_data: UserLogin):
    """Login with email and password, with optional 2FA"""
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    two_fa_enabled = user.get("two_factor_enabled", False)
    
    # Check if 2FA is enabled for this user
    if two_fa_enabled:
        if not user_data.totp_code:
            return {
                "requires_2fa": True,
                "message": "Two-factor authentication code required",
                "access_token": None,
                "user": None
            }
        
        # Verify the TOTP code
        totp_secret = user.get("totp_secret")
        if not totp_secret or not verify_totp(totp_secret, user_data.totp_code):
            # Check backup codes
            backup_codes = user.get("backup_codes", [])
            if user_data.totp_code in backup_codes:
                backup_codes.remove(user_data.totp_code)
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"backup_codes": backup_codes}}
                )
            else:
                raise HTTPException(status_code=401, detail="Invalid 2FA code")
    
    token = create_token(user["id"])
    
    # Award daily login points
    points_result = await award_user_points(user["id"], "daily_login")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "requires_2fa": False,
        "points_earned": points_result.get("points_awarded") if points_result and points_result.get("success") else None,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "wallet_address": user.get("wallet_address"),
            "created_at": user["created_at"],
            "two_factor_enabled": two_fa_enabled
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        wallet_address=user.get("wallet_address"),
        created_at=user["created_at"],
        two_factor_enabled=user.get("two_factor_enabled", False)
    )


from pydantic import BaseModel, Field

class ChangePasswordRequest(BaseModel):
    current_password: str = None  # Optional for initial password setup
    new_password: str = Field(..., min_length=8)


@router.put("/change-password")
async def change_password(request: ChangePasswordRequest, user=Depends(get_current_user)):
    """Change user password - can be used for initial setup or password change"""
    
    # If current_password is provided, verify it (for regular password change)
    if request.current_password:
        if not verify_password(request.current_password, user["password"]):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash and update the new password
    hashed_password = hash_password(request.new_password)
    now = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "password": hashed_password,
            "updated_at": now.isoformat()
        }}
    )
    
    return {"success": True, "message": "Password updated successfully"}


# ==================== 2FA ENDPOINTS ====================

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(user=Depends(get_current_user)):
    """Initialize 2FA setup - returns QR code and secret"""
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user["email"])
    qr_code = generate_qr_code(uri)
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"pending_totp_secret": secret}}
    )
    
    return TwoFactorSetupResponse(
        secret=secret,
        qr_code=qr_code,
        provisioning_uri=uri
    )


@router.post("/2fa/verify")
async def verify_2fa_setup(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Verify 2FA setup with first code - enables 2FA"""
    pending_secret = user.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending 2FA setup found. Please start setup first.")
    
    if not verify_totp(pending_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    backup_codes = generate_backup_codes()
    enabled_at = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "totp_secret": pending_secret,
                "two_factor_enabled": True,
                "backup_codes": backup_codes,
                "two_factor_enabled_at": enabled_at
            },
            "$unset": {"pending_totp_secret": ""}
        }
    )
    
    # Send email notification
    await send_notification_email("2fa_enabled", user["email"], {
        "enabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
        "dashboard_url": FRONTEND_URL
    })
    
    return {
        "message": "Two-factor authentication enabled successfully",
        "backup_codes": backup_codes
    }


@router.post("/2fa/disable")
async def disable_2fa(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Disable 2FA - requires current code for verification"""
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = user.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        backup_codes = user.get("backup_codes", [])
        if verify_data.code not in backup_codes:
            raise HTTPException(status_code=400, detail="Invalid verification code")
    
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"totp_secret": "", "backup_codes": "", "pending_totp_secret": ""}
        }
    )
    
    # Send email notification
    await send_notification_email("2fa_disabled", user["email"], {
        "disabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
        "dashboard_url": FRONTEND_URL
    })
    
    return {"message": "Two-factor authentication disabled successfully"}


@router.get("/2fa/status")
async def get_2fa_status(user=Depends(get_current_user)):
    """Get current 2FA status"""
    return {
        "two_factor_enabled": user.get("two_factor_enabled", False),
        "enabled_at": user.get("two_factor_enabled_at"),
        "backup_codes_remaining": len(user.get("backup_codes", []))
    }


@router.post("/2fa/backup-codes/regenerate")
async def regenerate_backup_codes(verify_data: TwoFactorVerifyRequest, user=Depends(get_current_user)):
    """Regenerate backup codes - requires current code"""
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    totp_secret = user.get("totp_secret")
    if not verify_totp(totp_secret, verify_data.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    backup_codes = generate_backup_codes()
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"backup_codes": backup_codes}}
    )
    
    return {"backup_codes": backup_codes}


# ==================== TEST ENDPOINTS ====================

@router.post("/test/send-email")
async def test_send_email(request: TestEmailRequest, user=Depends(get_current_user)):
    """Test endpoint to send sample emails"""
    sample_data = {
        "welcome": {
            "name": user.get("name", "Test User"),
            "referral_code": user.get("referral_code", "TESTCODE"),
            "dashboard_url": FRONTEND_URL
        },
        "referral_signup": {
            "opt_reward": 50,
            "referral_type": "operator",
            "total_referrals": 5,
            "dashboard_url": FRONTEND_URL
        },
        "2fa_enabled": {
            "enabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
            "dashboard_url": FRONTEND_URL
        },
        "2fa_disabled": {
            "disabled_at": datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC'),
            "dashboard_url": FRONTEND_URL
        }
    }
    
    if request.template not in sample_data:
        raise HTTPException(status_code=400, detail=f"Invalid template. Options: {list(sample_data.keys())}")
    
    success = await send_notification_email(request.template, request.to_email, sample_data[request.template])
    
    if success:
        return {"message": f"Test email sent to {request.to_email}", "template": request.template}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check if Resend API key is configured.")
