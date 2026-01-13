from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# API Keys
COINMARKETCAP_API_KEY = os.environ.get('COINMARKETCAP_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="NAPP Node Operator Dashboard API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    wallet_address: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class NodeStats(BaseModel):
    node_id: str
    status: str
    uptime_percent: float
    cpu_usage: float
    memory_usage: float
    storage_usage: float
    latency_ms: float
    last_heartbeat: str
    reliability_score: float
    reputation_score: float

class EarningsData(BaseModel):
    today_opt: float
    today_usd: float
    week_opt: float
    week_usd: float
    month_opt: float
    month_usd: float
    earnings_by_app: List[dict]
    daily_history: List[dict]

class InstalledApp(BaseModel):
    id: str
    name: str
    icon: str
    status: str
    subscribers_served: int
    revenue_opt: float
    revenue_usd: float
    health: str
    installed_at: str

class AvailableApp(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    revenue_share: float
    estimated_monthly_opt: float
    estimated_monthly_usd: float
    capacity_required: float
    is_trending: bool
    is_new: bool
    installs: int

class PromotionStats(BaseModel):
    clicks: int
    referrals: int
    conversions: int
    revenue_attributed_opt: float
    share_links: List[dict]

class CapacityData(BaseModel):
    total_capacity: float
    used_capacity: float
    available_capacity: float
    app_usage: List[dict]

class PayoutRecord(BaseModel):
    id: str
    date: str
    amount_opt: float
    amount_usd: float
    status: str
    tx_hash: Optional[str]

class AIRecommendation(BaseModel):
    type: str
    title: str
    description: str
    action: Optional[str]
    priority: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    wallet_address = f"0x{uuid.uuid4().hex[:40]}"
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "wallet_address": wallet_address,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Initialize node for user
    await initialize_user_node(user_id)
    
    token = create_token(user_id)
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

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            wallet_address=user.get("wallet_address"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        wallet_address=user.get("wallet_address"),
        created_at=user["created_at"]
    )

# ==================== NODE INITIALIZATION ====================

async def initialize_user_node(user_id: str):
    node_id = f"node-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    node_doc = {
        "user_id": user_id,
        "node_id": node_id,
        "status": "healthy",
        "uptime_percent": 99.7,
        "cpu_usage": 42.5,
        "memory_usage": 58.3,
        "storage_usage": 35.2,
        "latency_ms": 12,
        "last_heartbeat": now,
        "reliability_score": 98.5,
        "reputation_score": 850,
        "total_capacity": 100,
        "used_capacity": 45,
        "created_at": now
    }
    await db.nodes.insert_one(node_doc)
    
    # Add some default installed apps
    apps = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "DataVault Pro",
            "icon": "database",
            "status": "running",
            "subscribers_served": 1247,
            "revenue_opt": 145.6,
            "revenue_usd": 0,
            "health": "healthy",
            "installed_at": now,
            "capacity_used": 15
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "StreamRelay",
            "icon": "video",
            "status": "running",
            "subscribers_served": 856,
            "revenue_opt": 98.3,
            "revenue_usd": 0,
            "health": "healthy",
            "installed_at": now,
            "capacity_used": 20
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": "ChainBridge",
            "icon": "link",
            "status": "running",
            "subscribers_served": 432,
            "revenue_opt": 67.8,
            "revenue_usd": 0,
            "health": "warning",
            "installed_at": now,
            "capacity_used": 10
        }
    ]
    await db.installed_apps.insert_many(apps)
    
    # Generate earnings history
    earnings_history = []
    for i in range(30):
        date = (datetime.now(timezone.utc) - timedelta(days=29-i)).strftime("%Y-%m-%d")
        earnings_history.append({
            "user_id": user_id,
            "date": date,
            "opt": round(random.uniform(8, 25), 2),
            "usd": 0
        })
    await db.earnings_history.insert_many(earnings_history)

# ==================== NODE STATS ENDPOINTS ====================

@api_router.get("/node/stats", response_model=NodeStats)
async def get_node_stats(user=Depends(get_current_user)):
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    return NodeStats(
        node_id=node["node_id"],
        status=node["status"],
        uptime_percent=node["uptime_percent"],
        cpu_usage=node["cpu_usage"],
        memory_usage=node["memory_usage"],
        storage_usage=node["storage_usage"],
        latency_ms=node["latency_ms"],
        last_heartbeat=node["last_heartbeat"],
        reliability_score=node["reliability_score"],
        reputation_score=node["reputation_score"]
    )

