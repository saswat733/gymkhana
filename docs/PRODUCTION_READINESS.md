# GymKhana — Production Readiness & Deployment Plan

**Last updated:** 2026-06-20  
**Audience:** Founders, engineers, DevOps  
**Related:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) · [IMPLEMENTATION_ROADMAP_60D.md](./IMPLEMENTATION_ROADMAP_60D.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [FEATURES.md](./FEATURES.md) · [SYSTEM_GAPS_AND_ISSUES.md](./SYSTEM_GAPS_AND_ISSUES.md) · [SAAS_ROADMAP.md](./SAAS_ROADMAP.md)

---

## 1. Executive summary

GymKhana is **feature-rich for a single gym or early SaaS pilot**, but **not production-deployed yet**. There is no Docker/CI, no `eas.json`, email is console-only, and **member online payments are not implemented** (subscriptions can be created without collecting money).

| Layer | Dev maturity | Production gap |
|-------|--------------|----------------|
| Backend API | Strong | Hosting, HTTPS, secrets, email provider, webhook URL, backups |
| Admin portal | Strong UX | Static host + env, custom domain per gym (white-label) |
| Mobile app | Good product | EAS build, store listing, prod `EXPO_PUBLIC_API_URL`, no Razorpay checkout |
| Platform billing (gym → GymKhana) | ~80% | Razorpay exists; needs live keys + public webhook |
| Member billing (member → gym) | ~20% | Manual admin record only; **no gateway flow** |

**Recommended path:** Ship in **4 waves** — infra → platform payments → member payments → store + polish.

---

## 2. What works today (do not rebuild)

### Backend
- Multi-tenant (`gym_id`, JWT `gymId`, `requireTenant`)
- Roles + permissions (owner, admin, manager, receptionist, trainer, member)
- Gym onboarding (`POST /gyms/onboard`)
- Operations: members, plans, subscriptions, attendance (gym QR + manual), payments (manual), GST member invoices (PDF)
- SaaS: plans, gym subscription, invoices, usage limits, `requirePlatformAccess` (partial)
- Razorpay: SaaS invoice orders + webhook handler (`/webhooks/razorpay`)
- Leads CRM, trials, freeze, retention rules (API), family groups + staff shifts (API)
- Jobs: subscription expiry, reminders, push (Expo tokens)

### Admin portal
- Operations Center, member workspace, command palette, grouped nav
- Billing page (Razorpay checkout for SaaS invoices)
- QR setup, leads, retention, analytics, settings (GST / white-label)

### Mobile app
- 4-tab UX (Home, Activity, Pass, You), light/dark theme
- Gym QR check-in, membership pass, plans (subscribe without payment), engagement stats
- Dev API auto-detect from Metro host (no daily LAN IP in `.env`)

---

## 3. Remaining work (prioritized)

### P0 — Must have before any paying customer

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Production hosting (API + DB) | ❌ | No Dockerfile/CI today |
| 2 | HTTPS + public API domain | ❌ | Required for Razorpay webhook + mobile |
| 3 | Production env secrets | ❌ | JWT, DB, Razorpay live keys |
| 4 | Razorpay webhook on public URL | ⚠️ | Code exists; needs deploy + `RAZORPAY_WEBHOOK_SECRET` |
| 5 | Real email provider | ❌ | Only `EMAIL_PROVIDER=console` |
| 6 | Admin portal production build | ❌ | `vite build` → Vercel/Netlify/S3 |
| 7 | Mobile production API URL | ❌ | `EXPO_PUBLIC_API_URL=https://api.yourdomain.com/api/v1` |
| 8 | EAS Build + store binaries | ❌ | No `eas.json`; Expo Go is dev-only |
- [ ] **Member payment gateway** | ⚠️ Backend + mobile wired; needs Razorpay keys + EAS build for live checkout |
| 10 | CORS lockdown | ⚠️ | Dev allows `*`; prod must list admin + API origins |
| 11 | DB backups + migration runbook | ❌ | |

### P1 — Should have for credible SaaS

| # | Item | Status |
|---|------|--------|
| 12 | `requirePlatformAccess` on all tenant routes | ⚠️ Partial (members/trainers only) |
| 13 | Retention rule cron (not manual run) | ⚠️ API only |
| 14 | Admin UI: family groups, staff shifts | ❌ API exists |
| 15 | Automated tenant isolation tests | ❌ |
| 16 | CI: lint + `npm test` on PR | ❌ |
| 17 | Error monitoring (Sentry) | ❌ |
| 18 | Redis in prod (optional) | ⚠️ Falls back to memory |

### P2 — Growth & polish

| # | Item | Status |
|---|------|--------|
| 19 | Razorpay Route / per-gym connected accounts | ❌ |
| 20 | WhatsApp notifications | ❌ |
| 21 | Staff scanner app (dedicated) | ❌ |
| 22 | Custom domain white-label (gym admin URL) | ⚠️ Fields in DB; DNS not automated |
| 23 | Privacy policy + Terms + GST compliance copy | ❌ |

---

## 4. Deployment architecture

### Recommended stack (India, cost-conscious)

```
                    ┌─────────────────┐
                    │   Cloudflare    │  DNS + TLS (optional WAF)
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  admin.gymkhana.in   api.gymkhana.in      (stores)
  Vercel / Netlify    Railway / Render      Play + App Store
  (static Vite)       or VPS + PM2          (EAS Build)
                             │
                             ▼
                    ┌─────────────────┐
                    │  Managed MySQL   │  PlanetScale alt: RDS / DO Managed DB
                    └─────────────────┘
                             │
                    ┌─────────────────┐
                    │ Razorpay webhook │  POST https://api.gymkhana.in/api/v1/webhooks/razorpay
                    └─────────────────┘
```

### Alternative: single VPS (DigitalOcean / AWS Lightsail)

- Nginx reverse proxy → Node `:4000`
- MySQL on same box or managed DB
- Admin static files on Nginx or separate CDN
- Cheaper at low scale; you operate patches/backups

### Domains (example)

| Service | URL |
|---------|-----|
| API | `https://api.gymkhana.in` |
| Admin | `https://admin.gymkhana.in` |
| Marketing | `https://gymkhana.in` (future) |
| Webhook | `https://api.gymkhana.in/api/v1/webhooks/razorpay` |

---

## 5. Payment implementation (detailed)

GymKhana has **two money flows**. Only one is wired to Razorpay today.

### 5.1 Flow A — Platform billing (gym pays GymKhana) ✅ mostly done

**Today:**
- Admin → **Billing** → start SaaS trial / generate invoice
- **Pay (Razorpay)** → `POST /saas/invoices/:id/razorpay-order` → Razorpay Checkout (admin web)
- Webhook `payment.captured` → `handlePaymentCaptured` → marks SaaS invoice paid

**Production tasks:**
1. Razorpay **live** keys in backend env
2. Register webhook in Razorpay Dashboard → production URL
3. Test: trial → invoice → pay → webhook → subscription `active`
4. Handle failures: `payment.failed` webhook (optional), past_due grace (partial)

**Env:**
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

---

### 5.2 Flow B — Member billing (member pays gym) ❌ not implemented

**Today:**
- Mobile **Plans** → `POST /subscriptions/self` → subscription created **without payment**
- Admin **Payments** → manual `POST /payments` + Idempotency-Key
- GST PDF invoice generated after manual payment

**This is the biggest production gap** if members renew in the app.

#### Target UX

1. Member opens **Plans** → selects plan → **Pay ₹X**
2. Razorpay Checkout opens (mobile)
3. On success → subscription active/renewed + payment row + GST invoice + receipt email
4. On failure → no subscription change; show retry

#### Recommended backend design

**New endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/payments/member/create-order` | Create Razorpay order for plan purchase/renewal |
| `POST` | `/payments/member/verify` | Optional: verify signature client-side before webhook |
| (existing) | `POST /webhooks/razorpay` | Extend handler for member orders |

**Order payload (Razorpay notes):**
```json
{
  "type": "member_subscription",
  "gymId": "...",
  "memberId": "...",
  "planId": "...",
  "subscriptionId": "..." 
}
```

**Webhook handler logic (extend `razorpay.service.js`):**
```
payment.captured
  if notes.type === 'saas_invoice'     → existing SaaS flow
  if notes.type === 'member_subscription':
    1. Idempotent: skip if payment exists for razorpay_payment_id
    2. Create Payment (status paid, gatewayRef paymentId)
    3. Create or renew Subscription (same as payment.service today)
    4. createInvoiceForPayment (GST PDF)
    5. sendPaymentReceipt email
```

**DB migration (suggested):**
- `payments.razorpay_order_id`, `payments.razorpay_payment_id` (unique index)
- Or table `payment_intents` linking order → member/plan before capture

**Mobile (Expo):**
- Option A: **`react-native-razorpay`** — requires **EAS dev build** (not Expo Go)
- Option B: **Razorpay Web Checkout** in WebView — works in Expo Go but UX weaker
- **Production:** use EAS + native SDK

**Multi-tenant money routing (pick one for v1):**

| Model | Pros | Cons |
|-------|------|------|
| **A. Platform account** (single Razorpay) | Fastest; one webhook | GymKhana collects; manual payout to gyms |
| **B. Per-gym Razorpay keys** in Settings | Money to gym directly | Each gym onboard Razorpay; store encrypted keys |
| **C. Razorpay Route** (marketplace) | Proper splits | KYC, longer setup |

**Recommendation for v1 launch:** **Model A** (platform account) if you operate few pilot gyms; plan **Model B or C** before scale.

#### Admin parity
- Keep manual **Record payment** for cash/UPI at desk
- Online payments appear same in Payments list + member workspace timeline

---

### 5.3 Payment security checklist

- [ ] Webhook signature always verified (`x-razorpay-signature`)
- [ ] Never trust client-only success; webhook is source of truth
- [ ] Idempotency on `payment_id` and admin `Idempotency-Key`
- [ ] Amount validated server-side from `Plan.priceCents` (never from client)
- [ ] Subscription state changes only inside DB transaction with payment row
- [ ] Razorpay keys only on server; mobile gets `key_id` + `order_id` only

---

## 6. Deployment runbook

### 6.1 Backend

```bash
# On server or PaaS
cd backend
npm ci --omit=dev
npm run db:migrate
NODE_ENV=production node src/server.js
```

**Production `.env` (minimum):**
```env
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1

DB_DIALECT=mysql
DB_HOST=...
DB_PORT=3306
DB_NAME=gymkhana
DB_USER=...
DB_PASSWORD=...

JWT_ACCESS_SECRET=<long-random>
JWT_REFRESH_SECRET=<long-random>

CORS_ORIGIN=https://admin.gymkhana.in

EMAIL_PROVIDER=resend   # or sendgrid — implement provider first
EMAIL_FROM=billing@gymkhana.in

RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Optional
REDIS_URL=redis://...
```

**Process manager:** PM2 or platform-native (Railway/Render).

---

### 6.2 Admin portal

```bash
cd admin-portal
# .env.production
VITE_API_URL=https://api.gymkhana.in/api/v1
npm ci
npm run build
# Deploy dist/ to Vercel/Netlify/S3+CloudFront
```

---

### 6.3 Mobile app

1. Create `eas.json` (Expo Application Services)
2. Set production env in EAS secrets:
   ```env
   EXPO_PUBLIC_API_URL=https://api.gymkhana.in/api/v1
   EXPO_PUBLIC_API_FORCE=true
   ```
3. Build:
   ```bash
   cd mobile-app
   eas build --platform android
   eas build --platform ios
   ```
4. Submit to Play Store / App Store
5. OTA updates: `eas update` for JS-only changes (after Razorpay native module is in build)

**Note:** After EAS production build, dev Metro auto-detect is disabled when `EXPO_PUBLIC_API_FORCE=true` or not `__DEV__`.

---

## 7. Implementation waves (timeline guide)

### Wave 1 — Infrastructure (1–2 weeks)
- [ ] Choose host + MySQL
- [ ] Deploy API with HTTPS
- [ ] Deploy admin static site
- [ ] Production env + CORS
- [ ] DB backup cron
- [ ] Smoke test: login, members, attendance

### Wave 2 — Platform monetization (3–5 days)
- [ ] Razorpay live + webhook
- [ ] End-to-end SaaS invoice payment
- [ ] Email provider (Resend/SendGrid) for receipts + expiry
- [ ] `requirePlatformAccess` on all tenant routes

### Wave 3 — Member payments (1–2 weeks) ⭐ highest product impact
- [ ] Backend: `create-order` + webhook extension + migration
- [ ] Mobile: Razorpay checkout on Plans / Renew
- [ ] Remove or gate free `POST /subscriptions/self` (require paid order)
- [ ] EAS dev build for payment testing
- [ ] QA: pay → subscription active → invoice PDF → mobile pass

### Wave 4 — Launch polish (1–2 weeks)
- [ ] EAS production builds + store assets
- [ ] Privacy policy, terms, support email
- [ ] Sentry + basic uptime monitor
- [ ] Tenant isolation QA (2 gyms)
- [ ] Retention cron + family/shifts admin UI (if needed for launch gyms)

---

## 8. Pre-launch checklist

### Security
- [ ] JWT secrets rotated; not default
- [ ] `CORS_ORIGIN` not `*`
- [ ] Rate limits enabled
- [ ] Razorpay webhook secret set
- [ ] No secrets in git (`.env` gitignored)
- [ ] HTTPS everywhere

### Data
- [ ] Migrations run on prod DB
- [ ] Seed only intentional (no default `Admin@12345` in prod)
- [ ] Backup restore tested once

### Payments
- [ ] SaaS: test live ₹1 invoice (refund in Razorpay dashboard)
- [ ] Member: test plan purchase on real device with EAS build
- [ ] Webhook logs monitored for 24h

### Mobile
- [ ] Prod API URL in EAS secrets
- [ ] Push notifications: FCM/APNs credentials in Expo
- [ ] App icons, splash, store screenshots

### Legal / ops
- [ ] GST details configurable per gym (Settings)
- [ ] Refund policy documented
- [ ] Support contact in app

---

## 9. Environment matrix

| Variable | Dev | Production |
|----------|-----|------------|
| `EXPO_PUBLIC_API_URL` | Auto from Metro | `https://api.gymkhana.in/api/v1` |
| `VITE_API_URL` | `http://localhost:4000/api/v1` | `https://api.gymkhana.in/api/v1` |
| `CORS_ORIGIN` | `*` or localhost | `https://admin.gymkhana.in` |
| `EMAIL_PROVIDER` | `console` | `resend` / `sendgrid` |
| `RAZORPAY_*` | test keys | live keys |
| `NODE_ENV` | `development` | `production` |

---

## 10. What to build first (founder priority)

If time is limited, do **exactly this order**:

1. **Deploy API + admin** to public HTTPS  
2. **Razorpay live webhook** for SaaS (you get paid)  
3. **Member payment flow** (gyms get paid; app becomes real product)  
4. **EAS build** + Play Store (India Android-first)  
5. Everything else in P1/P2

---

## 11. Doc maintenance

When shipping production milestones, update:
- This file (checklist statuses)
- [FEATURES.md](./FEATURES.md) (new endpoints)
- [SYSTEM_GAPS_AND_ISSUES.md](./SYSTEM_GAPS_AND_ISSUES.md) (close gaps)
- [ARCHITECTURE.md](./ARCHITECTURE.md) § deployment + payments diagram (optional)
