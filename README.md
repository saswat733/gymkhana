# GymKhana — Gym Management Platform

A modular, scalable **Gym Management System** built as a long-term product.
The system consists of:

- **Backend API** — Node.js + Express + Sequelize (SQL) — single source of truth for all business logic.
- **Admin Portal** — React (Vite) web app for gym owners and staff.
- **Mobile App** — React Native (Expo) app for gym members.

The architecture is designed to evolve into a **multi-tenant SaaS** for many gyms.

---

## Repository Layout (Monorepo)

```
gymKhana/
├── backend/          # Node.js + Express + Sequelize REST API  (Phase 1–2)
├── admin-portal/     # React + Vite admin dashboard            (Phase 3)
├── mobile-app/       # React Native (Expo) member app          (Phase 4)
├── docs/             # Architecture, API conventions, roadmap
├── gymkhana.md       # Original product vision document
└── README.md
```

Each package is **independent** — has its own `package.json`, env, and lifecycle.
The backend is the contract; both clients consume it via REST.

---

## Quick Start (Backend)

> Prereqs: Node.js ≥ 18, npm ≥ 9, PostgreSQL ≥ 14 (or MySQL ≥ 8).

```bash
cd backend
npm install
cp .env.example .env       # then edit DB_* and JWT_* values
npm run db:migrate         # create tables
npm run db:seed            # create default admin user
npm run dev                # start on http://localhost:4000
```

Verify the server is healthy:

```bash
curl http://localhost:4000/api/v1/health
```

Default seeded admin (change after first login):

```
email:    admin@gymkhana.local
password: Admin@12345
```

---

## What's Built Right Now (Phase 1 — Foundation)

- ✅ Modular folder structure (config, api, services, models, utils, db)
- ✅ Express app with security middleware (helmet, cors, rate-limit)
- ✅ Sequelize ORM connected to SQL DB (Postgres default, MySQL ready)
- ✅ JWT auth (access + refresh), bcrypt password hashing
- ✅ Role-based access control (`admin`, `trainer`, `member`)
- ✅ Centralized error handling + standard API response shape
- ✅ Joi request validation pipeline
- ✅ Winston structured logging + Morgan HTTP logs
- ✅ Migration & seeder workflow via `sequelize-cli`
- ✅ Health check endpoint
- ✅ Environment-based config (dev / prod)

## What Comes Next

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phased plan.

| Phase | Scope                                              | Status      |
| ----- | -------------------------------------------------- | ----------- |
| 1     | Backend foundation + auth                          | ✅ Complete |
| 2     | Core business logic (members, plans, attendance, payments) | ⏭ Next  |
| 3     | Admin Portal (React + Vite)                        | Planned     |
| 4     | Mobile App (React Native + Expo)                   | Planned     |
| 5     | Integration & optimization                         | Planned     |
| 6     | Advanced features (reminders, analytics, push)     | Planned     |
| 7     | Multi-tenant SaaS refactor                         | Planned     |

---

## Engineering Principles

1. **Backend is the source of truth.** No business logic in clients.
2. **Layered architecture.** `routes → controllers → services → models`.
3. **Stateless API.** JWT-based, horizontally scalable.
4. **Consistent contracts.** All responses follow a standard envelope.
5. **Migrations always.** Never hand-edit the database schema.
6. **Validate at the edge.** Joi on every request body / params / query.
7. **Tenant-ready from day one.** Models include hooks for future `gym_id` scoping.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/API.md`](docs/API.md).

---

## License

Proprietary — internal product. Not yet published.
