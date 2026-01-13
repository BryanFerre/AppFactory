"""
Authentication and security helpers
"""
import bcrypt
import jwt
import pyotp
import qrcode
import io
import base64
import random
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, ADMIN_JWT_SECRET, TOTP_ISSUER
from utils.database import db

security = HTTPBearer()

# ==================== PASSWORD HELPERS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# ==================== JWT HELPERS ====================

def create_token(user_id: str, is_admin: bool = False, pending_2fa: bool = False) -> str:
    """Create a JWT token"""
    secret = ADMIN_JWT_SECRET if is_admin else JWT_SECRET
    payload = {
        "sub": user_id,
        "is_admin": is_admin,
        "pending_2fa": pending_2fa,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get the current authenticated user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get the current authenticated admin"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, ADMIN_JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin_id = payload.get("sub")
        if not admin_id or not payload.get("is_admin"):
            raise HTTPException(status_code=401, detail="Invalid admin token")
        
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== 2FA HELPERS ====================

def generate_totp_secret() -> str:
    """Generate a new TOTP secret for 2FA setup"""
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str) -> str:
    """Generate the provisioning URI for authenticator apps"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=TOTP_ISSUER)

def generate_qr_code(uri: str) -> str:
    """Generate a QR code image as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code against the secret"""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 8) -> List[str]:
    """Generate backup codes for 2FA recovery"""
    codes = []
    for _ in range(count):
        code = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes

# ==================== REFERRAL HELPERS ====================

def generate_referral_code(user_id: str) -> str:
    """Generate a unique, short referral code from user ID"""
    hash_input = f"{user_id}{JWT_SECRET}"
    hash_obj = hashlib.sha256(hash_input.encode())
    return hash_obj.hexdigest()[:8].upper()
