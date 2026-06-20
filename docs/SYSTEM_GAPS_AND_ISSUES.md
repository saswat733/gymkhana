# GymKhana — System Gaps, Pending Work, and Known Issues

**Last updated:** 2026-06-13 (post Phase A2 + B1 UI implementation)  
**Purpose:** Honest snapshot of what works today, what is half-built, what is missing, and how to fix common problems.

Related docs:
- [IMPLEMENTATION_ROADMAP_60D.md](./IMPLEMENTATION_ROADMAP_60D.md) — **primary execution plan** (60-day, investor-aligned)
- [FEATURES.md](./FEATURES.md) — feature inventory (what exists now)
- [SAAS_ROADMAP.md](./SAAS_ROADMAP.md) — product roadmap (Phases A–D)
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — deploy plan, gaps, member + SaaS payments
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) — step-by-step deploy (simple)

---

## 1. Executive summary

GymKhana is a **working gym operations stack** with a **SaaS-ready foundation** (multi-tenant + billing UI):

| Layer | Maturity | Notes |
|-------|----------|-------|
| Backend API | **Strong** | Tenant scoping, SaaS billing, gym onboarding, permissions, usage limits |
| Admin portal | **Strong ops + SaaS** | Billing, gym GST settings, trainers, workout plans, role-based nav |
| Mobile app | **Good member product** | Workouts tab, entry pass, plans, attendance, messages |
| Multi-tenant SaaS | **~90% (A1)** | Onboarding API + UI; two-gym QA still manual |
| Monetization (Phase B) | **~70% (B1)** | Admin billing UI + invoices; no payment gateway yet |
| Roles & permissions (A2) | **~80%** | owner/manager/receptionist + permission middleware + nav gating |

**Bottom line:** You can **onboard a new gym**, run operations, and manage **platform billing** manually. Still missing: payment gateway, member GST PDF invoices, push notifications, CRM (Phase C/D).

---

## 2. Phase completion tracker

### Phase A — SaaS foundation

| Item | Status | Gap |
|------|--------|-----|
| A1.1 `gyms` table + default gym seed | ✅ Done | — |
| A1.2 `gym_id` on tenant tables + backfill | ✅ Done | — |
| A1.3 JWT `gymId` + `requireTenant` middleware | ✅ Done | Old users needed backfill (see §5.1) |
| A1.4 Scope services by `gymId` | ✅ Done | Subscriptions, payments, attendance, stats, announcements, trainers, workout plans, engagement |
| A1.5 Gym onboarding flow | ✅ Done | `POST /gyms/onboard` + `/onboard` admin page; seeds default member plans + SaaS trial |
| A1.6 Two-gym isolation test | ⚠️ Untested | Architecture supports it; no automated test or manual QA doc |
| A2 Roles (Owner/Manager/Receptionist) | ✅ Done | DB enum expanded; `owner` used on onboard |
| A2 Permission system | ✅ Done | `permissions.js` + `requirePermission` middleware |
| A2 Admin portal permission gating | ✅ Done | Role-filtered sidebar nav (billing owner/admin only, etc.) |

### Phase B — Monetization (gym pays you)

| Item | Status | Gap |
|------|--------|-----|
| B1.1 SaaS plans (Basic/Pro/Enterprise) | ✅ Done | Seeded in DB |
| B1.2 Gym SaaS subscription | ✅ Done | Admin **Billing** page: start trial, switch plan, cancel |
| B1.3 SaaS invoices + GST fields on gym | ✅ Partial | Admin UI + manual mark-paid; gym GST in **Settings**; no PDF yet |
| B1.4 Usage limits (members/trainers) | ✅ Done | Enforced on member/trainer create + member self-signup |
| B1.5 Grace period / lock / downgrade rules | ✅ Partial | `requirePlatformAccess` middleware (trial/active/past_due grace); not on all routes yet |
| B1.6 Payment gateway (Razorpay/Stripe) | ❌ Missing | Manual invoice flow only |
| B2 Member payment GST invoices | ❌ Missing | Member payments have receipts (email); no GST invoice PDF |

