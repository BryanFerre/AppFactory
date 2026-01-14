# AppCloud by Optio - Product Requirements Document

## Original Problem Statement
Build a full-stack application called "AppCloud by Optio" (formerly NAPP Node Operator Dashboard) that serves three main purposes:
1. **Node Operator Dashboard:** User-facing dashboard showing income, node health, and an "App Marketplace" for installing apps. Includes referral system, 2FA, and AI-powered promotional content generation.
2. **App Developer Portal:** Section for developers to submit applications to the App Marketplace, with Stripe integration for "featured" listings.
3. **Admin Control Panel:** Secure dashboard for Optio staff to manage users, nodes, app submissions, billing, accounting, and audit logs.

## Tech Stack
- **Frontend:** React, React Router, Axios, TailwindCSS, lucide-react, Shadcn UI
- **Backend:** FastAPI (Python), Pydantic, JWT authentication
- **Database:** MongoDB (persistent)
- **Integrations:** Stripe, CoinMarketCap, OpenAI (via emergentintegrations), Resend

## Architecture
```
/app/
├── backend/
│   ├── main.py              # Entry point, routers, lifespan
│   ├── server.py            # Legacy wrapper (imports from main.py)
│   ├── api/                  # Modular route files
│   │   ├── auth.py          # User auth & 2FA
│   │   ├── admin.py         # Admin routes
│   │   ├── accounting.py    # Commission approval & payouts (NEW)
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
│       │   ├── admin/
│       │   │   └── AdminAccounting.js  # Commission & payout management (NEW)
│       │   ├── AppMarketplace.js
│       │   ├── AppDetails.js
│       │   └── InstalledApps.js
│       └── components/      # Reusable components
└── tests/
    ├── test_api.py
    └── test_admin_accounting.py  # 22 tests (NEW)
```

## What's Been Implemented

### Date: January 14, 2026 (Current Session)

- ✅ **COMPLETED: User Activity Points System - Phase 1 (Backend Core)**
  - **Points Engine Service** (`/app/backend/services/points_engine.py`):
    - Event-driven points awarding
    - Idempotent processing (prevents double-awarding)
    - Cooldown enforcement (none, daily, weekly, monthly, once)
    - Login streak tracking with milestone detection
    - Tier calculation (Starter → Builder → Contributor → Champion → Legend)
    - Points reversal support
    - Leaderboard generation
  - **Activity API** (`/app/backend/api/activity.py`):
    - `GET /api/activity/summary` - User's points summary with tier info
    - `GET /api/activity/history` - Paginated activity history
    - `GET /api/activity/actions` - All available actions by category
    - `GET /api/activity/streak` - Login streak with milestone progress
    - `GET /api/activity/leaderboard` - Top users by points
    - `GET /api/activity/tiers` - Tier definitions
    - `POST /api/activity/event` - Award points for actions
    - `POST /api/activity/internal/award` - Internal service-to-service
  - **Admin Activity API**:
    - `GET /api/admin/activity/stats` - System-wide stats
    - `GET /api/admin/activity/actions` - Full action config
    - `PUT /api/admin/activity/actions/{id}` - Update action config
    - `POST /api/admin/activity/reverse` - Reverse points
    - `GET /api/admin/activity/user/{id}/summary` - User lookup
  - **Action Catalog** (60+ actions across 10 tiers):
    - Tier 1: Ecosystem-Defining (1,000-5,000 pts)
    - Tier 2: Growth & Distribution (250-1,000 pts)
    - Tier 3: Revenue & Monetization (200-1,500 pts)
    - Tier 4: Builder & Developer (150-750 pts)
    - Tier 5: Node Operations (100-600 pts)
    - Tier 6: Community & Ambassador (100-750 pts)
    - Tier 7: Feedback & Quality (75-250 pts)
    - Tier 8: Engagement & Consistency (25-300 pts)
    - Tier 9: Milestones & Achievements (300-2,000 pts)
    - Tier 10: Long-Term Impact (1,000-5,000 pts)
  - **Integration with existing actions**:
    - Daily login awards 25 pts (with toast notification on login)
    - Registration/onboarding awards 200 pts
    - App installation awards 250 pts + milestone bonuses
    - Referral signups award 500 pts
    - App submissions award 200 pts
  - **Admin Points Configuration Panel** (`/admin/points-config`):
    - View all 60+ actions grouped by category
    - Enable/disable individual actions
    - Edit point values and cooldowns
    - System stats: total points issued, users with points, total events
    - Tier distribution view
  - **Points Notifications**:
    - Toast notification on login showing points earned
    - Real-time points notification component
  - **Database Collections**:
    - `activity_actions` - Configurable action catalog
    - `activity_events` - Raw event log (idempotent)
    - `activity_points_ledger` - Immutable append-only ledger
    - `user_points_summary` - Cached totals per user
    - `user_login_streaks` - Streak tracking

