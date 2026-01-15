# AppCloud by Optio - Product Requirements Document

## Original Problem Statement
Build a full-stack e-commerce and cloud platform named "AppCloud by Optio" with:
- Public-facing storefront for selling "Optio CloudNode" product
- User dashboard for managing purchased services
- Admin panel for platform management
- Complete e-commerce flow with Stripe inline payments
- Hybrid payment model: $7,500 one-time license + $29/month recurring subscription

## User Personas
1. **Node Operators** - Purchase CloudNodes to earn passive income
2. **Platform Admins** - Manage users, products, support tickets

## Core Requirements
- Landing page with product marketing
- Inline Stripe checkout (not redirect)
- Post-purchase account creation with password setting
- Auto-login after account creation
- User dashboard with node stats, earnings, apps
- Admin panel for full platform management
- Mobile responsive design for all viewports

---

## What's Been Implemented

### Session 1 (Previous)
- Core application structure (React + FastAPI + MongoDB)
- User authentication with JWT
- Admin panel with role-based access
- Product and coupon management
- Stripe integration for payments
- Email notifications via Resend
- Points system

### Session 2 (Current - January 15, 2025)

#### UAT Bug Fixes
1. **P0 - Post-Purchase Auto-Login** ✅
   - Users now automatically logged in after setting password
   - Direct redirect to dashboard

2. **P1 - App Submission Page Error** ✅
   - Fixed React error when rendering Pydantic validation errors
   - Created `/app/frontend/src/utils/errorUtils.js` utility
   - Updated error handling across all pages

3. **P2 - Daily Verification Button Removed** ✅
   - Removed deprecated button from Dashboard

4. **P2 - Contact Support Ticket Creation** ✅
   - Created `/app/backend/api/support.py` with ticket endpoints
   - Updated Support page with ticket form
   - Users can view their submitted tickets

5. **P2 - API Documentation Content** ✅
   - Added API docs to Support page
   - Documents `/api/external/points`, `/api/node/stats`, `/api/auth/login`

6. **P2 - Dark Mode Toggle Removed** ✅
   - Removed non-functional toggle from Settings

#### New Features
7. **Registration Flow Update** ✅
   - "Get Started" button now opens purchase modal
   - `/register` route redirects to `/?purchase=true`
   - Users must purchase to create account

8. **Hybrid Payment Model** ✅
   - Updated product pricing: $7,500 one-time + $29/month
   - Single payment collects license + first month ($7,529 total)
   - Stripe subscription created for recurring billing (starts after 30 days)
   - Updated purchase.py for hybrid payment flow

9. **Mobile Responsiveness** ✅
   - **Landing Page**: Hero section, pricing display, features grid
   - **Purchase Modal**: Full pricing breakdown, scrollable on mobile
   - **User Dashboard**: Bottom navigation bar (Dashboard, Apps, Earnings, Impact, More)
   - **Admin Dashboard**: Bottom navigation bar (Dashboard, Users, Products, Support, More)
   - **All Pages**: Responsive grids (2 cols mobile, 4 cols desktop)
   - Tested on iPhone (375px) and iPad (768px) viewports

---

## Pricing Structure
| Item | Price |
|------|-------|
| CloudNode License (one-time) | $7,500 |
| Monthly Service Fee | $29/month |
| **Total First Payment** | **$7,529** |

---

## Key Files Modified This Session
- `/app/frontend/src/pages/public/LandingPage.js` - Hero, pricing, mobile responsive
- `/app/frontend/src/components/layout/DashboardLayout.js` - Mobile bottom nav
- `/app/frontend/src/components/layout/AdminLayout.js` - Mobile bottom nav
- `/app/frontend/src/components/layout/PublicLayout.js` - Get Started → purchase modal
- `/app/frontend/src/pages/Dashboard.js` - Mobile responsive grids
- `/app/frontend/src/pages/admin/AdminDashboard.js` - Mobile responsive
- `/app/frontend/src/pages/Support.js` - Ticket creation + API docs
- `/app/frontend/src/utils/errorUtils.js` - Error message extraction utility
- `/app/backend/api/purchase.py` - Hybrid payment flow
- `/app/backend/api/support.py` - Support ticket API

---

## Prioritized Backlog

### P0 (Critical)
- None currently

### P1 (High Priority)
- OPT Point System explanation for new users
- Real-time notifications (WebSockets)

### P2 (Medium Priority)
- Production blockchain integration for license NFTs
- Advanced reporting features

### P3 (Nice to Have)
- Email verification on signup
- Password reset flow
- User profile photos

---

## Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@optio.com | admin123 |
| User (with apps) | demo@napp.io | demo123 |
| User (empty) | test@napp.io | test123 |

---

## Technology Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI, Framer Motion, Recharts
- **Backend**: FastAPI, Pydantic
- **Database**: MongoDB
- **Payments**: Stripe (inline checkout + subscriptions)
- **Email**: Resend
- **Auth**: JWT

---

## Testing Status
- **Iteration 14**: Mobile responsiveness - 100% pass rate
- All viewports tested: Mobile (375px), Tablet (768px), Desktop (1920px)
