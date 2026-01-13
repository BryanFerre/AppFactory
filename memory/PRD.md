# NAPP Node Operator Dashboard - Product Requirements Document

## Original Problem Statement
Design and implement the NAPP Node Operator Dashboard for a decentralized blockchain product called the NAPP Node, built on Optio Blockchain Cloud. The dashboard enables non-technical, entrepreneurial users to operate a licensed node as a recurring-revenue micro hosting business.

## Business Model (Refined)
- **USD Revenue**: Node operators earn USD from subscribers using apps hosted on their node
- **OPT Rewards**: Earned through two referral programs:
  1. Referring new node operators (50 OPT per signup)
  2. Driving user signups to hosted apps (2 OPT per user)

## User Personas
- **Primary User**: Non-technical entrepreneurs operating blockchain nodes as micro-businesses
- **Use Case**: 5-10 minute daily check-ins to monitor earnings and node health
- **Goals**: Maximize passive income (USD), grow OPT rewards through promotion, maintain node health

## Core Requirements (Static)
1. JWT-based authentication (email/password) - 2FA planned
2. Real-time node health monitoring (CPU, memory, storage, latency)
3. Dual earnings visibility: USD (subscriptions) + OPT (referrals)
4. App Factory for discovering and installing revenue-generating apps
5. Referral tracking for both operator invites and app user signups
6. Promotion tools with shareable links per app
7. Payout tracking and tax-ready reports
8. AI-powered recommendations for optimization
9. Dark mode UI with glassmorphism design

## What's Been Implemented (January 2025)

### Backend (FastAPI + MongoDB)
- [x] JWT authentication (register, login, token verification)
- [x] Node stats and verification endpoints
- [x] Earnings tracking with USD (subscriptions) and OPT (rewards)
- [x] Installed apps with revenue_usd, signups_driven, opt_rewards_earned
- [x] App Factory with install/uninstall functionality
- [x] Referral system tracking:
  - Operator referrals (invites sent, signups, OPT earned)
  - App user signups (clicks, signups, OPT earned)
- [x] Promotion stats with per-app share links
- [x] Capacity monitoring and usage tracking
- [x] Payouts history
- [x] AI recommendations (GPT-5.2 integration)
- [x] **App Developer submission system (January 13, 2025)**:
  - Submit app API (/api/developer/submit)
  - Get submissions API (/api/developer/submissions)
  - Icon/code upload endpoints
  - Featured listing checkout with Stripe ($29/30 days, $59/60 days)
  - Featured apps API for App Factory display

### Frontend (React + Tailwind + Shadcn)
- [x] Dashboard with dual earnings display (USD + OPT)
- [x] Node Health widget
- [x] Revenue Trend chart (USD)
- [x] Installed Apps with signups driven and OPT rewards
- [x] Promotion Tools with:
  - Two reward types explained
  - Operator referral link
  - Per-app share links with signup tracking
  - Recent activity feed
- [x] All other pages (Earnings, Capacity, Payouts, Reports, etc.)
- [x] Branding update with new AppFactory logo (January 13, 2025):
  - Login page: Logo on branding panel
  - Register page: Logo on branding panel
  - Sidebar: Logo at top of navigation
  - App Factory page: Normal text header (no logo)
  - App Factory sidebar nav: Generic Factory icon
- [x] **App Developer page (January 13, 2025)**:
  - Nav item at bottom of sidebar
  - Stats cards (Total Submissions, Approved Apps, Featured Apps)
  - Submit New App form with all fields:
    * SVG icon upload
    * App Name, Description, Category
    * Resources Required (GB), Monthly Subscription Fee
    * Revenue Sharing %, Number of Nodes Available
    * GitHub URL or code file upload
    * Contact Email, Documentation URL
    * Terms of Service acceptance
  - Submissions list with status badges (Pending/Approved/Rejected)
  - Featured listing purchase dialog ($29/30 days, $59/60 days)
  - App Factory shows Featured Apps section (when apps are approved and featured)

### Integrations
- [x] CoinMarketCap API key configured
- [x] OpenAI GPT-5.2 for AI recommendations (Emergent LLM Key)
- [x] Stripe for featured listings payment (test keys configured)

### Admin Control Panel (January 13, 2025) ✅ COMPLETE
- [x] **Admin Authentication** - Separate JWT auth for admins with role-based permissions
- [x] **Admin Dashboard** - Overview with stats (users, nodes, apps, support tickets, revenue)
- [x] **Users & Accounts** - List users, search, filter by status, suspend/reinstate actions
- [x] **NAPP Nodes** - Node health monitoring, filter by status, capacity/uptime display
- [x] **App Submissions Management** - Full review workflow:
  - List all submissions with search and status filtering
  - View submission details modal with full app info
  - Review dialog with Approve/Reject/Request Changes actions
  - Compliance notes for internal documentation
  - Review history tracking per submission
  - Audit logging for all admin actions
- [x] **Billing & Payments** - Transaction listing, revenue stats, payment status tracking
- [x] **Customer Support** - Ticket management, status updates, response workflow
- [x] **Revenue & Payouts** - Revenue analytics by category, top apps, payout tracking
- [x] **Reports & Exports** - Generate reports (Users, Nodes, Apps, Revenue, Payouts) in CSV/PDF/XLSX
- [x] **System Logs & Audit** - Complete audit trail of admin actions with filtering
- [x] **Admin Settings** - Admin account management, create new admins, security settings
- [x] Admin credentials: `admin@optio.com` / `admin123`

## Prioritized Backlog

### P0 (Critical for Production)
- [x] ~~**Admin Dashboard** for app approval (approve/reject submitted apps)~~ ✅ COMPLETED
- [x] ~~**Full Admin Panel modules**~~ ✅ COMPLETED (Users, Nodes, Billing, Support, Revenue, Reports, Audit, Settings)
- [ ] Real blockchain wallet connection (MetaMask/WalletConnect)
- [x] ~~Actual referral link tracking system~~ ✅ COMPLETED
- [ ] Production node orchestration backend
- [ ] Stripe account setup (business name required for checkout)

### P1 (High Priority)
- [ ] Two-factor authentication (2FA)
- [ ] Email notifications for referral signups
- [ ] Export functionality (CSV/PDF reports)
- [ ] Real-time signup notifications
- [ ] App Factory filtering/sorting features

### P2 (Nice to Have)
- [ ] Dark/Light theme toggle
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Advanced analytics per referral source

## Technical Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Framer Motion
- **Backend**: FastAPI, Motor (async MongoDB), JWT, bcrypt
- **Database**: MongoDB (users, nodes, apps, earnings, payouts, referrals)
- **Integrations**: Emergent LLM (GPT-5.2), CoinMarketCap API

## Next Tasks
1. Add 2FA for security
2. Email notifications for referral events
3. Real export functionality (CSV/PDF reports)
4. Production blockchain integration

## Test Reports
- `/app/test_reports/iteration_3.json` - Admin App Submissions (15/15 tests passed)
- `/app/test_reports/iteration_4.json` - All Admin Modules (24/24 backend + 100% frontend tests passed)
- `/app/test_reports/iteration_5.json` - Real Referral System (13/13 backend + 100% frontend tests passed)

## Known Limitations (MOCK DATA)
- Revenue data is mock-generated (not from real transactions)
- Node data is mock-generated (50 nodes with random health status)
- Support tickets and billing transactions are initially empty
- All backend data resets on server restart (except referral data now persisted)
