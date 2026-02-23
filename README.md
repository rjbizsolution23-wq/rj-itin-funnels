# Clean It Up — Precision Credit Repair Funnel (Basic Plan)

![RJ Business Solutions](https://storage.googleapis.com/msgsndr/qQnxRHDtyx0uydPd5sRl/media/67eb83c5e519ed689430646b.jpeg)

**Built by RJ Business Solutions**
1342 NM 333, Tijeras, New Mexico 87059
[rickjeffersonsolutions.com](https://rickjeffersonsolutions.com)

---

## Project Overview

- **Name**: Clean It Up Funnel
- **Type**: Conversion-Optimized Credit Repair Funnel (Basic Plan)
- **Goal**: Convert visitors with 1-5 negative credit items into paying clients through a high-conversion, federally compliant sales funnel
- **Target Audience**: Consumers with 1-5 negative items on their credit report

## Live URLs

- **Production**: [https://clean-it-up-funnel.pages.dev](https://clean-it-up-funnel.pages.dev)
- **GitHub**: [https://github.com/rjbizsolution23-wq/clean-it-up-funnel](https://github.com/rjbizsolution23-wq/clean-it-up-funnel)

## Completed Features

### Funnel Sections
- Hero Section with animated particles, countdown timer, urgency banner
- Problem Agitation Section (4 pain point cards)
- Value Stack Section (6 features, $872 value for $99/mo)
- 5-Step Process Walkthrough
- Federal Compliance Section (CROA, FCRA, FTC/CFPB)
- Final CTA with 90-Day Money-Back Guarantee
- Payment Success Page (`/success`)

### Backend (Fully Wired)
- **D1 Database** — Leads, payments, disputes, and activity log tables
- **Stripe Checkout** — $99 audit fee via Stripe Checkout Sessions API
- **Stripe Webhooks** — Payment confirmation handler with lead status updates
- **MyFreeScoreNow API** — Auth token, credit report retrieval integration
- **Lead Capture** — Persistent storage with duplicate detection and UTM tracking
- **Admin Dashboard API** — Stats (total leads, paid, revenue, conversion rate)
- **Activity Logging** — CROA-compliant audit trail for every action

### Frontend
- Modal lead capture form with 2-step post-submit flow (MFSN enrollment + Stripe checkout)
- Mobile sticky CTA bar
- Scroll animations (Intersection Observer)
- Zero framework overhead (pure HTML/CSS/JS)
- UTM parameter tracking

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/` | Main funnel page | Public |
| `GET` | `/success` | Post-payment success page | Public |
| `GET` | `/api/health` | Health check with service status | Public |
| `GET` | `/api/config` | Public config (Stripe key, MFSN URL) | Public |
| `POST` | `/api/leads` | Lead capture with D1 persistence | Public |
| `POST` | `/api/checkout` | Create Stripe Checkout Session | Public |
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler | Stripe |
| `GET` | `/api/leads/:email` | Get lead status by email | Internal |
| `GET` | `/api/admin/leads` | List all leads (most recent 100) | Internal |
| `GET` | `/api/admin/stats` | Dashboard stats | Internal |
| `POST` | `/api/mfsn/auth` | Get MFSN API auth token | Internal |
| `POST` | `/api/mfsn/report` | Fetch 3-bureau credit report | Internal |

## Tech Stack

- **Backend**: Hono v4 on Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Payments**: Stripe Checkout Sessions API (LIVE keys)
- **Credit Monitoring**: MyFreeScoreNow API (Affiliate PID: 49914)
- **Frontend**: Vanilla HTML/CSS/JS (zero framework overhead)
- **Icons**: Lucide Icons (CDN)
- **Fonts**: Inter (Google Fonts)
- **Hosting**: Cloudflare Pages (Global Edge)
- **Build**: Vite

## Data Architecture

### D1 Database Tables
- **leads** — Name, email, phone, plan, status, Stripe IDs, MFSN status, UTM tracking
- **payments** — Stripe payment records linked to leads
- **disputes** — Credit dispute tracking (bureau, FCRA section, status, response dates)
- **activity_log** — CROA-compliant audit trail for all actions

### Cloudflare Secrets (Production)
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY`
- `MFSN_API_BASE` / `MFSN_EMAIL` / `MFSN_PASSWORD` / `MFSN_AID` / `MFSN_PID`
- `MFSN_AFFILIATE_URL_PRIMARY`
- `COMPANY_NAME` / `COMPANY_EMAIL`
- `OPENAI_API_KEY`

## Pricing Structure

| Item | Cost | Frequency |
|------|------|-----------|
| Forensic Credit Audit | $99 | One-time (via Stripe) |
| MyFreeScoreNow Monitoring | $29.99 | Monthly (affiliate PID: 49914) |
| Basic Plan Service Fee | $99 | Monthly (only when progress is made) |

## Development

```bash
# Install dependencies
npm install

# Apply D1 migrations locally
npx wrangler d1 migrations apply clean-it-up-db --local

# Seed test data
npx wrangler d1 execute clean-it-up-db --local --file=./seed.sql

# Build
npm run build

# Start local dev server with D1
pm2 start ecosystem.config.cjs

# Deploy to production
npm run build && npx wrangler pages deploy dist --project-name clean-it-up-funnel

# Apply migrations to production
npx wrangler d1 migrations apply clean-it-up-db --remote
```

## Project Structure

```
clean-it-up-funnel/
  src/
    index.tsx              # Hono app: all API routes + funnel HTML + success page
  migrations/
    0001_initial_schema.sql  # D1 database schema (leads, payments, disputes, activity)
  seed.sql                 # Test data for local development
  .dev.vars                # Local environment secrets (NEVER committed)
  ecosystem.config.cjs     # PM2 configuration with D1
  wrangler.jsonc           # Cloudflare Pages config with D1 binding
  vite.config.ts           # Vite build config
  package.json             # Dependencies & scripts
```

## Recommended Next Steps

1. **Stripe Webhook Signature Verification** — Set `STRIPE_WEBHOOK_SECRET` with actual signing secret
2. **Email Automation** — SendGrid/Mailgun for lead follow-up sequences after form submit
3. **Admin Dashboard UI** — Frontend for `/api/admin/leads` and `/api/admin/stats`
4. **A/B Testing** — Headline/CTA variant testing
5. **Analytics Pixels** — GA4, Facebook Pixel, TikTok Pixel
6. **Exit-Intent Popup** — Discount offer on page exit
7. **Rate Limiting** — Protect API endpoints from abuse
8. **Admin Auth** — Protect admin endpoints with API key or JWT

## Contact

**Rick Jefferson**
- Email: rjbizsolution23@gmail.com
- LinkedIn: [in/rick-jefferson-314998235](https://linkedin.com/in/rick-jefferson-314998235)
- GitHub: [@rickjeffsolutions](https://github.com/rickjeffsolutions)
- Website: [rickjeffersonsolutions.com](https://rickjeffersonsolutions.com)

---

**Build Date**: February 23, 2026
**Platform**: Cloudflare Pages + D1 + Stripe
**Status**: LIVE
**Last Updated**: February 23, 2026

(c) 2025 RJ Business Solutions. All rights reserved.
Credit repair services performed in compliance with CROA, FCRA, and applicable state regulations.
