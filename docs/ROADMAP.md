# Roadmap

> **Current execution plan:** [IMPLEMENTATION_ROADMAP_60D.md](./IMPLEMENTATION_ROADMAP_60D.md) — supersedes phase ordering for launch. This file remains historical phase checklist.

A concrete, ordered execution plan. Each phase is shippable on its own.

---

## Phase 1 — Foundation ✅ (Done)

- [x] Monorepo scaffolding
- [x] Express app with helmet / cors / rate-limit
- [x] Sequelize ORM + Postgres/MySQL ready
- [x] User model (id UUID, name, email, phone, role, isActive, gymId reserved)
- [x] JWT auth (access + refresh) with bcrypt
- [x] Role-based access control middleware
- [x] Joi validation pipeline
- [x] Winston structured logger + Morgan access logs
- [x] Standardized API response + error envelope
- [x] Migrations + seeders (default admin)
- [x] Health endpoint
- [x] Graceful shutdown handling

---

## Phase 2 — Core Business Logic ✅ (Backend MVP complete)

Goal: backend covers the entire gym workflow end-to-end.

**Models / Tables**

- [x] `members` — extended profile linked to a `user` (DOB, address, emergency contact, joining date)
- [x] `plans` — subscription catalog (name, durationMonths, priceCents, perks)
- [x] `subscriptions` — `memberId`, `planId`, `startsAt`, `endsAt`, `status` (active/expired/cancelled), `autoRenew`
- [x] `attendance` — `memberId`, `checkInAt`, `checkOutAt`, `source` (qr/manual/biometric)
- [x] `payments` — `subscriptionId`, `amountCents`, `currency`, `method`, `status`, `paidAt`, `gatewayRef`
- [x] `trainers` — staff users + assigned members
- [x] `audit_logs` — who did what, when (admin actions)

**Services**

- [x] `member.service` — CRUD, search, soft delete, activate/deactivate
- [x] `plan.service` — CRUD (admin only)
- [x] `subscription.service` — assign plan, renew, cancel, expiry job
- [x] `attendance.service` — check-in/out, prevent duplicate same-day check-ins
- [x] `payment.service` — record payment, link to subscription, idempotency keys

**Endpoints**

- [x] `/members` (admin/trainer)
- [x] `/plans` (admin)
- [x] `/subscriptions` (admin + member self-view)
- [x] `/attendance` (member self-checkin + admin views)
- [x] `/payments` (admin + member history)

**Cross-cutting**

- [x] Pagination + filtering helper (`src/utils/pagination.js`)
- [x] Idempotency middleware for `POST /payments`
- [x] Daily cron (node-cron or BullMQ) — mark subscriptions expired
- [ ] Email service interface (no provider yet — log to console in dev)
- [ ] Integration tests with a test DB (`gymkhana_test`)

### Phase 2.1 — Email service interface (dev console provider)

Goal: make email sending a first-class backend capability without binding to a provider yet.

- [ ] Define `email.service` interface
  - methods: `send({ to, subject, text, html, templateId?, variables?, tags?, correlationId? })`
  - returns: `{ messageId, provider: 'console', accepted: string[] }`
- [ ] Implement `ConsoleEmailProvider` for development
  - log structured payload (mask PII where feasible)
  - include `correlationId` for traceability
- [ ] Add `EMAIL_PROVIDER=console` env and wiring in app bootstrap
- [ ] Add 1–2 transactional templates as helpers (pure functions)
  - examples: subscription expiring soon, payment receipt
- [ ] Add “dry-run” mode for tests (`EMAIL_DRY_RUN=true`)
- [ ] Wire one real workflow end-to-end (lowest risk)
  - suggestion: send receipt when `POST /payments` succeeds

**Done when**
- [ ] Sending an email is a single service call from any controller/service
- [ ] In dev, emails show up in logs with correlation id and recipient list
- [ ] No provider SDK is required to run locally

### Phase 2.2 — Integration tests (real DB)

Goal: validate the full HTTP + DB + auth stack for the most critical flows.

- [ ] Pick test runner + HTTP client (keep minimal)
  - recommended: Jest + Supertest
- [ ] Create isolated test DB (`gymkhana_test`)
  - separate `.env.test`
  - migrations run automatically before suite
  - truncate tables between tests (or wrap each test in a transaction)
- [ ] Seed baseline data in tests
  - default admin, one trainer, one member, one plan
- [ ] Write critical-path integration tests
  - auth: login, refresh, protected route denial
  - members: create → search → update → deactivate/activate
  - subscriptions: assign plan → renew → cancel → status transitions
  - attendance: check-in/out + duplicate guard
  - payments: idempotency key creates single payment
- [ ] Add CI-friendly script targets
  - `test:integration` (runs migrations + tests)
  - optional: `test:integration:watch`

**Done when**
- [ ] Tests run with one command and do not depend on dev DB data
- [ ] At least one integration test exists per major workflow area
- [ ] Failing behavior is actionable (clear assertions + error output)

---

## Phase 3 — Admin Portal (React + Vite)

Goal: ship a usable internal admin portal that covers daily operations end-to-end.

### Phase 3.0 — Bootstrap + UI foundations

- [ ] Bootstrap Vite + React + TS
- [ ] Tailwind + shadcn/ui setup
- [ ] App routing baseline
  - recommended: React Router
- [ ] Environment config
  - `VITE_API_BASE_URL`
  - dev proxy (optional)
- [ ] Base UI primitives
  - button, input, select, dialog, drawer/sheet, toast

**Done when**
- [ ] App builds and runs locally
- [ ] One sample page renders with shadcn styling + responsive layout tokens