### Phase C — Automation + intelligence

| Item | Status | Gap |
|------|--------|-----|
| Subscription expiry email job | ✅ Done | Console email in dev |
| Engagement analytics (`/engagement/me`) | ✅ Done | Mobile home only |
| Retention rule engine | ❌ Missing | No “inactive 5 days” rules |
| Push notifications | ❌ Missing | — |
| MRR / retention / LTV dashboard | ❌ Missing | Basic KPIs only |

### Phase D — Growth + scale

| Item | Status |
|------|--------|
| CRM / leads | ❌ Not started |
| Mobile digital entry pass (staff verify) | ⚠️ QR check-in exists; no staff scanner app, no pass UI |

---

## 3. Known issues and fixes

### 3.1 Admin portal: `Failed to load plans` / 403 `Missing tenant context`

**Symptom:** Plans, Members, Analytics return 403. Backend log:

```
Missing tenant context {"method":"GET","url":"/api/v1/plans?...","statusCode":403}
```

**Cause:** Multi-tenant middleware requires `gymId` in JWT. Users created **before** Phase A1 often had `users.gym_id = NULL`. Old login tokens had no `gymId`.

**Fix (applied):**
1. Migration `20260429154000-backfill-user-gymid.cjs` — sets `gym_id` on users missing it (default gym).
2. `auth.service.js` — on login/refresh, auto-attach default gym if `gymId` still null.

**What you must do:**
1. Log out of admin portal.
2. Log in again (fresh JWT with `gymId`).

**Prevention:** New signups and seeded admins should always have `gym_id`. Gym onboarding flow (A1.5) will make this explicit for new tenants.

---

### 3.2 Mobile: `Sign up failed` — `Network request failed`

**Symptom:** Registration fails. Error mentions `EXPO_PUBLIC_API_URL` and shows an IP like `http://10.58.237.132:4000/api/v1`.

**Cause (common):**
1. **PC LAN IP changed** (WiFi/network switch) but mobile app still points at old IP.
2. **Stale Expo bundle** on phone — `.env` updated but Expo Go still runs old JS (shows old IP in error even after `.env` fix).
3. Phone and PC not on same network, or Windows Firewall blocks port 4000.

**Fix (applied):**
- `mobile-app/.env` should use current PC LAN IP (run `ipconfig`, look for WiFi IPv4).
- `mobile-app/app.config.js` — injects API URL via Expo `extra` for reliable loading.
- `mobile-app/lib/config.ts` — reads `extra.apiUrl` first.
- Signup screen (dev) shows `API: <url>` so you can verify before submit.

**What you must do:**
```bash
cd mobile-app
npx expo start -c
```
1. Force-close Expo Go on phone.
2. Scan **new** QR (must match current LAN IP in terminal).
3. Confirm signup screen shows correct `API: http://<your-ip>:4000/api/v1`.
4. If still old IP: Android → Settings → Apps → Expo Go → Clear cache/data → scan again.
5. Ensure backend running: `cd backend && npm run dev`.
6. If API URL correct but still fails: allow Node.js through Windows Firewall on private networks.

**Current working IP (example):** `10.145.77.132` — **will change** when network changes. Update `.env` each time.

---

### 3.3 Mobile: logout did not redirect to login

**Symptom:** After logout, user stayed inside tabs; attendance/payments showed “sign in as member”.

**Fix (applied):** `app/(tabs)/_layout.tsx` — `Redirect` to `/(auth)/login` when `token` is null.

---

### 3.4 Mobile: React Query `AsyncStorage` crash in Expo Go

**Symptom:** `AsyncStorageError: Native module is null`.

**Fix (applied):** `lib/queryClient.ts` — persistence uses `expo-secure-store` instead of `@react-native-async-storage/async-storage`.

---

### 3.5 Mobile: member could not buy subscription / no announcements in admin

**Symptom:** No way to subscribe on mobile; no announcements UI in admin.

**Fix (applied):**
- Mobile **Plans** tab + `POST /subscriptions/self`.
- Admin **Announcements** page + CRUD.
- `GET /plans/catalog` for member read-only plan list.

