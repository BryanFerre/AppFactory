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

- ✅ **COMPLETED: Points System Enhancements (January 14, 2026)**
  - **New Badges Added** (`/app/backend/services/badges_engine.py`):
    - "Top Node Operator" badge - special category, server icon, 1000 pts bonus
    - "Top Ambassador" badge - special category, megaphone icon, 1000 pts bonus
    - Both are special badges that require manual awarding
    - Total badges now: 23 across 6 categories
  - **Weekly/Monthly Leaderboards**:
    - `GET /api/activity/leaderboard/weekly` - Points earned this week
    - `GET /api/activity/leaderboard/monthly` - Points earned this month
    - Both include `period_start` timestamp
    - Frontend tabs: "All Time", "This Month", "This Week"
    - Category filter only visible for All Time view
  - **External API for Third-Party Apps** (`/api/external/activity/*`):
    - `GET /api/external/activity/points/export` - Export all user points data
      - Includes: user_id, name, email, wallet_address, total_points, tier, points_by_category, streaks
      - Pagination support: limit (default 1000), offset
    - `GET /api/external/activity/points/user/{user_id}` - Get specific user's points
      - Includes badges earned
    - `GET /api/external/activity/leaderboard/export?period=all|weekly|monthly` - Export leaderboard
    - No authentication required (designed for third-party consumption)
  - **Frontend Updates** (`/app/frontend/src/pages/Leaderboard.js`):
    - Three tabs: All Time (amber), This Month (cyan), This Week (emerald)
    - Period info display showing when period started
    - Automatic data refresh on tab switch
  - **Testing:** 26/26 backend tests + 11/11 frontend checks passed

- ✅ **COMPLETED: OPT Points Explanation UI (January 14, 2026)**
  - **New Page:** `/app/frontend/src/pages/HowToEarn.js` at route `/dashboard/how-to-earn`
  - **Features:**
    - User's current tier status with progress to next tier
    - Three tabs: Overview, All Actions, Tier System
    - Quick Start section with 5 easy first actions to earn points
    - "How It Works" 3-step explanation
    - Point Categories overview (10 categories with point ranges)
    - Login Streak Bonuses section (7/30/90/365 day milestones)
    - All Actions accordion showing every point-earning action with cooldowns
    - Tier Progression visual showing all 5 tiers with requirements
    - Tier Benefits explanation section
  - **Navigation:**
    - Added to sidebar navigation with Lightbulb icon
    - "How to Earn" button added to Proof of Impact page header
    - CTAs linking to Leaderboard and Proof of Impact pages

- ✅ **COMPLETED: Stripe Integration & Public Landing Page (January 14, 2026)**
  - **Stripe Integration:**
    - User-provided test keys configured in backend/.env
    - `POST /api/purchase/create-checkout` - Creates Stripe checkout session
    - `POST /api/purchase/verify` - Verifies purchase, creates user account + license
    - `POST /api/purchase/webhook` - Handles Stripe webhook events
    - Commission processing for referral purchases (5% = $250)
    - Coupon code support in checkout
  - **Product Pricing:**
    - Regular price: $7,500
    - Pre-launch sale price: $5,000
    - Monthly operation fee: $99/mo
    - Apps add to monthly cost
  - **Public Landing Page** (`/app/frontend/src/pages/public/LandingPage.js`):
    - **AppCloud logo** in header and footer
    - Hero section with "Own a Piece of the Decentralized Cloud" headline
    - "Pre-Launch Special" badge with sale pricing
    - Price display: $5,000 (crossed out $7,500) + $99/mo operation fee
    - Stats section (10,000+ Active Nodes, $2.5M+ Paid, 99.9% Uptime, 50+ Countries)
    - 6 Feature cards (Passive Income, Lifetime License, Zero Technical Skills, etc.)
    - "How It Works" section with 3 steps
    - Product details section with features list
    - Testimonials section
    - CTA sections with "Get Your CloudNode" buttons
    - Purchase modal with form (Name, Email, Referral Code, Coupon Code)
  - **Public Layout** (`/app/frontend/src/components/layout/PublicLayout.js`):
    - Main navigation with AppCloud logo and Sign In/Get Started buttons
    - Footer with brand, product links, and company links
    - Mobile responsive with hamburger menu
  - **Coupons & Sales System** (`/app/backend/api/coupons.py`):
    - `POST /api/coupons/validate` - Validate coupon for product
    - `GET /api/admin/coupons` - List all coupons (admin)
    - `POST /api/admin/coupons` - Create coupon with auto-generated code
    - `PUT /api/admin/coupons/{id}` - Update coupon
    - `DELETE /api/admin/coupons/{id}` - Delete/deactivate coupon
    - `GET /api/admin/coupons/stats/overview` - Coupon statistics
    - Supports: percentage or fixed discounts, usage limits, per-user limits, date validity, max discount caps
  - **Admin Coupons Page** (`/app/frontend/src/pages/admin/AdminCoupons.js`):
    - Stats cards: Total, Active, Usages, Discounts Given
    - Coupons table with code, name, discount, usage, validity, status
    - Create/Edit modal with full coupon options
    - Delete confirmation with soft/hard delete
    - Copy coupon code button
  - **Purchase Success Page** (`/app/frontend/src/pages/public/PurchaseSuccess.js`):
    - Verifies purchase with Stripe session ID
    - Auto-creates user account with random password
    - Issues lifetime license
    - Displays credentials and license key
    - "Go to Dashboard" CTA
  - **Product Management** (`/app/backend/api/products.py`):
    - Added: regular_price, monthly_fee, is_on_sale, sale_label fields
    - Default CloudNode auto-seeded with sale pricing
  - **Route Changes:**
    - `/` - Public landing page
    - `/dashboard/*` - Protected user dashboard
    - `/admin/coupons` - Admin coupons page
  - **Testing:** All features verified via screenshots

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

### Activity Points Endpoints (NEW)
- `GET /api/activity/leaderboard/weekly` - Weekly leaderboard with period info
- `GET /api/activity/leaderboard/monthly` - Monthly leaderboard with period info
- `GET /api/external/activity/points/export` - Export all user points (third-party API)
- `GET /api/external/activity/points/user/{user_id}` - Get user points (third-party API)
- `GET /api/external/activity/leaderboard/export?period=` - Export leaderboard (third-party API)

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

## Future Tasks (P2)
- Real-time notifications via WebSockets
- Production blockchain integration
- NFT license integration (make licenses transferable on blockchain)
- Additional landing page sections (Features, Pricing, About)

## External API Documentation

### Third-Party Points Data Access
External applications can access points data without authentication:

1. **Export All User Points:**
   ```
   GET /api/external/activity/points/export?limit=1000&offset=0
   ```
   Returns: user_id, name, email, wallet_address, total_points, tier, points_by_category, streaks

2. **Get Specific User Points:**
   ```
   GET /api/external/activity/points/user/{user_id}
   ```
   Returns: Full user points data including badges earned

3. **Export Leaderboard:**
   ```
   GET /api/external/activity/leaderboard/export?period=all|weekly|monthly&limit=100
   ```
   Returns: Ranked leaderboard with wallet addresses for token distribution

## Preview URL
https://appcloud-fixes.preview.emergentagent.com
