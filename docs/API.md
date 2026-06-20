# API Conventions

Base URL: `http://localhost:4000/api/v1` (configurable via `API_PREFIX`).

## Response Envelope

### Success

```json
{
  "success": true,
  "message": "OK",
  "data": { "...": "..." },
  "meta": { "page": 1, "pageSize": 20, "total": 132 }   // when paginated
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "UNPROCESSABLE",
    "details": [
      { "field": "email", "message": "must be a valid email", "in": "body" }
    ]
  }
}
```

| HTTP | Code             | Meaning                              |
| ---- | ---------------- | ------------------------------------ |
| 400  | `BAD_REQUEST`    | Malformed request                    |
| 401  | `UNAUTHORIZED`   | No / bad / expired token             |
| 403  | `FORBIDDEN`      | Authenticated but role forbidden     |
| 404  | `NOT_FOUND`      | Resource missing                     |
| 409  | `CONFLICT`       | E.g. duplicate email                 |
| 422  | `UNPROCESSABLE`  | Joi or Sequelize validation failure  |
| 500  | `INTERNAL`       | Anything unexpected                  |

## Endpoints (Phase 1)

### Health

```
GET /health
→ 200 { data: { status, uptimeSeconds, timestamp, services: { db } } }
```

### Auth

```
POST /auth/register
body:  { name, email, phone?, password }
→ 201 { data: { user, accessToken, refreshToken } }

POST /auth/login
body:  { email, password }
→ 200 { data: { user, accessToken, refreshToken } }

POST /auth/refresh
body:  { refreshToken }
→ 200 { data: { accessToken, refreshToken } }

GET  /auth/me
auth:  Bearer access token
→ 200 { data: { user } }
```

## Endpoints (Phase 2)

### Plans (admin only)

```
GET    /plans
POST   /plans
GET    /plans/:id
PATCH  /plans/:id
PATCH  /plans/:id/active
```

### Members (admin + trainer)

```
GET    /members
POST   /members
GET    /members/:id
PATCH  /members/:id
PATCH  /members/:id/active
```

### Subscriptions

```
GET   /subscriptions
auth: Bearer

Notes:
- `admin` / `trainer`: can list/filter broadly (`memberId`, `status`, `q`, pagination)
- `member`: automatically scoped to their own member profile

POST  /subscriptions
auth: admin/trainer
body: { memberId, planId, startsAt?, autoRenew? }

POST  /subscriptions/:id/cancel
auth: admin/trainer OR the owning member

POST  /subscriptions/:id/renew
auth: admin/trainer
```

### Attendance

```
POST /attendance/check-in
auth: admin/trainer OR member (member may only pass their own memberId)
body: { memberId, source? }

POST /attendance/check-out
auth: admin/trainer OR member (member may only pass their own memberId)
body: { memberId }

GET /attendance
auth: admin/trainer
query: ?page=&pageSize=&sort=&memberId=&from=&to=
```

### Payments

```
GET /payments
auth: Bearer
query: ?subscriptionId=<uuid>&page=&pageSize=&sort=

Notes:
- `admin` / `trainer`: can list payments for any subscriptionId
- `member`: can list payments only for subscriptions they own

POST /payments
auth: admin/trainer
headers:
  Idempotency-Key: <string>   (required)
body:
{
  "subscriptionId": "<uuid>",
  "amountCents": 99900,
  "currency": "INR",
  "method": "cash|upi|card|...",
  "status": "paid|pending|failed|refunded",
  "paidAt": "<iso optional>",
  "gatewayRef": "<optional>",
  "notes": "<optional>"
}

Idempotency rules:
- Repeating the same Idempotency-Key with the same payload returns the same payment (safe retries).
- Reusing the key with a different payload returns 409.
```

## Auth Header

```
Authorization: Bearer <accessToken>
```

## Pagination (convention for future endpoints)

Query params: `?page=1&pageSize=20&sort=createdAt:desc`
Response includes `meta: { page, pageSize, total, totalPages }`.

## Filtering / Search (convention)

- Use scalar query params for exact matches: `?role=member`.
- Use `q` for free-text search: `?q=john`.
- Date ranges: `?from=2026-01-01&to=2026-01-31`.

## Versioning

URL-versioned (`/api/v1`). Breaking changes go to `/api/v2`; we keep v1 alive
for a deprecation window.
