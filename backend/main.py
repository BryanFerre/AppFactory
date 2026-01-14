"""
AppCloud Node Operator Dashboard API
Main application entry point with modular route architecture
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from contextlib import asynccontextmanager

from utils.database import db, client, init_indexes
from api.admin import init_super_admin

# Import all route modules
from api import auth, node, earnings, apps, referral, promotion, ai, developer, notifications, webhooks, admin, accounting, activity, products, licenses, purchase, coupons

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting AppCloud API...")
    await init_indexes()
    await init_super_admin()
    
    # Seed default products
    from api.products import seed_default_products
    await seed_default_products()
    
    logger.info("AppCloud API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AppCloud API...")
    client.close()
    logger.info("AppCloud API shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="AppCloud Node Operator Dashboard API",
    description="API for the AppCloud Node Operator Dashboard - Optio Blockchain Cloud",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(node.router, prefix="/api")
app.include_router(earnings.router, prefix="/api")
app.include_router(apps.router, prefix="/api")
app.include_router(referral.router, prefix="/api")
app.include_router(promotion.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(developer.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")

# Admin router (already has /admin prefix internally)
app.include_router(admin.router, prefix="/api")
app.include_router(accounting.router, prefix="/api")

# Activity Points System
app.include_router(activity.router, prefix="/api")
app.include_router(activity.admin_router, prefix="/api")
app.include_router(activity.external_router, prefix="/api")

# Products, Licenses, and Purchase
app.include_router(products.router, prefix="/api")
app.include_router(products.admin_router, prefix="/api")
app.include_router(licenses.router, prefix="/api")
app.include_router(licenses.admin_router, prefix="/api")
app.include_router(purchase.router, prefix="/api")
app.include_router(purchase.admin_router, prefix="/api")

# Coupons
app.include_router(coupons.router, prefix="/api")
app.include_router(coupons.admin_router, prefix="/api")


# Root endpoints
@app.get("/api/")
async def root():
    """API root endpoint"""
    return {
        "message": "AppCloud Node Operator Dashboard API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    from datetime import datetime, timezone
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
