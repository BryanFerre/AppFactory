"""
Categories API - Full taxonomy for app marketplace
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from utils.database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

# Complete App Store Taxonomy
APP_CATEGORIES = {
    "productivity-work": {
        "id": "productivity-work",
        "name": "Productivity & Work",
        "icon": "briefcase",
        "color": "from-blue-500 to-cyan-500",
        "subcategories": [
            {"id": "task-management", "name": "Task Management"},
            {"id": "project-management", "name": "Project Management"},
            {"id": "notes-knowledge", "name": "Notes & Knowledge Bases"},
            {"id": "calendars-scheduling", "name": "Calendars & Scheduling"},
            {"id": "document-management", "name": "Document Management"},
            {"id": "time-tracking", "name": "Time Tracking"},
            {"id": "team-collaboration", "name": "Team Collaboration"},
            {"id": "remote-work", "name": "Remote Work Tools"},
            {"id": "automation-workflow", "name": "Automation & Workflow"},
            {"id": "file-storage", "name": "File Storage & Sharing"}
        ]
    },
    "business-finance": {
        "id": "business-finance",
        "name": "Business & Finance",
        "icon": "dollar-sign",
        "color": "from-emerald-500 to-green-500",
        "subcategories": [
            {"id": "accounting", "name": "Accounting & Bookkeeping"},
            {"id": "invoicing", "name": "Invoicing & Payments"},
            {"id": "payroll-hr", "name": "Payroll & HR"},
            {"id": "crm-sales", "name": "CRM & Sales"},
            {"id": "business-intelligence", "name": "Business Intelligence & Analytics"},
            {"id": "ecommerce", "name": "E-Commerce Tools"},
            {"id": "pos", "name": "Point of Sale (POS)"},
            {"id": "subscription-management", "name": "Subscription Management"},
            {"id": "investment-trading", "name": "Investment & Trading"},
            {"id": "crypto-digital-assets", "name": "Crypto & Digital Assets"}
        ]
    },
    "artificial-intelligence": {
        "id": "artificial-intelligence",
        "name": "Artificial Intelligence",
        "icon": "brain",
        "color": "from-purple-500 to-pink-500",
        "subcategories": [
            {"id": "ai-assistants", "name": "AI Assistants & Agents"},
            {"id": "generative-ai", "name": "Generative AI (Text, Image, Video, Audio)"},
            {"id": "ai-automation", "name": "AI Automation Tools"},
            {"id": "data-analysis", "name": "Data Analysis & Prediction"},
            {"id": "chatbots", "name": "Chatbots & Customer Support AI"},
            {"id": "ai-coding", "name": "AI Coding Tools"},
            {"id": "ai-design", "name": "AI Design Tools"},
            {"id": "voice-speech-ai", "name": "Voice & Speech AI"},
            {"id": "personal-ai", "name": "Personal AI Coaches"}
        ]
    },
    "developer-tools": {
        "id": "developer-tools",
        "name": "Developer Tools",
        "icon": "code",
        "color": "from-orange-500 to-red-500",
        "subcategories": [
            {"id": "code-editors", "name": "Code Editors & IDEs"},
            {"id": "apis-sdks", "name": "APIs & SDKs"},
            {"id": "devops", "name": "DevOps & CI/CD"},
            {"id": "testing-qa", "name": "Testing & QA"},
            {"id": "low-code", "name": "Low-Code / No-Code"},
            {"id": "app-builders", "name": "App Builders"},
            {"id": "database-tools", "name": "Database Tools"},
            {"id": "version-control", "name": "Version Control"},
            {"id": "monitoring-logs", "name": "Monitoring & Logs"},
            {"id": "security-auth", "name": "Security & Auth"}
        ]
    },
    "marketing-growth": {
        "id": "marketing-growth",
        "name": "Marketing & Growth",
        "icon": "trending-up",
        "color": "from-pink-500 to-rose-500",
        "subcategories": [
            {"id": "social-media", "name": "Social Media Management"},
            {"id": "email-marketing", "name": "Email Marketing"},
            {"id": "sms-messaging", "name": "SMS & Messaging"},
            {"id": "content-creation", "name": "Content Creation"},
            {"id": "seo-sem", "name": "SEO & SEM"},
            {"id": "ads-campaigns", "name": "Ads & Campaign Management"},
            {"id": "influencer-affiliate", "name": "Influencer & Affiliate Tools"},
            {"id": "analytics-attribution", "name": "Analytics & Attribution"},
            {"id": "conversion-optimization", "name": "Conversion Optimization"},
            {"id": "brand-design", "name": "Brand & Design Tools"}
        ]
    },
    "communication": {
        "id": "communication",
        "name": "Communication",
        "icon": "message-circle",
        "color": "from-cyan-500 to-blue-500",
        "subcategories": [
            {"id": "messaging-apps", "name": "Messaging Apps"},
            {"id": "video-conferencing", "name": "Video Conferencing"},
            {"id": "voice-voip", "name": "Voice & VoIP"},
            {"id": "email-clients", "name": "Email Clients"},
            {"id": "community-platforms", "name": "Community Platforms"},
            {"id": "forums-chat", "name": "Forums & Chat Rooms"},
            {"id": "team-chat", "name": "Team Chat"},
            {"id": "translation", "name": "Translation & Language Tools"}
        ]
    },
    "design-creativity": {
        "id": "design-creativity",
        "name": "Design & Creativity",
        "icon": "palette",
        "color": "from-violet-500 to-purple-500",
        "subcategories": [
            {"id": "graphic-design", "name": "Graphic Design"},
            {"id": "ui-ux", "name": "UI / UX Tools"},
            {"id": "photo-editing", "name": "Photo Editing"},
            {"id": "video-editing", "name": "Video Editing"},
            {"id": "audio-music", "name": "Audio & Music Creation"},
            {"id": "animation", "name": "Animation & Motion"},
            {"id": "writing-publishing", "name": "Writing & Publishing"},
            {"id": "templates-assets", "name": "Templates & Assets"},
            {"id": "branding", "name": "Branding Tools"}
        ]
    },
    "education-learning": {
        "id": "education-learning",
        "name": "Education & Learning",
        "icon": "graduation-cap",
        "color": "from-amber-500 to-yellow-500",
        "subcategories": [
            {"id": "online-courses", "name": "Online Courses"},
            {"id": "tutoring", "name": "Tutoring & Coaching"},
            {"id": "language-learning", "name": "Language Learning"},
            {"id": "skill-development", "name": "Skill Development"},
            {"id": "kids-education", "name": "Kids Education"},
            {"id": "test-prep", "name": "Test Prep"},
            {"id": "flashcards", "name": "Flashcards & Study Tools"},
            {"id": "certifications", "name": "Certification Platforms"},
            {"id": "creator-education", "name": "Creator Education"}
        ]
    },
    "health-wellness": {
        "id": "health-wellness",
        "name": "Health, Wellness & Mindfulness",
        "icon": "heart",
        "color": "from-rose-500 to-pink-500",
        "subcategories": [
            {"id": "mental-health", "name": "Mental Health"},
            {"id": "meditation", "name": "Meditation & Breathwork"},
            {"id": "fitness", "name": "Fitness & Training"},
            {"id": "nutrition", "name": "Nutrition & Diet"},
            {"id": "sleep", "name": "Sleep & Recovery"},
            {"id": "habit-building", "name": "Habit Building"},
            {"id": "stress-anxiety", "name": "Stress & Anxiety Tools"},
            {"id": "coaching-therapy", "name": "Coaching & Therapy Tools"}
        ]
    },
    "lifestyle-personal": {
        "id": "lifestyle-personal",
        "name": "Lifestyle & Personal",
        "icon": "sparkles",
        "color": "from-teal-500 to-emerald-500",
        "subcategories": [
            {"id": "personal-planning", "name": "Personal Planning"},
            {"id": "journaling", "name": "Journaling & Reflection"},
            {"id": "goal-setting", "name": "Goal Setting"},
            {"id": "dating", "name": "Dating & Relationships"},
            {"id": "home-management", "name": "Home Management"},
            {"id": "family-parenting", "name": "Family & Parenting"},
            {"id": "fashion-style", "name": "Fashion & Style"},
            {"id": "food-cooking", "name": "Food & Cooking"}
        ]
    },
    "entertainment-media": {
        "id": "entertainment-media",
        "name": "Entertainment & Media",
        "icon": "play",
        "color": "from-red-500 to-orange-500",
        "subcategories": [
            {"id": "streaming", "name": "Streaming Platforms"},
            {"id": "music-audio", "name": "Music & Audio"},
            {"id": "video-platforms", "name": "Video Platforms"},
            {"id": "podcasts", "name": "Podcasts"},
            {"id": "games", "name": "Games"},
            {"id": "interactive-media", "name": "Interactive Media"},
            {"id": "live-events", "name": "Live Events"},
            {"id": "virtual-worlds", "name": "Virtual Worlds"}
        ]
    },
    "web3-blockchain": {
        "id": "web3-blockchain",
        "name": "Web3, Blockchain & Crypto",
        "icon": "hexagon",
        "color": "from-indigo-500 to-blue-500",
        "subcategories": [
            {"id": "wallets", "name": "Wallets"},
            {"id": "exchanges", "name": "Exchanges & Trading"},
            {"id": "defi", "name": "DeFi Tools"},
            {"id": "nfts", "name": "NFTs & Digital Collectibles"},
            {"id": "daos", "name": "DAOs & Governance"},
            {"id": "smart-contracts", "name": "Smart Contract Tools"},
            {"id": "node-infrastructure", "name": "Node & Infrastructure Tools"},
            {"id": "token-analytics", "name": "Token Analytics"},
            {"id": "web3-identity", "name": "Identity & Auth"}
        ]
    },
    "security-privacy": {
        "id": "security-privacy",
        "name": "Security & Privacy",
        "icon": "shield",
        "color": "from-slate-500 to-gray-600",
        "subcategories": [
            {"id": "identity-management", "name": "Identity Management"},
            {"id": "password-managers", "name": "Password Managers"},
            {"id": "encryption", "name": "Encryption Tools"},
            {"id": "vpns", "name": "VPNs & Networking"},
            {"id": "fraud-detection", "name": "Fraud Detection"},
            {"id": "compliance-kyc", "name": "Compliance & KYC"},
            {"id": "data-protection", "name": "Data Protection"},
            {"id": "security-monitoring", "name": "Monitoring & Alerts"}
        ]
    },
    "smart-home-iot": {
        "id": "smart-home-iot",
        "name": "Smart Home & IoT",
        "icon": "home",
        "color": "from-sky-500 to-blue-500",
        "subcategories": [
            {"id": "home-security", "name": "Home Security"},
            {"id": "energy-management", "name": "Energy Management"},
            {"id": "lighting-climate", "name": "Lighting & Climate"},
            {"id": "device-control", "name": "Device Control"},
            {"id": "automation-scenes", "name": "Automation & Scenes"},
            {"id": "sensors", "name": "Monitoring & Sensors"},
            {"id": "voice-assistants", "name": "Voice Assistants"}
        ]
    },
    "utilities": {
        "id": "utilities",
        "name": "Utilities",
        "icon": "wrench",
        "color": "from-zinc-500 to-slate-500",
        "subcategories": [
            {"id": "file-tools", "name": "File Tools"},
            {"id": "system-optimization", "name": "System Optimization"},
            {"id": "backup-recovery", "name": "Backup & Recovery"},
            {"id": "data-conversion", "name": "Data Conversion"},
            {"id": "qr-barcode", "name": "QR & Barcode Tools"},
            {"id": "network-tools", "name": "Network Tools"},
            {"id": "system-monitoring", "name": "System Monitoring"}
        ]
    },
    "travel-local": {
        "id": "travel-local",
        "name": "Travel & Local",
        "icon": "map-pin",
        "color": "from-green-500 to-teal-500",
        "subcategories": [
            {"id": "booking", "name": "Booking & Reservations"},
            {"id": "navigation", "name": "Navigation & Maps"},
            {"id": "local-services", "name": "Local Services"},
            {"id": "events-experiences", "name": "Events & Experiences"},
            {"id": "ride-sharing", "name": "Ride Sharing"},
            {"id": "travel-planning", "name": "Travel Planning"},
            {"id": "reviews-guides", "name": "Reviews & Guides"}
        ]
    },
    "sales-commerce": {
        "id": "sales-commerce",
        "name": "Sales & Commerce",
        "icon": "shopping-cart",
        "color": "from-amber-500 to-orange-500",
        "subcategories": [
            {"id": "lead-generation", "name": "Lead Generation"},
            {"id": "funnels-pipelines", "name": "Funnels & Pipelines"},
            {"id": "affiliate-tools", "name": "Affiliate Tools"},
            {"id": "digital-products", "name": "Digital Products"},
            {"id": "marketplaces", "name": "Marketplaces"},
            {"id": "checkout-payments", "name": "Checkout & Payments"},
            {"id": "order-management", "name": "Order Management"}
        ]
    },
    "community-social": {
        "id": "community-social",
        "name": "Community & Social Impact",
        "icon": "users",
        "color": "from-blue-500 to-indigo-500",
        "subcategories": [
            {"id": "social-networks", "name": "Social Networks"},
            {"id": "creator-communities", "name": "Creator Communities"},
            {"id": "fundraising", "name": "Fundraising & Giving"},
            {"id": "non-profits", "name": "Non-Profits"},
            {"id": "volunteering", "name": "Volunteering"},
            {"id": "advocacy", "name": "Advocacy Platforms"},
            {"id": "faith-values", "name": "Faith & Values"}
        ]
    },
    "experimental": {
        "id": "experimental",
        "name": "Experimental & Emerging",
        "icon": "flask",
        "color": "from-fuchsia-500 to-purple-500",
        "subcategories": [
            {"id": "beta-apps", "name": "Beta Apps"},
            {"id": "ai-experiments", "name": "AI Experiments"},
            {"id": "web3-experiments", "name": "Web3 Experiments"},
            {"id": "labs-prototypes", "name": "Labs & Prototypes"},
            {"id": "early-access", "name": "Early Access"},
            {"id": "research-tools", "name": "Research Tools"}
        ]
    }
}

# Available tags for apps
APP_TAGS = [
    {"id": "ai", "name": "AI", "color": "purple"},
    {"id": "web3", "name": "Web3", "color": "indigo"},
    {"id": "no-code", "name": "No-Code", "color": "blue"},
    {"id": "privacy-first", "name": "Privacy-First", "color": "slate"},
    {"id": "rewards-enabled", "name": "Rewards-Enabled", "color": "amber"},
    {"id": "open-source", "name": "Open Source", "color": "green"},
    {"id": "enterprise", "name": "Enterprise", "color": "cyan"},
    {"id": "free-tier", "name": "Free Tier", "color": "emerald"},
    {"id": "mobile-first", "name": "Mobile-First", "color": "pink"},
    {"id": "api-available", "name": "API Available", "color": "orange"}
]

# Featured collections (dynamic views)
FEATURED_COLLECTIONS = [
    {"id": "trending", "name": "Trending Apps", "icon": "trending-up", "color": "cyan"},
    {"id": "new-noteworthy", "name": "New & Noteworthy", "icon": "sparkles", "color": "purple"},
    {"id": "staff-picks", "name": "Staff Picks", "icon": "star", "color": "amber"},
    {"id": "made-for-creators", "name": "Made for Creators", "icon": "palette", "color": "pink"},
    {"id": "built-for-business", "name": "Built for Business", "icon": "briefcase", "color": "blue"},
    {"id": "ai-powered", "name": "AI-Powered", "icon": "brain", "color": "violet"},
    {"id": "privacy-focused", "name": "Privacy-First", "icon": "shield", "color": "slate"},
    {"id": "decentralized", "name": "Decentralized", "icon": "hexagon", "color": "indigo"}
]


@router.get("")
async def get_all_categories():
    """Get all app categories with subcategories"""
    categories = []
    for cat_id, cat_data in APP_CATEGORIES.items():
        # Get app count for this category from database
        count = await db.app_submissions.count_documents({
            "status": "approved",
            "$or": [
                {"category_id": cat_id},
                {"categories": {"$elemMatch": {"category_id": cat_id}}}
            ]
        })
        
        categories.append({
            **cat_data,
            "app_count": count
        })
    
    return categories


@router.get("/tags")
async def get_all_tags():
    """Get all available tags"""
    return APP_TAGS


@router.get("/collections")
async def get_featured_collections():
    """Get featured collection definitions"""
    return FEATURED_COLLECTIONS


@router.get("/{category_id}")
async def get_category_detail(category_id: str):
    """Get detailed info about a specific category"""
    if category_id not in APP_CATEGORIES:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = APP_CATEGORIES[category_id]
    
    # Get subcategory counts
    subcategories_with_counts = []
    for sub in category["subcategories"]:
        count = await db.app_submissions.count_documents({
            "status": "approved",
            "$or": [
                {"subcategory_id": sub["id"]},
                {"categories": {"$elemMatch": {"subcategory_id": sub["id"]}}}
            ]
        })
        subcategories_with_counts.append({**sub, "app_count": count})
    
    return {
        **category,
        "subcategories": subcategories_with_counts
    }


@router.get("/{category_id}/apps")
async def get_apps_by_category(
    category_id: str,
    subcategory_id: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated tag IDs
    sort_by: Optional[str] = "popularity",  # popularity, revenue, price, newest
    page: int = 1,
    limit: int = 20
):
    """Get apps in a specific category with optional filters"""
    if category_id not in APP_CATEGORIES:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Build query
    query = {
        "status": "approved",
        "$or": [
            {"category_id": category_id},
            {"categories": {"$elemMatch": {"category_id": category_id}}}
        ]
    }
    
    if subcategory_id:
        query["$or"] = [
            {"subcategory_id": subcategory_id},
            {"categories": {"$elemMatch": {"subcategory_id": subcategory_id}}}
        ]
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    # Sorting
    sort_map = {
        "popularity": [("active_nodes", -1)],
        "revenue": [("revenue_per_node", -1)],
        "price": [("monthly_subscription_fee", 1)],
        "newest": [("created_at", -1)]
    }
    sort_order = sort_map.get(sort_by, [("active_nodes", -1)])
    
    # Execute query
    skip = (page - 1) * limit
    apps = await db.app_submissions.find(
        query,
        {"_id": 0}
    ).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    
    total = await db.app_submissions.count_documents(query)
    
    return {
        "apps": apps,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/collection/{collection_id}")
async def get_collection_apps(
    collection_id: str,
    page: int = 1,
    limit: int = 20
):
    """Get apps for a specific featured collection"""
    query = {"status": "approved"}
    sort_order = [("created_at", -1)]
    
    if collection_id == "trending":
        query["is_trending"] = True
        sort_order = [("active_nodes", -1)]
    elif collection_id == "new-noteworthy":
        query["is_new"] = True
        sort_order = [("created_at", -1)]
    elif collection_id == "staff-picks":
        query["staff_pick"] = True
    elif collection_id == "made-for-creators":
        query["$or"] = [
            {"category_id": "design-creativity"},
            {"tags": {"$in": ["content-creation"]}}
        ]
    elif collection_id == "built-for-business":
        query["$or"] = [
            {"category_id": "business-finance"},
            {"tags": {"$in": ["enterprise"]}}
        ]
    elif collection_id == "ai-powered":
        query["$or"] = [
            {"category_id": "artificial-intelligence"},
            {"tags": {"$in": ["ai"]}}
        ]
    elif collection_id == "privacy-focused":
        query["tags"] = {"$in": ["privacy-first"]}
    elif collection_id == "decentralized":
        query["$or"] = [
            {"category_id": "web3-blockchain"},
            {"tags": {"$in": ["web3"]}}
        ]
    else:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    skip = (page - 1) * limit
    apps = await db.app_submissions.find(
        query,
        {"_id": 0}
    ).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    
    total = await db.app_submissions.count_documents(query)
    
    return {
        "apps": apps,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/search/apps")
async def search_apps(
    q: str,
    categories: Optional[str] = None,  # Comma-separated category IDs
    tags: Optional[str] = None,  # Comma-separated tag IDs
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "relevance",
    page: int = 1,
    limit: int = 20
):
    """Search apps across all categories"""
    query = {
        "status": "approved",
        "$or": [
            {"app_name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    }
    
    if categories:
        cat_list = [c.strip() for c in categories.split(",")]
        query["$and"] = query.get("$and", [])
        query["$and"].append({
            "$or": [
                {"category_id": {"$in": cat_list}},
                {"categories": {"$elemMatch": {"category_id": {"$in": cat_list}}}}
            ]
        })
    
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        query["tags"] = {"$in": tag_list}
    
    if min_price is not None:
        query["monthly_subscription_fee"] = {"$gte": min_price}
    
    if max_price is not None:
        if "monthly_subscription_fee" in query:
            query["monthly_subscription_fee"]["$lte"] = max_price
        else:
            query["monthly_subscription_fee"] = {"$lte": max_price}
    
    # Sorting
    sort_map = {
        "relevance": [("featured", -1), ("active_nodes", -1)],
        "popularity": [("active_nodes", -1)],
        "revenue": [("revenue_per_node", -1)],
        "price_low": [("monthly_subscription_fee", 1)],
        "price_high": [("monthly_subscription_fee", -1)],
        "newest": [("created_at", -1)]
    }
    sort_order = sort_map.get(sort_by, [("active_nodes", -1)])
    
    skip = (page - 1) * limit
    apps = await db.app_submissions.find(
        query,
        {"_id": 0}
    ).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    
    total = await db.app_submissions.count_documents(query)
    
    return {
        "apps": apps,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "query": q
    }
