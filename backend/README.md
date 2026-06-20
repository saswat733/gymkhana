# GymKhana Backend

Node.js + Express + Sequelize REST API. Single source of truth for the platform.

## Folder Structure

```
backend/
├── src/
│   ├── config/                # env, database, sequelize-cli, logger
│   │   ├── env.js
│   │   ├── database.js
│   │   ├── sequelize.cjs
│   │   └── logger.js
│   ├── api/
│   │   ├── routes/            # one file per resource + index.js aggregator
│   │   ├── controllers/       # thin: parse request → call service → respond
│   │   ├── middlewares/       # auth, RBAC, validation, error
│   │   └── validators/        # Joi schemas per resource
│   ├── services/              # ALL business logic lives here
│   ├── models/                # Sequelize models + index.js (associations)
│   ├── db/
│   │   ├── migrations/        # versioned schema changes
│   │   └── seeders/           # default data (admin, etc.)
│   ├── utils/                 # ApiError, ApiResponse, asyncHandler, jwt, pagination
│   ├── constants/             # roles, enums
│   ├── jobs/                  # scheduled background jobs (cron)
│   ├── app.js                 # Express app factory
│   └── server.js              # Entry: connect DB → start HTTP server
├── tests/
├── .env.example
├── .sequelizerc
└── package.json
```

## Layered Architecture

```
HTTP Request
   ↓
[ Route ]            -> defines URL + middleware chain
   ↓
[ Validator (Joi) ]  -> rejects bad input early (422)
   ↓
[ Auth + RBAC ]      -> attaches req.user, enforces role
   ↓
[ Controller ]       -> ONLY translates between HTTP and the service layer
   ↓
[ Service ]          -> business rules, transactions, orchestration
   ↓
[ Model (Sequelize) ]-> SQL access; no business logic here
```

**Rule of thumb:** if you find an `if` checking a business rule in a controller,
move it to the service. Controllers are dumb adapters.

## Running Locally

1. Install **Postgres** *or* **MySQL** locally.
2. Copy env and edit values:

   ```bash
   cp .env.example .env
   ```

3. Install deps, create the database (if missing), migrate, seed:

   ```bash
   npm install
   npm run db:create
   npm run db:migrate
   npm run db:seed
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

5. Smoke test:

   ```bash
   curl http://localhost:4000/api/v1/health

   curl -X POST http://localhost:4000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@gymkhana.local","password":"Admin@12345"}'
   ```

### Switching to MySQL

In `.env`:

```
DB_DIALECT=mysql
DB_PORT=3306
```

Then install the driver:

```bash
npm install mysql2
```

### Migrations + `"type": "module"`

This repo uses ES modules (`"type": "module"`). Sequelize CLI migrations must be **CommonJS** files with a
`.cjs` extension (otherwise Node treats `.js` migrations as ESM and `module.exports` breaks).

## API Conventions

All responses use a single envelope. See [`../docs/API.md`](../docs/API.md).

```jsonc
// success
{ "success": true,  "message": "OK", "data": { ... }, "meta": { ... } }

// error
{ "success": false, "message": "...", "error": { "code": "...", "details": [...] } }
```

## Adding a New Resource (Recipe)

1. **Model** — `src/models/Foo.js`, register in `src/models/index.js`.
2. **Migration** — `npx sequelize-cli migration:generate --name create-foos` and edit **as `*.cjs`**.
3. **Validator** — `src/api/validators/foo.validator.js` (Joi schemas).
4. **Service** — `src/services/foo.service.js` (all business logic).
5. **Controller** — `src/api/controllers/foo.controller.js` (thin).
6. **Routes** — `src/api/routes/foo.routes.js`, mount it in `routes/index.js`.
7. Run `npm run db:migrate` and write a test.

## Available Scripts

| Script              | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start with auto-reload (nodemon)       |
| `npm start`         | Production start                       |
| `npm run db:create` | Create `DB_NAME` if missing (mysql/pg) |
| `npm run db:migrate`| Apply pending migrations               |
| `npm run db:seed`   | Run all seeders (idempotent)           |
| `npm run db:reset`  | Drop everything, re-migrate, re-seed   |
| `npm run lint`      | ESLint                                 |
| `npm test`          | Run tests in `tests/`                  |