**Remaining gap:** Subscribe creates subscription **without payment** — staff must record payment separately (by design for now).

---

### 3.6 Expo port conflicts

**Symptom:** `Port 8081 is being used by another process`.

**Fix:** Kill process or use another port:
```powershell
netstat -ano | findstr :8081
taskkill /PID <pid> /F
npx expo start --port 8083
```

---

### 3.7 Expo package version warnings

**Symptom:** Terminal warns `@react-native-async-storage`, `expo-camera`, etc. version mismatch.

**Impact:** May cause runtime issues on some devices. Not blocking signup/network errors.

**Fix (pending):** Align versions to Expo SDK 54 expected ranges (`npx expo install --fix`).

---

## 4. Backend gaps (remaining)

### 4.1 Not implemented

| Area | What's missing |
|------|----------------|
| Gym onboarding | `POST /gyms` (create tenant), create owner user, seed default member plans |
| Usage limits | Enforce `saas_plans.limit_members` / `limit_trainers` on member/trainer create |
| Gym lock | Block API when SaaS subscription `past_due` / trial expired (grace rules) |
| Payment gateway | Razorpay/Stripe for SaaS billing and optionally member payments |
| Member GST invoices | Invoice model + PDF for member `payments` |
| Push notifications | Expo push token storage + send service |
| CRM | Leads, trials, follow-ups |
| Trainer CRUD API | Trainers exist as users; no dedicated trainer management endpoints |
| Real email/SMS | Console email provider only in dev |

### 4.2 Half-implemented (API exists, incomplete product)

| Area | Exists | Missing |
|------|--------|---------|
| SaaS billing | `/api/v1/saas/*` routes | Admin UI, gateway, auto-renewal job |
| Workout plans | Full CRUD API | Admin + mobile UI |
| Trainer assignment | Assign/list/unassign API | Admin UI to manage trainers + assignments |
| QR check-in | Mobile scan → `POST /attendance/check-in` | Staff-side scanner, membership verification UI |
| Caching | Redis optional + stats cache | Cache invalidation not universal; tenant cache keys fixed for stats |

### 4.3 Technical debt

- Integration test coverage minimal (only payments idempotency test).
- No E2E tests for admin or mobile.
- `reminders.service.js` / expiry jobs not scoped by gym in logs (queries are global — OK for cron, but should document multi-tenant email behavior).
- Seed order: default gym seeder should run **before** admin seeder on fresh DB (admin seeder already handles missing gym).

---

## 5. Admin portal — UI gaps

### 5.1 Implemented screens

| Screen | Status |
|--------|--------|
| Login | ✅ |
| Dashboard (KPIs) | ✅ |
| Members | ✅ |
| Plans | ✅ |
| Subscriptions | ✅ |
| Attendance | ✅ |
| Payments | ✅ |
| Announcements | ✅ |
| Analytics (charts) | ✅ |
| Settings (password only) | ✅ |

### 5.2 Missing screens / UI work

| Screen | Priority | Notes |
|--------|----------|-------|
| ~~**SaaS Billing**~~ | ✅ Done | `/billing` — plans, subscription, invoices |
| ~~**Gym profile / GST**~~ | ✅ Done | Settings → Gym profile & GST |
| ~~**Trainers**~~ | ✅ Done | `/trainers` — list + create |
| ~~**Workout plans**~~ | ✅ Done | `/workout-plans` — create + delete |
| ~~**Role-based nav**~~ | ✅ Done | Sidebar filtered by role |
| ~~**Gym onboarding**~~ | ✅ Done | `/onboard` — public gym signup |
| ~~**Member payment receipt / invoice download**~~ | ✅ Done | `/invoices` — list + PDF download |
| **Dashboard polish** | P2 | Empty states, error retry, skeleton loaders |
| **Global search** | P3 | Cross-entity search |
| **Dark mode** | P3 | Mobile has dark theme; admin is light-only |

### 5.3 Admin UX issues (no code bug, product gaps)

