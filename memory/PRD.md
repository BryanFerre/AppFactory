# AppCloud by Optio - Product Requirements Document

## Original Problem Statement
Build a full-stack application called "AppCloud by Optio" (formerly NAPP Node Operator Dashboard) that serves three main purposes:
1. **Node Operator Dashboard:** User-facing dashboard showing income, node health, and an "App Factory" for installing apps. Includes referral system, 2FA, and AI-powered promotional content generation.
2. **App Developer Portal:** Section for developers to submit applications to the App Factory, with Stripe integration for "featured" listings.
3. **Admin Control Panel:** Secure dashboard for Optio staff to manage users, nodes, app submissions, billing, and audit logs.

## Tech Stack
- **Frontend:** React, React Router, Axios, TailwindCSS, lucide-react, Shadcn UI
- **Backend:** FastAPI (Python), Pydantic, JWT authentication
- **Database:** MongoDB (persistent)
- **Integrations:** Stripe, CoinMarketCap, OpenAI (via emergentintegrations), Resend

## Architecture (Post-Refactor)
```
/app/
├── backend/
│   ├── main.py              # Entry point, routers, lifespan
│   ├── server.py            # Legacy wrapper (imports from main.py)
│   ├── api/                  # Modular route files
│   │   ├── auth.py          # User auth & 2FA
│   │   ├── admin.py         # Admin routes
│   │   ├── apps.py          # Installed/available apps
│   │   ├── ai.py            # AI recommendations
│   │   ├── developer.py     # Developer portal
│   │   ├── earnings.py      # Earnings & payouts
│   │   ├── node.py          # Node stats
│   │   ├── promotion.py     # Promotion stats
│   │   ├── referral.py      # Referral system
│   │   ├── notifications.py # User notifications
│   │   └── webhooks.py      # Stripe webhooks
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── services/
│   │   ├── email.py         # Email notifications (Resend)
│   │   └── referral.py      # Referral processing
│   └── utils/
│       ├── auth.py          # Auth helpers, JWT, 2FA
│       ├── config.py        # Environment config
│       └── database.py      # MongoDB connection
├── frontend/
│   └── src/
│       ├── pages/           # React pages
│       └── components/      # Reusable components
└── tests/
    └── test_all_endpoints.py # Comprehensive API tests
```

## What's Been Implemented

### Date: January 14, 2026
- ✅ **MAJOR: Backend Refactoring Complete**
  - Migrated from monolithic 4000+ line server.py to modular architecture
  - Created 11 separate route modules under `/app/backend/api/`
  - Centralized utilities in `/app/backend/utils/`
  - Business logic in `/app/backend/services/`
  - All 33 API endpoint tests passing (100%)

- ✅ **App Factory Filtering & Comparison Features**
  - Sort by: Revenue, Subscribers, Price, Popularity, Capacity
  - Sort order: High to Low / Low to High
  - Advanced filters: Minimum Revenue ($0-$200+), Maximum Capacity (1-10 GB)
  - App comparison: Select up to 3 apps for side-by-side comparison
  - Active filter badges with quick remove
  - New API endpoints: `/api/apps/compare`, `/api/apps/categories`

- ✅ **Renamed App Factory → App Marketplace**
  - Updated navigation, page title, and all references
  - Changed route from `/app-factory` to `/app-marketplace`

- ✅ **Resource Billing in Install Modal**
  - Shows capacity-based monthly resource fee
  - Tiered pricing: Basic ($4.99/GB), Standard, Professional, Enterprise, Premium
  - Automatic billing to card on file notification
  - Net revenue calculation (Revenue - Resource Fee)
  - Comparison table now includes Resource Fee and Net Revenue columns

### Previously Completed
- ✅ **Admin Control Panel:** All 10 admin modules fully implemented
- ✅ **Referral System:** Backend for tracking codes, clicks, signups, OPT rewards
- ✅ **2FA Authentication:** TOTP-based 2FA for user and admin accounts
- ✅ **Email Notifications:** Resend integration for welcome, referral, 2FA emails
- ✅ **AI Promotional Content:** LLM-powered social media post generation
- ✅ **Full Rebranding:** NAPP → AppCloud across all components
- ✅ **MongoDB Persistence:** All data persisted to MongoDB

## Key API Endpoints
- `POST /api/auth/login` - User login with optional 2FA
- `POST /api/auth/register` - User registration with referral tracking
- `POST /api/auth/2fa/setup` - Initialize 2FA
- `GET /api/node/stats` - Node health and performance
- `GET /api/earnings` - USD earnings and OPT rewards
- `GET /api/apps/installed` - User's installed apps
- `GET /api/apps/available` - App Factory catalog
- `GET /api/apps/featured` - Featured apps
- `GET /api/referral/stats` - Referral statistics
- `GET /api/ai/recommendations` - AI-powered recommendations
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard/stats` - Admin dashboard overview

## Test Credentials
- **User:** dev@test.io / devpass123
- **Admin:** admin@optio.com / admin123

## Mocked Data (By Design)
- Admin node list (mock data)
- OPT price (mock with realistic variation ~$0.85)
- Admin revenue statistics
- Some admin dashboard counts

## Known Issues
- **P2:** Stripe account requires user to configure test business details

## Upcoming Tasks
- **P1:** PDF/CSV export for Admin Reports
- **P2:** Real-time notifications via WebSockets
- **P2:** Production blockchain integration

## Preview URL
https://nodeapp-control.preview.emergentagent.com
