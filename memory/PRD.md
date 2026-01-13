# NAPP Node Operator Dashboard - Product Requirements Document

## Original Problem Statement
Design and implement the NAPP Node Operator Dashboard for a decentralized blockchain product called the NAPP Node, built on Optio Blockchain Cloud. The dashboard enables non-technical, entrepreneurial users to operate a licensed node as a recurring-revenue micro hosting business.

## User Personas
- **Primary User**: Non-technical entrepreneurs operating blockchain nodes as micro-businesses
- **Use Case**: 5-10 minute daily check-ins to monitor earnings and node health
- **Goals**: Maximize passive income, maintain node health, discover new revenue-generating apps

## Core Requirements (Static)
1. JWT-based authentication (email/password)
2. Real-time node health monitoring (CPU, memory, storage, latency)
3. Daily earnings visibility in OPT + USD
4. App Factory for discovering and installing revenue-generating apps
5. Promotion tools for referral marketing
6. Payout tracking and tax-ready reports
7. AI-powered recommendations for optimization
8. Dark mode UI with glassmorphism design

## What's Been Implemented (January 2025)

### Backend (FastAPI + MongoDB)
- [x] JWT authentication (register, login, token verification)
- [x] Node stats and verification endpoints
- [x] Earnings tracking with OPT price integration
- [x] Installed apps management (view, uninstall)
- [x] App Factory with available apps
- [x] App installation with capacity checking
- [x] Promotion stats and referral links
- [x] Capacity monitoring and usage tracking
- [x] Payouts history
- [x] AI recommendations (GPT-5.2 integration)
- [x] Notifications system

### Frontend (React + Tailwind + Shadcn)
- [x] Login/Register pages with branding
- [x] Dashboard with modular widget architecture
- [x] Node Health widget (uptime, CPU, memory, storage, latency)
- [x] Earnings Overview (today/week/month with charts)
- [x] Installed Apps cards with health indicators
- [x] App Factory with search, filters, and install flow
- [x] Promotion Tools with referral links
- [x] Capacity & Upgrades page
- [x] Payouts history page
- [x] Reports/Tax export page
- [x] Support page with FAQs
- [x] Settings page with notifications
- [x] Wallet page with balance and transactions
- [x] Responsive sidebar navigation
- [x] Dark mode glassmorphism design

### Integrations
- [x] CoinMarketCap API key configured (mock OPT price fluctuation)
- [x] OpenAI GPT-5.2 for AI recommendations (Emergent LLM Key)

## Prioritized Backlog

### P0 (Critical for Production)
- [ ] Real blockchain wallet connection (MetaMask/WalletConnect)
- [ ] Real OPT token price from CoinMarketCap
- [ ] Production node orchestration backend

### P1 (High Priority)
- [ ] Two-factor authentication (2FA)
- [ ] Email notifications for critical alerts
- [ ] More sophisticated AI recommendations
- [ ] Export functionality (CSV/PDF reports)

### P2 (Nice to Have)
- [ ] Dark/Light theme toggle
- [ ] Mobile app version
- [ ] Multi-language support
- [ ] Advanced analytics and charts
- [ ] Governance voting interface

## Technical Architecture
- **Frontend**: React 19, Tailwind CSS, Shadcn UI, Recharts, Framer Motion
- **Backend**: FastAPI, Motor (async MongoDB), JWT, bcrypt
- **Database**: MongoDB (users, nodes, apps, earnings, payouts)
- **Integrations**: Emergent LLM (GPT-5.2), CoinMarketCap API

## Next Tasks
1. Connect real blockchain wallet for payments
2. Implement 2FA for security
3. Add email notification system
4. Implement real export functionality
5. Add more AI-powered insights