- ✅ **COMPLETED: Admin Accounting Executive Dashboard**
  - **Commission Management:**
    - Node sale commissions: 5% of $5,000 node price = $250 per referral
    - View pending/approved/paid/rejected commissions
    - Single and bulk approve/reject actions
    - Mark approved commissions as paid
    - Audit logging for all commission actions
  - **App Earnings Payouts:**
    - View pending/processing/paid/rejected payouts
    - App earnings breakdown per user
    - Single and bulk process/reject actions
    - Complete payout (mark as paid) workflow
  - **Dashboard Stats:**
    - Pending commissions count and amount
    - Approved awaiting payment count
    - Pending app payouts count and amount
    - Paid this month total
  - **UI Features:**
    - Commissions tab with Node Sale (5%) badges
    - App Earnings tab with app breakdown
    - Status filter dropdown
    - Search by user
    - Bulk selection and actions
    - Seed Demo Data button for testing
  - **Testing:** 22/22 backend tests + 17/17 frontend checks passed

- ✅ **Backend Refactoring Complete** (Previous session)
  - Migrated from monolithic server.py to modular architecture
  - Created 12 separate route modules under `/app/backend/api/`
  - All API endpoint tests passing (100%)

- ✅ **App Marketplace Enhancements** (Previous session)
  - Sort by: Revenue, Subscribers, Price, Popularity, Capacity
  - Advanced filters: Minimum Revenue, Maximum Capacity
  - App comparison: Select up to 3 apps for side-by-side comparison
  - Resource billing in install modal with net revenue calculation

- ✅ **Share & Promote Feature** (Previous session)
  - Share link and AI-generated social posts for installed apps
  - One-click sharing to X, Facebook, LinkedIn, Parler

### Previously Completed
- ✅ **Admin Control Panel:** All 11 admin modules (including Accounting)
- ✅ **Referral System:** Backend for tracking codes, clicks, signups, OPT rewards
- ✅ **2FA Authentication:** TOTP-based 2FA for user and admin accounts
- ✅ **Email Notifications:** Resend integration
- ✅ **AI Promotional Content:** LLM-powered social media post generation
- ✅ **Full Rebranding:** NAPP → AppCloud
- ✅ **MongoDB Persistence:** All data persisted

## Key API Endpoints

### Admin Accounting (NEW)
- `GET /api/admin/accounting/dashboard` - Accounting dashboard stats
- `GET /api/admin/accounting/commissions` - List all commissions (with status filter)
- `GET /api/admin/accounting/commissions/{id}` - Get commission detail
- `POST /api/admin/accounting/commissions/{id}/action` - Approve/reject commission
- `POST /api/admin/accounting/commissions/{id}/pay` - Mark commission as paid
- `POST /api/admin/accounting/commissions/bulk-action` - Bulk approve/reject
- `GET /api/admin/accounting/payouts` - List all payouts (with status filter)
- `GET /api/admin/accounting/payouts/{id}` - Get payout detail
- `POST /api/admin/accounting/payouts/{id}/action` - Process/reject payout
- `POST /api/admin/accounting/payouts/bulk-action` - Bulk process/reject
- `POST /api/admin/accounting/seed-demo-data` - Generate test data

### Other Key Endpoints
- `POST /api/auth/login` - User login with optional 2FA
- `POST /api/auth/register` - User registration with referral tracking
- `GET /api/node/stats` - Node health and performance
- `GET /api/earnings` - USD earnings and OPT rewards
- `GET /api/apps/installed` - User's installed apps
- `GET /api/apps/available` - App Marketplace catalog
- `POST /api/admin/auth/login` - Admin login

## Test Credentials
- **User:** dev@test.io / devpass123
- **Admin:** admin@optio.com / admin123

## Business Rules

### Commission Types
1. **Node Sale Commission:** 5% of node price ($5,000 × 5% = $250) when a referral buys a node
2. **App Earnings:** Variable amounts from fees earned by installed apps

### Commission Workflow
1. Commission created → Status: `pending`
2. Admin approves → Status: `approved` (awaiting payment)
3. Admin marks paid → Status: `paid` (completed)
4. OR Admin rejects → Status: `rejected` (closed)

### Payout Workflow
1. Payout request created → Status: `pending`
2. Admin processes → Status: `processing`
3. Admin completes → Status: `paid`
4. OR Admin rejects → Status: `rejected`

## Known Issues
- **P2:** Stripe account requires user to configure test business details

## Upcoming Tasks (P1)
- **PDF/CSV export** for Admin Reports
- **OPT Point System** explanation UI and backend logic

## Future Tasks (P2)
- Real-time notifications via WebSockets
- Production blockchain integration

## Preview URL
https://appmarketplace-1.preview.emergentagent.com
