# GymKhana — Deploy for ₹0 (Free Tier)

**Goal:** Public HTTPS API + admin portal + mobile talking to prod — **no credit card required** for core stack.

**What stays free vs what costs later:**

| Item | Free? | Notes |
|------|-------|-------|
| Backend API | ✅ | Render / Fly.io free tier |
| Database | ✅ | Neon Postgres free tier |
| Admin website | ✅ | Vercel / Netlify |
| Razorpay test payments | ✅ | Test mode, no real money |
| Resend email | ✅ | 3,000 emails/month free |
| Expo dev / internal APK | ✅ | Expo Go or EAS preview APK |
| Custom domain | ✅ optional | Use `*.onrender.com` + `*.vercel.app` |
| Google Play listing | ❌ | One-time developer fee (skip for now) |
| Apple App Store | ❌ | $99/year (skip for now) |

**Recommended $0 stack:**

```
Neon (Postgres)  →  Render (backend API)  →  Vercel (admin)
                              ↑
                    Mobile (Expo Go or APK)
```

---

## What you need (all free accounts)

1. [GitHub](https://github.com) — host your code
2. [Neon](https://neon.tech) — free Postgres database
3. [Render](https://render.com) — free Node.js API
4. [Vercel](https://vercel.com) — free admin hosting
5. [Razorpay](https://razorpay.com) — test mode (no charge)
6. [Expo](https://expo.dev) — mobile builds (optional for APK)

No domain purchase needed. You will use URLs like:

- API: `https://gymkhana-api.onrender.com`
- Admin: `https://gymkhana-admin.vercel.app`

---

## Step 0 — Push code to GitHub

If not already on GitHub:

```bash
cd gymKhana
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/gymKhana.git
git push -u origin main
```

Render and Vercel deploy from GitHub.

---

## Step 1 — Free database (Neon Postgres)

GymKhana supports Postgres out of the box (`DB_DIALECT=postgres`).

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. **New Project** → name it `gymkhana`
3. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
4. Split into env vars for Render:

```env
DB_DIALECT=postgres
DB_HOST=ep-xxxxx.region.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=your_neon_user
DB_PASSWORD=your_neon_password
DB_SSL=true
```

Neon free tier: ~0.5 GB storage, enough for pilot gyms.

---

## Step 2 — Free backend API (Render)

1. [render.com](https://render.com) → Sign up → **New → Web Service**
2. Connect GitHub repo `gymKhana`
3. Settings:

| Field | Value |
|-------|-------|
| Name | `gymkhana-api` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm run db:migrate && npm start` |
| Instance Type | **Free** |

4. **Environment Variables** — add all of these:

```env
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1

DB_DIALECT=postgres
DB_HOST=<from Neon>
DB_PORT=5432
DB_NAME=<from Neon>
DB_USER=<from Neon>
DB_PASSWORD=<from Neon>
DB_SSL=true

JWT_ACCESS_SECRET=<run: openssl rand -hex 32>
JWT_REFRESH_SECRET=<run: openssl rand -hex 32>

CORS_ORIGIN=https://YOUR-ADMIN.vercel.app

EMAIL_PROVIDER=console
EMAIL_FROM=no-reply@gymkhana.local

RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx

SEED_ADMIN_EMAIL=admin@yourmail.com
SEED_ADMIN_PASSWORD=YourStrongPassword123!
SEED_ADMIN_NAME=Admin
```

5. Click **Create Web Service** → wait ~5–10 min for first deploy
6. Copy your URL: `https://gymkhana-api.onrender.com`

### Verify API

Open in browser:

```
https://gymkhana-api.onrender.com/api/v1/health
```

Should return JSON success.

### Render free tier limits (know this)

- Service **sleeps after ~15 min** no traffic → first request takes 30–60 sec (cold start)
- 750 free hours/month — enough for one service
- Fine for demo + 1–2 pilot gyms; upgrade later if slow

---

## Step 3 — Seed admin user (first login)

After first deploy, run seeder once. On Render:

1. **Shell** tab (or one-off job) in Render dashboard, OR run locally pointing at Neon:

```bash
cd backend
# paste Neon DB vars into .env temporarily
npm run db:seed
```

Or SSH/local with production `.env` — creates admin from `SEED_ADMIN_*` vars.

Login at admin URL with that email/password.

---

## Step 4 — Free admin portal (Vercel)

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. Settings:

| Field | Value |
|-------|-------|
| Root Directory | `admin-portal` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. **Environment Variable:**

```env
VITE_API_URL=https://gymkhana-api.onrender.com/api/v1
```

4. Deploy → URL like `https://gymkhana-admin.vercel.app`

5. **Update Render CORS** — go back to Render env vars:

```env
CORS_ORIGIN=https://gymkhana-admin.vercel.app
```

Redeploy API (or wait for auto-redeploy).

6. Open admin URL → log in → test members page.

---

## Step 5 — Razorpay webhook (free, test mode)

Payments need webhook on **public HTTPS** — Render URL works.

1. [Razorpay Dashboard](https://dashboard.razorpay.com) → **Test Mode** (toggle top)
2. **Settings → Webhooks → Add New Webhook**
3. URL:

```
https://gymkhana-api.onrender.com/api/v1/webhooks/razorpay
```

4. Event: `payment.captured`
5. Copy **Webhook Secret** → Render env `RAZORPAY_WEBHOOK_SECRET` → redeploy

Test card: `4111 1111 1111 1111`, any CVV, future expiry.

---

## Step 6 — Mobile app (free options)

Play Store costs money. For **₹0**, pick one:

### Option A — Expo Go (easiest, dev/demo)

1. Deploy API first (Step 2)
2. On phone, install **Expo Go** from Play Store (app is free; dev account not needed)
3. In `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=https://gymkhana-api.onrender.com/api/v1
EXPO_PUBLIC_API_FORCE=true
```

4. Run `npx expo start` on PC → scan QR

**Limits:** Razorpay native checkout **won't work** in Expo Go. Trials/free plans OK; paid plans need Option B or dev fallback.

### Option B — Free internal APK (no Play Store)

1. Expo account (free)
2. Install EAS CLI: `npm i -g eas-cli`
3. `cd mobile-app && eas login && eas build --platform android --profile preview`
4. EAS free tier: limited builds/month — enough for testing
5. Download APK → install on Android directly (enable "Install unknown apps")

Set EAS secrets:

```
EXPO_PUBLIC_API_URL=https://gymkhana-api.onrender.com/api/v1
EXPO_PUBLIC_API_FORCE=true
EXPO_PUBLIC_RAZORPAY_ENABLED=true
```

Install `react-native-razorpay` before build for member payments.

### Option C — Skip mobile deploy for now

Use admin portal only for pilot gym. Add mobile when ready to pay Play fee.

---

## Step 7 — Optional free email (Resend)

Console email logs only — no real inbox delivery.

For real receipts (still free tier):

1. [resend.com](https://resend.com) → free account
2. Verify domain OR use Resend test address for dev
3. Render env:

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxx
EMAIL_FROM=onboarding@resend.dev
```

(`onboarding@resend.dev` works for testing without own domain.)

---

## Full free checklist

- [ ] Code on GitHub
- [ ] Neon Postgres created
- [ ] Render API live — `/api/v1/health` OK
- [ ] `db:migrate` + `db:seed` ran
- [ ] Vercel admin live — login works
- [ ] `CORS_ORIGIN` matches Vercel URL exactly
- [ ] Razorpay test webhook registered
- [ ] Mobile points to Render URL (not localhost)
- [ ] JWT secrets not `change-me` / not dev defaults

---

## Free tier troubleshooting

**Admin CORS error**

Set `CORS_ORIGIN` to exact Vercel URL, no trailing slash:

```env
CORS_ORIGIN=https://gymkhana-admin.vercel.app
```

**API very slow first request**

Render free tier cold start. Hit `/health` once before demo, or upgrade later.

**Mobile can't connect**

`localhost` / LAN IP won't work on mobile data. Must use `EXPO_PUBLIC_API_URL=https://....onrender.com/api/v1` + `EXPO_PUBLIC_API_FORCE=true`.

**Webhook not firing**

URL must be HTTPS. Secret must match. Wake API first (cold start) before testing payment.

**Neon connection failed**

Set `DB_SSL=true` on Render.

---

## When you outgrow free tier

| Signal | Upgrade to |
|--------|------------|
| API always slow (cold starts) | Render paid ($7/mo) or Railway |
| DB > 0.5 GB | Neon paid |
| Need Play Store | Google Play one-time fee |
| Custom domain | ~₹500–1000/year (optional) |

---

## Related

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — full prod guide (custom domain, Play Store, VPS)
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — technical checklist