@api_router.post("/node/verify")
async def verify_node(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.nodes.update_one(
        {"user_id": user["id"]},
        {"$set": {"last_heartbeat": now, "status": "healthy"}}
    )
    return {"message": "Node verified successfully", "verified_at": now}

# ==================== EARNINGS ENDPOINTS ====================

@api_router.get("/earnings", response_model=EarningsData)
async def get_earnings(user=Depends(get_current_user)):
    opt_price = await get_opt_price()
    
    # Get installed apps earnings
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    earnings_by_app = []
    total_today = 0
    
    for app in apps:
        daily_earnings = app["revenue_opt"] / 30
        total_today += daily_earnings
        earnings_by_app.append({
            "app_name": app["name"],
            "opt": round(daily_earnings, 2),
            "usd": round(daily_earnings * opt_price, 2)
        })
    
    # Get history
    history = await db.earnings_history.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    week_opt = sum(h["opt"] for h in history[:7])
    month_opt = sum(h["opt"] for h in history[:30])
    
    daily_history = [
        {"date": h["date"], "opt": h["opt"], "usd": round(h["opt"] * opt_price, 2)}
        for h in reversed(history[:30])
    ]
    
    return EarningsData(
        today_opt=round(total_today, 2),
        today_usd=round(total_today * opt_price, 2),
        week_opt=round(week_opt, 2),
        week_usd=round(week_opt * opt_price, 2),
        month_opt=round(month_opt, 2),
        month_usd=round(month_opt * opt_price, 2),
        earnings_by_app=earnings_by_app,
        daily_history=daily_history
    )

# ==================== OPT PRICE (CoinMarketCap) ====================

OPT_PRICE_CACHE = {"price": 0.85, "last_updated": None}

async def get_opt_price() -> float:
    global OPT_PRICE_CACHE
    
    # Check cache (5 minutes)
    if OPT_PRICE_CACHE["last_updated"]:
        elapsed = datetime.now(timezone.utc) - OPT_PRICE_CACHE["last_updated"]
        if elapsed.total_seconds() < 300:
            return OPT_PRICE_CACHE["price"]
    
    # For OPT token (fictional), we'll use a mock price that fluctuates
    # In production, this would call CoinMarketCap API with the real token ID
    try:
        if COINMARKETCAP_API_KEY:
            # Mock realistic price behavior
            base_price = 0.85
            variation = random.uniform(-0.05, 0.05)
            price = base_price + variation
            OPT_PRICE_CACHE = {
                "price": round(price, 4),
                "last_updated": datetime.now(timezone.utc)
            }
            return OPT_PRICE_CACHE["price"]
    except Exception as e:
        logger.error(f"Error fetching OPT price: {e}")
    
    return 0.85

@api_router.get("/price/opt")
async def get_current_opt_price():
    price = await get_opt_price()
    return {
        "symbol": "OPT",
        "price_usd": price,
        "change_24h": round(random.uniform(-5, 8), 2),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

# ==================== INSTALLED APPS ENDPOINTS ====================

@api_router.get("/apps/installed", response_model=List[InstalledApp])
async def get_installed_apps(user=Depends(get_current_user)):
    opt_price = await get_opt_price()
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    result = []
    for app in apps:
        result.append(InstalledApp(
            id=app["id"],
            name=app["name"],
            icon=app["icon"],
            status=app["status"],
            subscribers_served=app["subscribers_served"],
            revenue_opt=app["revenue_opt"],
            revenue_usd=round(app["revenue_opt"] * opt_price, 2),
            health=app["health"],
            installed_at=app["installed_at"]
        ))
    return result

@api_router.delete("/apps/installed/{app_id}")
async def uninstall_app(app_id: str, user=Depends(get_current_user)):
    result = await db.installed_apps.delete_one({"id": app_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="App not found")
    return {"message": "App uninstalled successfully"}

# ==================== APP FACTORY ENDPOINTS ====================

AVAILABLE_APPS = [
    {
        "id": "app-1",
        "name": "DataVault Pro",
        "description": "Secure decentralized storage for enterprise data with automatic backup and versioning.",
        "icon": "database",
        "category": "Storage",
        "revenue_share": 70,
        "estimated_monthly_opt": 145,
        "estimated_monthly_usd": 123.25,
        "capacity_required": 15,
        "is_trending": True,
        "is_new": False,
        "installs": 12450
    },
    {
        "id": "app-2",
        "name": "StreamRelay",
        "description": "High-performance video streaming relay for live events and content delivery.",
        "icon": "video",
        "category": "Media",
        "revenue_share": 65,
        "estimated_monthly_opt": 98,
        "estimated_monthly_usd": 83.30,
        "capacity_required": 20,
        "is_trending": True,
        "is_new": False,
        "installs": 8920
    },
    {
        "id": "app-3",
        "name": "ChainBridge",
        "description": "Cross-chain communication bridge for seamless asset transfers.",
        "icon": "link",
        "category": "DeFi",
        "revenue_share": 75,
        "estimated_monthly_opt": 67,
        "estimated_monthly_usd": 56.95,
        "capacity_required": 10,
        "is_trending": False,
        "is_new": False,
        "installs": 5670
    },
    {
        "id": "app-4",
        "name": "NFT Gateway",
        "description": "Mint, store, and distribute NFTs with low gas fees.",
        "icon": "image",
        "category": "NFT",
        "revenue_share": 60,
        "estimated_monthly_opt": 120,
        "estimated_monthly_usd": 102.00,
        "capacity_required": 12,
        "is_trending": True,
        "is_new": True,
        "installs": 3240
    },
    {
        "id": "app-5",
        "name": "SecureComm",
        "description": "End-to-end encrypted messaging and file sharing platform.",
        "icon": "shield",
        "category": "Communication",
        "revenue_share": 68,
        "estimated_monthly_opt": 85,
        "estimated_monthly_usd": 72.25,
        "capacity_required": 8,
        "is_trending": False,
        "is_new": True,
        "installs": 1890
    },
    {
        "id": "app-6",
        "name": "AI Inference Hub",
        "description": "Run decentralized AI models for inference requests.",
        "icon": "cpu",
        "category": "AI",
        "revenue_share": 72,
        "estimated_monthly_opt": 200,
        "estimated_monthly_usd": 170.00,
        "capacity_required": 30,
        "is_trending": True,
        "is_new": True,
        "installs": 2100
    },
    {
        "id": "app-7",
        "name": "Oracle Network",
        "description": "Provide real-world data feeds to smart contracts.",
        "icon": "globe",
        "category": "Infrastructure",
        "revenue_share": 70,
        "estimated_monthly_opt": 155,
        "estimated_monthly_usd": 131.75,
        "capacity_required": 18,
        "is_trending": False,
        "is_new": False,
        "installs": 7340
    },
    {
        "id": "app-8",
        "name": "GameServer Pro",
        "description": "Host multiplayer game servers with low latency.",
        "icon": "gamepad",
        "category": "Gaming",
        "revenue_share": 62,
        "estimated_monthly_opt": 175,
        "estimated_monthly_usd": 148.75,
        "capacity_required": 25,
        "is_trending": True,
        "is_new": False,
        "installs": 6780
    }
]

@api_router.get("/apps/available", response_model=List[AvailableApp])
async def get_available_apps(
    category: Optional[str] = None,
    trending: Optional[bool] = None,
    new: Optional[bool] = None,
    user=Depends(get_current_user)
):
    opt_price = await get_opt_price()
    apps = AVAILABLE_APPS.copy()
    
    # Get user's installed apps
    installed = await db.installed_apps.find({"user_id": user["id"]}, {"name": 1}).to_list(100)
    installed_names = {app["name"] for app in installed}
    
    # Filter out already installed apps
    apps = [a for a in apps if a["name"] not in installed_names]
    
    if category:
        apps = [a for a in apps if a["category"].lower() == category.lower()]
    if trending is not None:
        apps = [a for a in apps if a["is_trending"] == trending]
    if new is not None:
        apps = [a for a in apps if a["is_new"] == new]
    
    result = []
    for app in apps:
        result.append(AvailableApp(
            id=app["id"],
            name=app["name"],
            description=app["description"],
            icon=app["icon"],
            category=app["category"],
            revenue_share=app["revenue_share"],
            estimated_monthly_opt=app["estimated_monthly_opt"],
            estimated_monthly_usd=round(app["estimated_monthly_opt"] * opt_price, 2),
            capacity_required=app["capacity_required"],
            is_trending=app["is_trending"],
            is_new=app["is_new"],
            installs=app["installs"]
        ))
    
    return result

@api_router.post("/apps/install/{app_id}")
async def install_app(app_id: str, user=Depends(get_current_user)):
    app_data = next((a for a in AVAILABLE_APPS if a["id"] == app_id), None)
    if not app_data:
        raise HTTPException(status_code=404, detail="App not found")
    
    # Check capacity
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    available = node["total_capacity"] - node["used_capacity"]
    if app_data["capacity_required"] > available:
        raise HTTPException(status_code=400, detail="Insufficient capacity")
    
    now = datetime.now(timezone.utc).isoformat()
    new_app = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": app_data["name"],
        "icon": app_data["icon"],
        "status": "running",
        "subscribers_served": 0,
        "revenue_opt": 0,
        "revenue_usd": 0,
        "health": "healthy",
        "installed_at": now,
        "capacity_used": app_data["capacity_required"]
    }
    
    await db.installed_apps.insert_one(new_app)
    await db.nodes.update_one(
        {"user_id": user["id"]},
        {"$inc": {"used_capacity": app_data["capacity_required"]}}
    )
    
    return {"message": f"{app_data['name']} installed successfully", "app_id": new_app["id"]}

# ==================== PROMOTION ENDPOINTS ====================

@api_router.get("/promotion/stats", response_model=PromotionStats)
async def get_promotion_stats(user=Depends(get_current_user)):
    return PromotionStats(
        clicks=2847,
        referrals=156,
        conversions=42,
        revenue_attributed_opt=325.5,
        share_links=[
            {"platform": "twitter", "url": f"https://napp.io/ref/{user['id'][:8]}?utm=tw", "clicks": 1240},
            {"platform": "telegram", "url": f"https://napp.io/ref/{user['id'][:8]}?utm=tg", "clicks": 890},
            {"platform": "discord", "url": f"https://napp.io/ref/{user['id'][:8]}?utm=dc", "clicks": 717}
        ]
    )

# ==================== CAPACITY ENDPOINTS ====================

@api_router.get("/capacity", response_model=CapacityData)
async def get_capacity(user=Depends(get_current_user)):
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    app_usage = [
        {"name": app["name"], "capacity": app.get("capacity_used", 10)}
        for app in apps
    ]
    
    return CapacityData(
        total_capacity=node["total_capacity"],
        used_capacity=node["used_capacity"],
        available_capacity=node["total_capacity"] - node["used_capacity"],
        app_usage=app_usage
    )

# ==================== PAYOUTS ENDPOINTS ====================

@api_router.get("/payouts", response_model=List[PayoutRecord])
async def get_payouts(user=Depends(get_current_user)):
    # Generate mock payout history
    payouts = []
    for i in range(5):
        date = (datetime.now(timezone.utc) - timedelta(days=i*7)).strftime("%Y-%m-%d")
        opt_amount = round(random.uniform(50, 150), 2)
        payouts.append(PayoutRecord(
            id=str(uuid.uuid4()),
            date=date,
            amount_opt=opt_amount,
            amount_usd=round(opt_amount * 0.85, 2),
            status="completed" if i > 0 else "pending",
            tx_hash=f"0x{uuid.uuid4().hex}" if i > 0 else None
        ))
    return payouts

# ==================== AI RECOMMENDATIONS ====================

@api_router.get("/ai/recommendations", response_model=List[AIRecommendation])
async def get_ai_recommendations(user=Depends(get_current_user)):
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Get user context
        node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
        apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
        
        context = f"""
        Node Status: {node['status']}
        Uptime: {node['uptime_percent']}%
        CPU Usage: {node['cpu_usage']}%
        Memory Usage: {node['memory_usage']}%
        Storage Usage: {node['storage_usage']}%
        Capacity Used: {node['used_capacity']}/{node['total_capacity']}
        Installed Apps: {', '.join(a['name'] for a in apps)}
        """
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommendations-{user['id']}",
            system_message="""You are an AI assistant for NAPP Node operators. Generate 3 actionable recommendations to help them maximize earnings and optimize their node. 
            Return JSON array with objects containing: type (earnings/optimization/promotion/app), title, description, action (optional button text), priority (high/medium/low).
            Keep responses concise and actionable."""
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=f"Based on this node data, give 3 recommendations:\n{context}")
        response = await chat.send_message(user_msg)
        
        # Parse response
        import json
        try:
            recommendations = json.loads(response)
            return [AIRecommendation(**r) for r in recommendations[:3]]
        except:
            pass
    except Exception as e:
        logger.error(f"AI recommendations error: {e}")
    
    # Fallback recommendations
    return [
        AIRecommendation(
            type="app",
            title="Install AI Inference Hub",
            description="Based on your node capacity, AI Inference Hub could increase your monthly earnings by 40%.",
            action="View App",
            priority="high"
        ),
        AIRecommendation(
            type="optimization",
            title="Optimize Memory Usage",
            description="Your memory usage is at 58%. Consider upgrading to handle more concurrent requests.",
            action="View Upgrades",
            priority="medium"
        ),
        AIRecommendation(
            type="promotion",
            title="Share Your Referral Link",
            description="You have 156 referrals. Sharing on Twitter could double your referral bonus.",
            action="Share Now",
            priority="low"
        )
    ]

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    return [
        {"id": "1", "type": "success", "message": "Daily verification complete", "time": "2 hours ago", "read": False},
        {"id": "2", "type": "info", "message": "New app available: AI Inference Hub", "time": "5 hours ago", "read": False},
        {"id": "3", "type": "warning", "message": "ChainBridge needs attention", "time": "1 day ago", "read": True},
        {"id": "4", "type": "success", "message": "Weekly payout processed: 125.5 OPT", "time": "3 days ago", "read": True}
    ]

# ==================== ROOT & HEALTH ====================

@api_router.get("/")
async def root():
    return {"message": "NAPP Node Operator Dashboard API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
