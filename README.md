# RJ Business Solutions — ITIN Multi-Language Funnel System

![RJ Business Solutions](https://media.rickjeffersonsolutions.com/rj-business-solutions-logo-banner.jpg)

**Built by RJ Business Solutions**
1342 NM 333, Tijeras, New Mexico 87059
[rickjeffersonsolutions.com](https://rickjeffersonsolutions.com)

---

## Project Overview

The **ITIN Multi-Language Funnel System** is a production-grade, multi-locale credit repair funnel supporting **5 languages** and **3 pricing tiers** — all in a single Cloudflare Pages deployment. Designed specifically for ITIN holders who have the **same federal credit dispute rights** as SSN holders under FCRA, ECOA, CROA, and FDCPA.

## Live URLs

| URL | Description |
|-----|-------------|
| **https://rj-itin-funnels.pages.dev** | Production (auto-detect language) |
| https://rj-itin-funnels.pages.dev/en | English Home |
| https://rj-itin-funnels.pages.dev/es | Spanish Home |
| https://rj-itin-funnels.pages.dev/pt | Portuguese Home |
| https://rj-itin-funnels.pages.dev/fr | French Home |
| https://rj-itin-funnels.pages.dev/ht | Haitian Creole Home |
| **GitHub:** https://github.com/rjbizsolution23-wq/rj-itin-funnels | Source Code |

## Funnel URLs by Locale and Plan

| Locale | Basic ($99) | Professional ($149) | Premium ($199) |
|--------|-------------|---------------------|----------------|
| English | /en/basic | /en/professional | /en/premium |
| Espanol | /es/basic | /es/professional | /es/premium |
| Portugues | /pt/basic | /pt/professional | /pt/premium |
| Francais | /fr/basic | /fr/professional | /fr/premium |
| Kreyol | /ht/basic | /ht/professional | /ht/premium |

## Features

### Languages (5)
- **English (EN)** — Default
- **Espanol (ES)** — 67M+ Latinos in US (2025), 43% un/underbanked
- **Portugues (PT)** — Brazilian ITIN community
- **Francais (FR)** — French-speaking ITIN holders
- **Kreyol Ayisyen (HT)** — Haitian Creole community

### Plans (3)
| Plan | Price | Disputes/Mo | Target | MFSN PID |
|------|-------|-------------|--------|----------|
| Basic | $99/mo | 15 | 1-5 negative items | 49914 |
| Professional | $149/mo | 25 | 6-15 negative items | 75497 |
| Premium | $199/mo | 40 | 16+ negative items | 30639 |

All plans include: Forensic 3-Bureau ITIN Audit, ITIN-Specific Restoration Roadmap, Monthly Progress Reports, Bilingual Support, Credit Building Library, 90-Day Money-Back Guarantee.

### Custom Image Assets (13 Total)

All custom visuals are served from verified-working sources (media CDN + local static):

| Asset | Dimensions | Usage |
|-------|-----------|-------|
| **Hero Banner (Multi-Ethnic Rick Master)** | 1365x768 (16:9) | Full-bleed hero background on all home + plan pages |
| **Federal Rights Badge Collection** | 1024x768 (4:3) | 6 shields (ECOA, FCRA, CROA, FDCPA, TSR, State Law) in rights sections |
| **Multi-Cultural Community Testimonials** | 1024x1024 (1:1) | Social proof grids with diverse client avatars |
| **Rick Jefferson Trust Bio Portrait** | 1024x1024 (1:1) | Anime-style founder portrait in bio sections |
| **ITIN vs SSN Equal Rights Comparison** | 1365x768 (16:9) | Split-screen equal rights visual in education sections |
| **Value Stack Grid (6 Icons)** | 1024x1024 (1:1) | Service deliverables in plan comparison sections |
| **90-Day Guarantee Seal** | 1024x1024 (1:1) | Circular trust badge in guarantee sections |
| **Multi-Language Support Five Flags** | 1365x768 (16:9) | 5-panel language support visual |
| **Company Logo** | Various | Navigation and footer branding |

**Image Sources (as of 2026-02-24):**
- `media.rickjeffersonsolutions.com` — Hero, testimonials, value stack, guarantee seal, logo (verified 200 OK)
- `/static/images/` — Federal badges, Rick portrait, ITIN vs SSN, multi-language flags (locally hosted)

### Core Components
- **LanguageSwitcher** — 5-language bar at top of every page with flag emojis
- **Hero with Background Banner** — Full-bleed multi-ethnic hero image with dark overlay
- **ITINRightsSection** — Federal badges image + ECOA, FCRA, CROA, FDCPA cards
- **ITIN vs SSN Comparison** — Visual equal-rights education section
- **RickJeffersonBio** — Founder portrait + bio card with credentials
- **Testimonials Grid** — Multi-cultural client success story images
- **Value Stack Visual** — Icon-based service deliverables grid
- **CommunityProof** — 10K+ served, 67M Latinos, 43% underbanked, 34% biz growth
- **ITINFAQAccordion** — 6 common questions with toggle answers
- **Guarantee Section** — 90-day seal image with refund policy
- **Multi-Language Flags** — 5-flag visual showing language support
- **ComplianceFooter** — CROA, FCRA, ECOA, FDCPA, TSR/CFPB, Identity Policy grid

### Technical
- Auto-locale detection via `Accept-Language` header
- HTML `lang` attribute switches per locale (en, es, pt, fr, ht)
- Hero background images with CSS gradient overlays for text readability
- Responsive image grids (testimonials, rights badges) with hover effects
- Lead capture modal with plan-specific pricing
- Stripe Checkout integration (per-plan amount)
- MyFreeScoreNow affiliate links per plan tier (PID 49914, 75497, 30639)
- `/api/health`, `/api/leads`, `/api/checkout` endpoints
- Lazy loading on all below-fold images for performance

## Compliance

| Statute | Citation | Description |
|---------|----------|-------------|
| CROA | 15 U.S.C. 1679 | Written contracts, 3-day cancel, no advance fees |
| FCRA | 15 U.S.C. 1681 | 611, 623, 605 dispute rights - same for ITIN |
| ECOA | 15 U.S.C. 1691 | National-origin discrimination prohibited |
| FDCPA | 15 U.S.C. 1692 | Debt validation rights, no ITIN discrimination |
| FCBA | 15 U.S.C. 1666 | Fair Credit Billing Act |
| FTC TSR | 16 CFR Part 310 | No advance fees for credit repair services |
| CFPB | Regulation V, F | Bureau dispute and collection procedures |

## Tech Stack

- **Framework:** Hono v4 (Cloudflare Workers)
- **Deployment:** Cloudflare Pages
- **Frontend:** Vanilla HTML/CSS/JS with Inter font
- **Payments:** Stripe Checkout API
- **Monitoring:** MyFreeScoreNow API (PID per plan)
- **Images:** 4 local static + 5 media.rickjeffersonsolutions.com CDN (0 GenSpark dependencies)
- **Build:** Vite SSR -> `dist/_worker.js` (103KB)

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
MFSN_API_BASE=https://api.myfreescorenow.com/api
MFSN_EMAIL=rickjefferson@rickjeffersonsolutions.com
MFSN_PASSWORD=...
MFSN_AID=RickJeffersonSolutions
MFSN_PID=49914
MFSN_AFFILIATE_URL_PRIMARY=https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=49914
MFSN_AFFILIATE_URL_NO_TRIAL=https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=75497
MFSN_AFFILIATE_URL_PREMIUM=https://myfreescorenow.com/enroll/?AID=RickJeffersonSolutions&PID=30639
```

## Development

```bash
npm install
npm run build
npx wrangler pages dev dist --ip 0.0.0.0 --port 3000
```

## Deployment

```bash
npm run build
npx wrangler pages deploy dist --project-name rj-itin-funnels
```

## Status

- **Build:** Compiled (103KB worker)
- **Deployment:** Live on Cloudflare Pages
- **GitHub:** Pushed to rjbizsolution23-wq/rj-itin-funnels
- **20 routes tested:** All return HTTP 200
- **5 locale translations:** EN, ES, PT, FR, HT verified
- **3 plan pages:** $99, $149, $199 with correct pricing
- **html lang attribute:** Switches per locale
- **Language switcher:** 5 buttons on every page
- **Image assets:** All images verified working (0 GenSpark URLs — migrated 2026-02-24)
  - 4 locally hosted in `/static/images/` (federal badges, Rick portrait, ITIN vs SSN, flags)
  - 5 served from `media.rickjeffersonsolutions.com` CDN (hero, testimonials, value stack, guarantee, logo)
- **Hero banner:** Full-bleed background on home + plan pages
- **Rick portrait:** Professional trust bio portrait in bio sections
- **Testimonials:** Multi-cultural grid on home + plan pages
- **Federal badges:** 6-shield collection in rights sections
- **Guarantee seal:** 90-day circular trust badge
- **ITIN vs SSN:** Equal rights comparison visual
- **Value stack:** Icon-based service deliverables grid
- **Language flags:** 5-panel multi-language support visual

## Pending

- [ ] Connect live Stripe webhook for production payments
- [ ] Configure custom domain `rjbusinesssolutions.org`
- [ ] Add analytics (GA4, FB Pixel, TikTok Pixel)
- [ ] Complete QA/acceptance testing for all locales
- [ ] Final legal/compliance sign-off

---

**Contact:** Rick Jefferson | rjbizsolution23@gmail.com | [rickjeffersonsolutions.com](https://rickjeffersonsolutions.com)

**Last Updated:** February 24, 2026

**© 2026 RJ Business Solutions. All rights reserved.**
