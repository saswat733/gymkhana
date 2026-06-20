## GymKhana — Current Features (as of 2026-06-13)

> **Architecture & system design:** see [ARCHITECTURE.md](./ARCHITECTURE.md)

This is the **current “working product” inventory**: everything implemented right now across **Backend**, **Admin Portal**, and **Mobile**.

Where relevant, this document notes:
- **Who can use it** (Admin / Trainer / Member)
- **Where it exists** (Admin Portal screen, Mobile screen, Backend endpoint)
- **Important behavior** (scoping rules, idempotency, constraints)

---

## Backend (`backend/`) — API + DB

### Core platform
- **Auth & session**
  - **Register (Member self-signup)**: `POST /auth/register`
  - **Login**: `POST /auth/login`
  - **Refresh**: `POST /auth/refresh`
  - **Current session**: `GET /auth/me`
    - Members include a `memberId` field so the mobile app can call member-scoped flows.
  - **Change password (signed-in)**: `POST /auth/change-password`
  - **Forgot/reset password**
    - `POST /auth/forgot-password`
    - `POST /auth/reset-password`
    - Dev behavior: reset token is delivered via the **console email provider**.

- **Security & hardening**
  - Helmet + CORS (dev-friendly origin matching)
  - **Rate limiting**
    - Keyed by **userId** when a valid JWT is present
    - Fallback: request IP

- **API conventions**
  - Joi validation middleware for query/body/params
  - Standard response envelope: `success`, `message`, `data`, optional `meta`
  - Standard error envelope with codes (e.g. `UNPROCESSABLE`, `FORBIDDEN`, etc.)
  - Structured logging (Winston) + access logs (Morgan)

### Business operations
- **Members** (Admin/Trainer)
  - List/search: `GET /members`
  - Create: `POST /members`
  - Read: `GET /members/:id`
  - Update: `PATCH /members/:id`
  - Activate/deactivate: `PATCH /members/:id/active`

- **Plans**
  - **Admin (management)**
    - CRUD: `GET/POST/PATCH /plans`, `GET /plans/:id`, `PATCH /plans/:id/active`
  - **Member/Trainer/Admin (read-only catalog for mobile purchase flow)**
    - Catalog list: `GET /plans/catalog` (supports the mobile “Plans” tab)

- **Subscriptions**
  - **Admin/Trainer**
    - Create for any member: `POST /subscriptions`
    - Renew: `POST /subscriptions/:id/renew`
    - Cancel: `POST /subscriptions/:id/cancel`
  - **Member**
    - List own subscriptions: `GET /subscriptions` (server-scoped to your member profile)
    - **Buy/subscribe for self**: `POST /subscriptions/self`
      - Constraint: prevents creating a second active subscription if one already exists.
  - **Jobs**
    - Daily expiry job marks due subscriptions as expired.

- **Attendance**
  - **Member self check-in/out**
    - `POST /attendance/check-in` (supports `source: manual|qr|biometric`; optional `qr` payload)
    - `POST /attendance/check-out`
  - **Listing**
    - Members can list their own attendance via `GET /attendance` (server-scoped)
    - Staff can list/filter via `GET /attendance` (admin/trainer)

- **Payments**
  - List payments: `GET /payments` (member history requires `subscriptionId`)
  - Record payment: `POST /payments` (admin/trainer)
    - Requires **Idempotency-Key** header to prevent duplicates.
    - Best-effort **payment receipt email** (console provider in dev)

- **Stats / Analytics** (Admin/Trainer)
  - `GET /stats/kpis`
  - `GET /stats/revenue-trend`
  - `GET /stats/attendance-heatmap`

### Phase 5 (Integration/Optimization) started
- **Caching layer**
  - Redis if `REDIS_URL` exists, otherwise in-memory fallback
  - Cached hot GET endpoints (stats + plans list)

### Phase 6 (Advanced) started
- **In-app messaging (Announcements)**
  - Member inbox: `GET /announcements/inbox`
    - Only published announcements are shown
    - Audience is filtered by role (members see member/all messages)
  - Admin CRUD:
    - List: `GET /announcements`
    - Create: `POST /announcements`
    - Update: `PATCH /announcements/:id`
    - Delete: `DELETE /announcements/:id`
- **Subscription expiry reminders (email)**
  - Daily reminder job sends “expiring in 3 days” email (console provider in dev)
- **Member engagement analytics**
  - `GET /engagement/me` (member-only): streak days, last visit, visits last 7/30 days
- **Trainer assignment**
  - `GET /trainers/:trainerId/members`
  - `POST /trainers/:trainerId/members` (assign)
  - `DELETE /trainers/:trainerId/members/:memberId` (unassign)
- **Workout plans**
  - List: `GET /workout-plans`
    - Members are automatically scoped to their own `memberId`
    - Staff can filter by `memberId` / `trainerId`
  - Create: `POST /workout-plans` (admin/trainer)
  - Update: `PATCH /workout-plans/:id`
  - Delete: `DELETE /workout-plans/:id`