- **No billing visibility** — gym owner cannot see if platform subscription is active.
- **Settings is password-only** — no gym name, timezone, currency, GST config.
- **No trainer workflow** — backend supports assignment; admin has no Trainers nav item.
- **Error handling** — some pages show generic “Failed to load” without hint to re-login after tenant migration.
- **Post-login token** — if user never re-logged after A1 migration, all tenant routes 403 until logout/login.

---

## 6. Mobile app — UI gaps

### 6.1 Implemented screens

| Screen | Status |
|--------|--------|
| Login / Signup / Forgot / Reset password | ✅ |
| Home (plan, engagement, check-in) | ✅ |
| Plans (catalog + subscribe) | ✅ |
| Attendance history | ✅ |
| Payments history | ✅ |
| Messages (announcements inbox) | ✅ |
| Profile + change password + logout | ✅ |
| QR scan check-in | ✅ |

### 6.2 Missing screens / UI work

| Screen | Priority | Notes |
|--------|----------|-------|
| ~~**Workout plans**~~ | ✅ Done | **Workouts** tab — lists assigned plans |
| ~~**Digital gym pass**~~ | ✅ Done | **Entry pass** — visual QR + backup pass code |
| **In-app payment** | P2 | UPI/card flow when subscribing (gateway) |
| ~~**Push notifications**~~ | ✅ Done | `expo-notifications` + `POST /push/register` on login |
| **Subscription wallet** | P2 | Clear active/expired state, renewal CTA |
| **Check-out button** | P2 | API exists; home only promotes check-in |
| **Offline mode messaging** | P3 | Better UX when network down |
| **Onboarding carousel** | P3 | First-run tips |
| **Tab icons** | P3 | Text-only tabs today |
| **iOS polish** | P3 | Mostly tested on Android / Expo Go |

### 6.3 Mobile UX issues

- **Subscribe without pay** — user gets active subscription with no payment step (confusing for real gyms).
- **Renewal message** — “Renewals handled by staff” — no self-serve renew.
- **API URL in dev** — shown on signup for debugging; remove or hide in production build.
- **Env reload** — requires full Expo restart with `-c`; easy to forget (documented above).
- **Package version drift** — expo-camera major mismatch may affect QR on some builds.

---

## 7. Dev & ops checklist

### Local development (daily)

| Step | Command / action |
|------|------------------|
| Backend | `cd backend && npm run dev` |
| Admin | `cd admin-portal && npm run dev` |
| Mobile | `cd mobile-app && npx expo start -c` |
| DB migrate | `cd backend && npx sequelize-cli db:migrate` |
| Get LAN IP | `ipconfig` → update `mobile-app/.env` |
| Admin login | `admin@gymkhana.local` / `Admin@12345` (seeded) |
| After tenant changes | **Always re-login** admin + mobile |

### Environment files

| File | Purpose |
|------|---------|
| `backend/.env` | DB, JWT, CORS, Redis |
| `mobile-app/.env` | `EXPO_PUBLIC_API_URL=http://<LAN-IP>:4000/api/v1` |
| `admin-portal/.env` | `VITE_API_URL` (typically `http://localhost:4000/api/v1`) |

---

## 8. Recommended implementation order

### Immediate (unblock real usage)

1. **Re-login all users** after tenant migration (one-time).
2. **Stabilize mobile API URL** — document IP update steps for team (§3.2).
3. **Admin SaaS Billing page** — wire existing `/saas/*` APIs (Phase B1 UI).
4. **Gym settings** — GST + billing profile in admin Settings.

### Short term (SaaS-ready)

5. **Phase A2** — Owner/Manager/Receptionist + permissions + nav gating.
6. **Gym onboarding API + UI** — create second gym without manual DB work.
7. **Usage limit enforcement** — block member/trainer create when over plan limit.
8. **Trial / past_due lock middleware** — soft-lock gym when SaaS unpaid.

### Medium term (revenue + compliance)

