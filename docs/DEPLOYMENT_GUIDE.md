# GymKhana — Deployment Guide (Simple)

> **Deploy with ₹0?** See **[DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md)** — Render + Neon + Vercel, no credit card for core stack.

**Who this is for:** You want GymKhana live on the internet so gyms can use it, members can pay, and Razorpay webhooks work.

**What you will deploy:**

| Part | What it is | Example URL |
|------|------------|-------------|
| Backend API | Node.js server + database | `https://api.gymkhana.in` |
| Admin portal | Website for gym staff | `https://admin.gymkhana.in` |
| Mobile app | Android/iOS app (Play Store / App Store) | Installed on phones |

**Recommended stack (India, low cost):**

- **API:** Railway, Render, or a VPS (DigitalOcean / AWS Lightsail)
- **Database:** Managed MySQL (Railway, PlanetScale, or DigitalOcean Managed DB)
- **Admin:** Vercel or Netlify (free tier works)
- **Mobile:** Expo EAS Build → Google Play Store
- **Payments:** Razorpay (test keys first, then live)
- **Email:** Resend (free tier for receipts)

---

## Before you start — checklist

You need:

- [ ] A domain name (e.g. `gymkhana.in`) — optional at first; Railway/Render give free URLs
- [ ] Razorpay account ([razorpay.com](https://razorpay.com)) — start with **Test Mode**
- [ ] Resend account ([resend.com](https://resend.com)) — for payment receipts
- [ ] Expo account ([expo.dev](https://expo.dev)) — for mobile builds
- [ ] Google Play Developer account (₹ one-time fee) — for Android app

Generate two long random strings for JWT secrets (use a password manager or `openssl rand -hex 32`).

---

## Step 1 — Deploy the database

### Option A: Railway (easiest)

1. Go to [railway.app](https://railway.app) → New Project → **Add MySQL**
2. Open the MySQL service → **Variables** tab
3. Copy: `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`

### Option B: DigitalOcean Managed MySQL

1. Create a MySQL cluster in the same region as your API server
2. Create database named `gymkhana`
3. Note host, port, user, password

**Important:** Do not expose MySQL to the public internet. Only your API server should connect.

---

## Step 2 — Deploy the backend API

### Option A: Railway

1. New Project → **Deploy from GitHub repo** → select `gymKhana` repo
2. Set **Root Directory** to `backend`
3. Set **Start Command:** `npm run db:migrate && npm start`
4. Add environment variables (see table below)
5. Deploy → copy the public URL (e.g. `https://gymkhana-api.up.railway.app`)

### Option B: VPS (Ubuntu + PM2)

```bash
# On your server
git clone <your-repo-url> gymkhana
cd gymkhana/backend
npm ci --omit=dev

# Create .env (see variables table)
nano .env

npm run db:migrate
npm install -g pm2
pm2 start src/server.js --name gymkhana-api
pm2 save
pm2 startup
```

Put Nginx in front with HTTPS (Let's Encrypt / Certbot):

```nginx
server {
    listen 443 ssl;
    server_name api.gymkhana.in;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option C: Docker

From repo root:

```bash
cd backend
docker build -t gymkhana-api .
docker run -p 4000:4000 --env-file .env gymkhana-api
```

Or use `docker-compose.yml` in repo root for local prod-like testing.

### Backend environment variables

Create `backend/.env` on the server (never commit this file):

```env
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1

# Database — use your managed MySQL values
DB_DIALECT=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=gymkhana
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# JWT — use long random strings, NOT the dev defaults
JWT_ACCESS_SECRET=<random-64-chars>
JWT_REFRESH_SECRET=<random-64-chars>

# CORS — your admin website URL only (no * in production)
CORS_ORIGIN=https://admin.gymkhana.in

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=billing@yourdomain.com

# Razorpay — start with test keys, switch to live when ready
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxx

# Do NOT seed default admin password in production
SEED_ADMIN_EMAIL=you@yourdomain.com
SEED_ADMIN_PASSWORD=<strong-password>
```

### Verify backend works

Open in browser or curl:

```
https://api.gymkhana.in/api/v1/health
```

You should see a success JSON response.

---

## Step 3 — Deploy the admin portal

The admin portal is a static React site. Build once, upload to Vercel/Netlify.

### Build locally

```bash
cd admin-portal

# Create .env.production
echo "VITE_API_URL=https://api.gymkhana.in/api/v1" > .env.production

npm ci
npm run build
```

The `dist/` folder is your website.

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Import Git repo
2. Set **Root Directory:** `admin-portal`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Environment variable: `VITE_API_URL` = `https://api.gymkhana.in/api/v1`
6. Deploy → you get `https://your-project.vercel.app`

### Custom domain (optional)

In Vercel → Settings → Domains → add `admin.gymkhana.in`  
In your DNS provider → add CNAME pointing to Vercel.

### Verify admin works

1. Open admin URL
2. Log in with your seed admin email/password
3. Create a test member, check dashboard loads

---

## Step 4 — Configure Razorpay webhooks

Razorpay must call your API when a payment succeeds. Without this, subscriptions won't activate after payment.

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. **Settings → Webhooks → Add New Webhook**
3. **URL:** `https://api.gymkhana.in/api/v1/webhooks/razorpay`
4. **Events:** enable `payment.captured` (and `payment.failed` optional)
5. Copy the **Webhook Secret** → put in backend `RAZORPAY_WEBHOOK_SECRET`
6. Redeploy backend so the secret is loaded

### Test webhook

1. In admin → **Billing** → pay a test SaaS invoice with Razorpay test card `4111 1111 1111 1111`
2. Check backend logs for webhook received
3. Invoice should show **paid**

**Test card details (Razorpay test mode):**

- Card: `4111 1111 1111 1111`
- CVV: any 3 digits
- Expiry: any future date

---

## Step 5 — Build and publish the mobile app

Expo Go (what you use in development) **cannot** run Razorpay payments. You need a **production build** via EAS.

### One-time setup

```bash
npm install -g eas-cli
cd mobile-app
eas login
eas build:configure
```

This creates `eas.json` in the mobile folder.

### Set production API URL

In [expo.dev](https://expo.dev) → your project → **Secrets**:

```
EXPO_PUBLIC_API_URL=https://api.gymkhana.in/api/v1
EXPO_PUBLIC_API_FORCE=true
EXPO_PUBLIC_RAZORPAY_ENABLED=true
```

### Install Razorpay native module (required for member payments)

```bash
cd mobile-app
npm install react-native-razorpay
```

Then rebuild — this only works in EAS builds, not Expo Go.

### Build Android APK/AAB

```bash
eas build --platform android --profile production
```

When build finishes, download the `.aab` file.

### Upload to Google Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app → fill store listing (name, description, screenshots)
3. **Release → Production → Create new release**
4. Upload the `.aab` from EAS
5. Submit for review

### iOS (optional, later)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

Requires Apple Developer account ($99/year).

---

## Step 6 — Post-deploy checklist

Run through this before inviting a real gym:

### Security

- [ ] JWT secrets are random (not `change-me`)
- [ ] `CORS_ORIGIN` is your admin URL only
- [ ] `.env` files are not in git
- [ ] Default admin password changed
- [ ] HTTPS on API and admin

### Payments

- [ ] Razorpay webhook URL is public HTTPS
- [ ] Test SaaS invoice payment end-to-end
- [ ] Test member plan payment on a real Android device (EAS build)
- [ ] GST details filled in admin **Settings**

### Database

- [ ] Migrations ran successfully (`npm run db:migrate`)
- [ ] Backup enabled (Railway/DO auto-backup or daily cron)

### Mobile

- [ ] App points to production API (not localhost)
- [ ] Login works on phone with mobile data (not just Wi‑Fi)
- [ ] QR check-in works
- [ ] Plan payment activates membership

### Legal

- [ ] Privacy policy URL in Play Store listing
- [ ] Support email in app store listing
- [ ] Refund policy documented for gym owners

---

## Environment quick reference

| Variable | Where | Example |
|----------|-------|---------|
| `VITE_API_URL` | Admin build | `https://api.gymkhana.in/api/v1` |
| `EXPO_PUBLIC_API_URL` | EAS secrets | `https://api.gymkhana.in/api/v1` |
| `CORS_ORIGIN` | Backend | `https://admin.gymkhana.in` |
| `RAZORPAY_*` | Backend only | Never in mobile or admin |
| `RESEND_API_KEY` | Backend only | From Resend dashboard |

---

## Common problems

### Mobile app can't connect to API

- Phone must reach a **public** URL — `localhost` and `192.168.x.x` only work on same Wi‑Fi in dev
- Set `EXPO_PUBLIC_API_URL` in EAS secrets
- Set `EXPO_PUBLIC_API_FORCE=true` in production builds

### Razorpay payment succeeds but subscription not active

- Webhook URL wrong or not HTTPS
- `RAZORPAY_WEBHOOK_SECRET` mismatch — copy exact secret from Razorpay dashboard
- Check backend logs for `Invalid signature`

### Admin login works locally but not on Vercel

- `VITE_API_URL` must be set **at build time**, not runtime
- Rebuild admin after changing API URL

### CORS error in browser

- Backend `CORS_ORIGIN` must exactly match admin URL (including `https://`, no trailing slash mismatch)

### Emails not sending

- `EMAIL_PROVIDER=resend` and valid `RESEND_API_KEY`
- `EMAIL_FROM` must be a verified domain in Resend

---

## Updating after launch

| Change type | What to do |
|-------------|------------|
| Backend code | Push to git → Railway/VPS redeploys → run migrations if any |
| Admin UI only | Rebuild `admin-portal` → redeploy `dist/` |
| Mobile JS-only fix | `eas update` (OTA) if no native module changes |
| Mobile native change | New `eas build` + store update |

---

## Cost estimate (starting out)

| Service | Approx cost/month |
|---------|-------------------|
| Railway API + MySQL | ₹0–800 (free tier possible) |
| Vercel admin | Free |
| Resend email | Free up to 3k emails |
| Razorpay | No monthly fee (per transaction) |
| Google Play | One-time ₹ fee |
| Domain | ₹500–1000/year |

---

## Related docs

- [DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md) — **₹0 deploy** (Render + Neon + Vercel)
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — technical gaps and architecture
- [IMPLEMENTATION_ROADMAP_60D.md](./IMPLEMENTATION_ROADMAP_60D.md) — what to build next
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