### SaaS platform (Phase A + B)
- **Multi-tenant**
  - `gyms` table, `gym_id` on all tenant tables, JWT `gymId`, `requireTenant`
  - `POST /gyms/onboard` — create gym + owner + default member plans + SaaS trial
  - `GET/PATCH /gyms/me` — gym profile + GST/billing fields
- **Roles & permissions**
  - Roles: `owner`, `admin`, `manager`, `receptionist`, `trainer`, `member`
  - Permission map + `requirePermission` middleware
- **SaaS billing (gym → platform)**
  - Plans: Basic / Pro / Enterprise (`saas_plans`)
  - `GET /saas/plans`, `GET /saas/subscription`, `POST /saas/subscription/start|cancel`
  - `GET /saas/invoices`, `POST /saas/invoices/generate`, `POST /saas/invoices/:id/mark-paid`
  - Usage limits enforced on member/trainer create
  - `requirePlatformAccess` — blocks API when trial/subscription inactive
- **Trainers (CRUD)**
  - `GET /trainers` — list trainers in gym
  - `POST /trainers` — create trainer user + profile
  - Assignment: `GET/POST/DELETE /trainers/:id/members`
- **Member GST invoices (Phase B2)**
  - Auto-created when staff records a payment
  - `GET /member-invoices`, `GET /member-invoices/:id/pdf` (PDF via pdfkit)
  - Gym `defaultGstPercent` on profile
- **Razorpay (SaaS billing)**
  - `POST /saas/invoices/:id/razorpay-order`
  - `POST /webhooks/razorpay` — marks invoice paid on `payment.captured`
- **Push notifications**
  - `POST /push/register` — Expo push token
  - Sent on new announcements + subscription expiry reminders
- **Staff pass verification**
  - `POST /attendance/verify-pass` — parse `gymkhana:member:<uuid>`, verify sub, optional check-in
- **MRR / retention stats**
  - `GET /stats/mrr` — MRR, ARR, renewal rate, payments MTD

---

## Admin Portal (`admin-portal/`) — Web

### Auth + routing
- Login + protected routes + refresh interceptor

### Screens (wired to backend)
- **Dashboard**
  - KPI cards (active subs, revenue MTD, check-ins today, expiring soon)
- **Members**
  - List/search, create, edit, activate/deactivate
- **Plans**
  - CRUD + toggle active
- **Subscriptions**
  - Assign plan to member, renew, cancel
- **Attendance**
  - Staff attendance list with filters (member/date range)
  - **Staff verify pass** — paste member pass code, verify membership + check-in
- **Payments**
  - Filter by member + subscription
  - Record payment modal (sends Idempotency-Key)
  - Payment history list
- **Announcements (NEW)**
  - Create & publish announcements shown in the mobile app “Messages” tab
  - Publish/unpublish + delete
- **Analytics**
  - Revenue trend + attendance heatmap charts
  - **MRR / retention** KPI cards (MRR, ARR, renewal rate, payments MTD)
- **GST Invoices (NEW)**
  - List member payment invoices, download PDF
- **Billing (NEW)**
  - Platform SaaS plans, start trial, switch plan, cancel
  - Generate invoices (GST %), **Pay with Razorpay** or mark paid manually
- **Trainers (NEW)**
  - List trainers, create trainer accounts
- **Workout plans (NEW)**
  - Create workout plan for a member, delete
- **Onboarding (NEW)**
  - `/onboard` — new gym signup (owner account + 14-day trial)
- **Settings**
  - Profile + change password
  - **Gym profile & GST** — legal name, GSTIN, billing address, default GST %

### Role-based navigation
- Sidebar items filtered by role (e.g. Billing: owner/admin only; Plans: not receptionist)

---

## Mobile (`mobile-app/`) — Expo Router (physical device ready)

### UI/UX
- Modern minimal UI kit: `ui/theme.ts` + `ui/components.tsx` used across screens

### Auth
- Login
- Member signup
- Forgot password / reset password
- Change password (in Profile)

### Member features
- **Home**
  - Current plan + days remaining
  - Engagement card (streak + last visit + visits last 7 days)
  - Quick check-in
  - QR check-in
  - Entry pass — **visual QR** + backup pass code for staff verification
  - **Push notifications** — token registered on login (announcements + expiry reminders)
- **Plans (NEW)**
  - List active plan catalog
  - Subscribe (creates subscription for the signed-in member)
- **Attendance**
  - Member attendance history list
- **Payments**
  - Member payment history (uses active subscription)
- **Workouts (NEW)**
  - View workout plans assigned by trainer/staff
- **Messages**
  - In-app announcements inbox
- **Profile**
  - View user details
  - Change password
  - Logout
- **QR scanner**
  - Camera permission + QR scan triggers check-in with `source=qr`

### Offline-friendly caching
- React Query + persistence using **Expo SecureStore** (works in Expo Go)

---

## Not started / placeholders
- Payment gateway for **member** subscription payments (SaaS Razorpay done)
- Mobile invoice download view (admin has PDF download)
- Dedicated staff scanner mobile app (admin web verify-pass works today)
- Full retention rule engine (basic expiry email + push reminders exist)
- CRM / leads (Phase D)
- Wearables (Google Fit / Apple Health)