9. ~~**Razorpay** (India) for SaaS subscription payments.~~ ✅ Admin Pay button + webhook (set `RAZORPAY_*` in backend `.env`).
10. ~~**Member GST invoices** (PDF) on payment record.~~ ✅
11. ~~**Admin: Trainers + Workout plans** screens.~~ ✅
12. ~~**Mobile: Workout plans + digital pass**.~~ ✅

### Longer term (retention + growth)

13. Phase C — full retention rule engine (basic push + email reminders exist).
14. ~~Phase C — MRR/retention dashboard.~~ ✅ Analytics MRR cards + `GET /stats/mrr`.
15. Phase D — CRM + dedicated staff scanner app (admin verify-pass works).

---

## 9. Quick reference — API ↔ UI coverage

| API prefix | Admin UI | Mobile UI |
|------------|----------|-----------|
| `/saas/*` | ✅ Billing (+ Razorpay) | ❌ |
| `/member-invoices/*` | ✅ GST Invoices | ❌ |
| `/attendance/verify-pass` | ✅ Attendance page | ❌ |
| `/stats/mrr` | ✅ Analytics | ❌ |
| `/push/register` | ❌ | ✅ on login |
| `/gyms/*` | ✅ Settings + Onboard | ❌ |
| `/trainers/*` | ✅ Trainers (list/create; assign TBD) | ❌ |
| `/workout-plans/*` | ✅ Workout plans | ✅ Workouts tab |
| `/engagement/me` | ❌ | ✅ (home card) |
| `/announcements/inbox` | N/A (admin CRUD) | ✅ |

---

## 10. Implementation log (2026-06-13)

| Area | What shipped |
|------|----------------|
| Admin Billing | `BillingPage` → `/saas/*` (plans, trial, invoices, mark paid) |
| Gym settings | `GET/PATCH /gyms/me` + Settings gym/GST form |
| Gym onboarding | `POST /gyms/onboard` + `/onboard` page + default plans seed |
| Phase A2 | Roles enum, `permissions.js`, `requirePermission`, role-based nav |
| Usage limits | `assertMemberLimit` / `assertTrainerLimit` on create |
| Platform lock | `requirePlatformAccess` on member + trainer routes |
| Admin Trainers | `GET/POST /trainers` + Trainers page |
| Admin Workout plans | WorkoutPlans page wired to API |
| Mobile | Workouts tab, Entry pass screen, home link |
| Member GST invoices | `member_invoices` table, PDF service, admin `/invoices` page |
| Razorpay | Order creation + webhook; admin Billing “Pay (Razorpay)” |
| Push | `push_tokens` table, Expo push API, announcement + expiry hooks; mobile token register |
| Staff verify | `POST /attendance/verify-pass` + admin Attendance UI |
| MRR stats | `GET /stats/mrr` + Analytics KPI cards |
| Mobile QR pass | `react-native-qrcode-svg` on Entry pass screen |
| Migrations | `20260429160000`–`20260429161500` applied |

---

## 11. Bug fix log

### Cancelled subscription still shows "active" on mobile (2026-06-13)

**Symptom:** Admin cancels member subscription (status `cancelled` in admin + DB), but mobile Plans tab still shows "You already have an active subscription" and disables Subscribe.

**Root cause:** React Query persisted subscription list to SecureStore for up to 24h. Mobile read cached `status: active` instead of refetching after admin cancel.

**Fix:**
- Do not persist `subscriptions` query cache.
- `refetchOnMount: always` + refetch when Plans tab gains focus.
- Shared `isSubscriptionActive()` helper (status `active` + `ends_at` not passed).
- Backend `createSubscriptionForSelf` uses same active semantics.

**Verify:** Cancel in admin → open mobile Plans tab → Subscribe enabled → `POST /subscriptions/self` succeeds.

---

## 12. Document maintenance

Update this file when:
- A roadmap phase item ships (move from ❌ to ✅).
- A new production incident is fixed (add to §3).
- Admin or mobile gains a new screen (update §5 / §6).

For feature-level detail of what **already works**, see [FEATURES.md](./FEATURES.md).  
For **what to build next by phase**, see [SAAS_ROADMAP.md](./SAAS_ROADMAP.md).
