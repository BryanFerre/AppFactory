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

### Integrations
- [x] CoinMarketCap API key configured
- [x] OpenAI GPT-5.2 for AI recommendations (Emergent LLM Key)

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Real blockchain wallet connection (MetaMask/WalletConnect)
- [ ] Actual referral link tracking system
- [ ] Production node orchestration backend

### P1 (High Priority)
- [ ] Two-factor authentication (2FA)
- [ ] Email notifications for referral signups
- [ ] Export functionality (CSV/PDF reports)
- [ ] Real-time signup notifications

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
1. Implement real referral tracking with unique links
2. Add 2FA for security
3. Email notifications for referral events
4. Real export functionality
5. Production blockchain integration