### Phase 3.1 — Auth + API client (must be solid first)

- [ ] Auth flow
  - login screen
  - store access + refresh tokens (prefer httpOnly cookies if backend supports; otherwise secure storage + short TTL)
- [ ] Protected routes + logout
- [ ] Refresh handling
  - axios/fetch interceptor to refresh on 401 once, then retry original request
- [ ] API error normalization
  - map backend error envelope to field errors + toast message
- [ ] Role gating (admin vs trainer)

**Done when**
- [ ] You can log in, refresh, and navigate protected pages reliably
- [ ] API errors show clear toasts and field-level validation messages

### Phase 3.2 — App shell (layout + navigation)

- [ ] Layout: sidebar + topbar + responsive (mobile collapsible)
- [ ] Nav items for: Dashboard, Members, Plans, Subscriptions, Attendance, Payments, Settings
- [ ] Global loading states + empty states

**Done when**
- [ ] All routes exist (even if pages are placeholders)
- [ ] Layout works on small screens without breaking

### Phase 3.3 — Dashboard (operational KPIs)

- [ ] KPIs tiles
  - active members
  - revenue MTD
  - today’s check-ins
  - expiring soon (next 7/14 days)
- [ ] Skeleton states + last-updated timestamp

**Done when**
- [ ] Dashboard renders real data from backend endpoints

### Phase 3.4 — Members (highest-usage screen)

- [ ] Members table
  - pagination, server-side filters (name/phone/email/status)
  - row actions (view, edit, activate/deactivate)
- [ ] Member detail drawer
  - profile, current subscription, attendance summary, payments summary
- [ ] Create/edit member form with validation mapping

**Done when**
- [ ] Staff can complete day-to-day member operations without leaving this area

### Phase 3.5 — Plans (catalog)

- [ ] Plans CRUD (admin only)
- [ ] Form for duration + price + perks

### Phase 3.6 — Subscriptions (assign/renew/cancel)

- [ ] Assign plan to member
- [ ] Renew subscription
- [ ] Cancel subscription
- [ ] Status badges + expiry dates + filters

### Phase 3.7 — Attendance log

- [ ] Attendance list with date range filter
- [ ] Member filter + source filter (qr/manual/biometric)

### Phase 3.8 — Payments

- [ ] Payments list with filters (date, member, status, method)
- [ ] Record payment modal (admin)
  - uses idempotency key to prevent double-submit

### Phase 3.9 — Settings

- [ ] Profile view/edit
- [ ] Change password

### Phase 3.10 — Charts (nice-to-have, still shippable)

- [ ] Revenue trend (MTD or last 30/90 days)
- [ ] Attendance heatmap (by day)

### Phase 3.11 — E2E smoke (Playwright)

- [ ] Smoke suite
  - login
  - open members list
  - create member (or use seed), then verify appears in list
  - record payment and verify it appears

**Done when**
- [ ] E2E smoke runs headless and validates the critical admin workflow end-to-end

---

## Phase 4 — Mobile App (React Native + Expo)

- [ ] Expo bootstrap with Expo Router + TS
- [ ] Auth screens (login, forgot password)
- [ ] Home (current plan, days remaining, quick check-in)
- [ ] QR-based check-in flow
- [ ] Attendance history
- [ ] Payment history + invoices
- [ ] Profile + change password
- [ ] Push notifications (expo-notifications)
- [ ] Offline-friendly query caching

---

## Phase 5 — Integration & Optimization

- [ ] Caching layer (Redis) for hot reads (dashboard KPIs, plan list)
- [ ] Query optimization + DB indexes audit
- [ ] Pagination on every list endpoint
- [ ] Rate limit per user (not just per IP)
- [ ] Load test with k6 / Artillery
- [ ] Error tracking (Sentry) on all three clients

---

## Phase 6 — Advanced Features

- [ ] Subscription expiry email + push reminders
- [ ] Member engagement analytics (visit streaks, churn risk)
- [ ] In-app messaging (announcements from gym → members)
- [ ] Configurable workflows per gym (check-in rules, plan templates)
- [ ] Trainer assignment + workout plans
- [ ] Wearable integration prototype (Google Fit / Apple Health)

---

## Phase 7 — Multi-Tenant SaaS

- [ ] `gyms` table + `gym_id` on every tenant-scoped table
- [ ] Tenant middleware derives `req.gymId` from JWT
- [ ] Sequelize default scope filters by `gym_id`
- [ ] Onboarding flow (sign up gym → create owner user → seed plans)
- [ ] Subdomain or path-based tenant routing for admin portal
- [ ] Per-tenant feature flags
- [ ] Billing for the SaaS itself (Stripe)
- [ ] Backup / restore tooling

---

## Decision Log (architectural choices)

| Decision                        | Why                                                                  |
| ------------------------------- | -------------------------------------------------------------------- |
| Postgres over MySQL by default  | Better JSON, partial indexes, RLS for future tenancy                 |
| Sequelize over Prisma           | Code-first models, multi-dialect, mature migrations CLI              |
| JS (ES modules) on backend      | Matches user's MERN choice; can migrate to TS later w/o rewrite      |
| TS on admin portal & mobile     | Catches bugs in UI code where surface area is huge                   |
| UUID primary keys               | Safe for distributed systems, no row-counting leaks, SaaS-friendly   |
| `gym_id` reserved from day 1    | Avoids painful backfill when tenancy lands in Phase 7                |
| Layered services from day 1     | Keeps controllers thin, enables jobs/CLI/websockets later            |
