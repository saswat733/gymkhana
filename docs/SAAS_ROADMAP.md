## GymKhana — SaaS Product Roadmap (Phase-wise)

This roadmap is optimized for **shipping a gym business platform** (multi-tenant SaaS) rather than a single-gym app.

It’s organized into phases that map to revenue, retention, and operational readiness.

> **Progress (2026-06-20):** Phase A1/A2, B1 (Razorpay + billing UI), B2 (member GST PDF invoices), C1 (push), C2 (MRR dashboard), and D2 (entry pass + staff verify) are implemented. **Next 60 days:** see [IMPLEMENTATION_ROADMAP_60D.md](./IMPLEMENTATION_ROADMAP_60D.md) (deploy, member payments, programs, engagement). Production deploy details: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

---

## Phase A (Immediate) — SaaS Foundation (Non‑negotiable)

### A1 — Multi‑tenant architecture
**Goal**: the platform supports many gyms with **isolated data**.

- `gyms` table (tenant root)
- Every tenant-scoped table includes `gym_id`
  - users, members, plans, subscriptions, attendance, payments, trainers, announcements, workout plans, etc.
- JWT includes `gymId` claim for staff users
- Tenant middleware attaches `req.gymId`
- Every list/read/write is scoped by `gym_id` (no cross-tenant reads)
- Gym onboarding flow:
  - create gym
  - create gym owner user
  - seed default plans/templates for that gym

**Done when**
- Two gyms can exist in the same DB and never see each other’s data.

### A2 — Roles + permissions (real business hierarchy)
**Goal**: match real gym staffing and allow enterprise setups.

- Roles:
  - Owner (full control)
  - Manager (limited admin)
  - Receptionist (front desk)
  - Trainer
  - Member
- Permission system (not just roles)
  - e.g. `members.read`, `members.write`, `payments.write`, `plans.write`, `announcements.write`
- Admin portal screens gated by permissions

**Done when**
- A receptionist can record payments and manage attendance but can’t change plans/settings.

---

## Phase B — Monetization (Gym pays you)

### B1 — SaaS billing
**Goal**: gyms subscribe to *your* platform.

- SaaS plans (Basic / Pro / Enterprise)
- Subscription billing cycle (monthly/yearly)
- Usage limits by plan (members, trainers, storage, etc.)
- Grace periods + downgrade/lock rules
- Admin portal owner page: billing status + invoices + plan change

**Done when**
- A gym owner can sign up, start trial, and later pay to continue.

### B2 — Invoice + GST (India-first)
**Goal**: receipts and compliance that Indian gyms need.

- GST fields in gym profile
- Invoice numbering rules per gym
- PDF invoices for payments
- Downloadable receipts + invoice history

**Done when**
- A gym can generate GST invoices automatically for member payments.

---

## Phase C — Automation + Intelligence (Retention engine)

### C1 — Automated retention rules
- Rule engine:
  - not visited in 5 days → notify
  - expiry in 3 days → notify
  - expired → offer / reminder
- Channels:
  - Push (Expo)
  - Email (already supported)
  - WhatsApp later (integration)

### C2 — Revenue intelligence dashboard
- MRR / ARR
- Renewal rate, retention, churn
- LTV per member
- Payment failures + recovery
- Cohort insights (optional)

---

## Phase D — Growth + Scale

### D1 — CRM layer (leads + trials)
- Leads pipeline
- Trial users
- Follow-ups + reminders
- Conversion metrics

### D2 — Mobile as entry system
- Gym Entry QR Pass (member digital ID)
- Staff scanner verifies backend membership/subscription status

---

## Integration layer (ongoing)

Even when not fully built, keep architecture ready for:
- Payment gateways (Razorpay/Stripe)
- WhatsApp API
- Wearables (Fit/Health)

