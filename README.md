# Finance Dashboard Backend

A role-based finance dashboard backend with authentication, analytics APIs, and clean architecture.

This is the backend I built for a finance dashboard project.

I kept it straightforward to review, but production-minded in the areas that matter most: auth, validation, role checks, and dashboard aggregations.

## Quick Start (2 min)

- Swagger (deployed): `https://finance-dashboard-backend-gg5d.onrender.com/api-docs`
- Admin demo login:
  - email: [admin@demo.com](mailto:admin@demo.com)
  - password: `Admin@123`
- Use Swagger UI to test APIs.

## Demo credentials

Admin:
- email: [admin@demo.com](mailto:admin@demo.com)
- password: `Admin@123`

Analyst:
- email: [analyst@demo.com](mailto:analyst@demo.com)
- password: `Analyst@123`

Viewer:
- email: [viewer@demo.com](mailto:viewer@demo.com)
- password: `Viewer@123`

These users are auto-seeded on startup if they don’t exist.

## Tech stack (and why)

- **Node.js + Express**: quick iteration, clean API layering.
- **MongoDB + Mongoose**: good fit for flexible record queries and dashboard aggregations.
- **Joi**: request validation at the API boundary.
- **JWT (access + refresh rotation)**: stateless auth with safer session handling.

## Project structure

```text
src/
  app.js
  server.js
  config/
  constants/
  controllers/
  docs/
  middleware/
  models/
  routes/
  services/
  utils/
  validators/
scripts/
postman/
```

I use a service layer to keep controllers thin and business logic easier to reason about.

## Role-based access control

Permission map:

```js
{
  admin: ['create', 'read', 'update', 'delete', 'summary'],
  analyst: ['read', 'summary'],
  viewer: ['summary'],
  user: ['read']
}
```

Role behavior:
- `viewer`: dashboard-only access (summary endpoints).
- `analyst`: read records + dashboard insights.
- `admin`: full management access.

## API overview

Base URL (deployed): `https://finance-dashboard-backend-gg5d.onrender.com/api`

Auth:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`

Users:
- `POST /users`
- `GET /users`
- `PATCH /users/:id`

Financial records:
- `POST /financial-records`
- `GET /financial-records` (pagination, filters, search)
- `PATCH /financial-records/:id`
- `DELETE /financial-records/:id` (soft delete)

Dashboard:
- `GET /dashboard/total-income`
- `GET /dashboard/total-expense`
- `GET /dashboard/net-balance`
- `GET /dashboard/category-wise`
- `GET /dashboard/monthly-trends`
- `GET /dashboard/last-transactions`
- `GET /dashboard/top-expense-categories`
- `GET /dashboard/summary`

## Register API

Endpoint: `POST /api/auth/register`

Request body:

```json
{
  "name": "Test User",
  "email": "test.user@example.com",
  "password": "StrongPass123",
  "role": "user"
}
```

Notes:
- `role` is optional (defaults to `user`).
- Duplicate emails return `409`.
- Password is hashed before storage.

## cURL example (login)

```bash
curl -X POST "https://finance-dashboard-backend-gg5d.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin@123"}'
```

## Setup (local)

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
copy .env.example .env
```

3. Run app

```bash
npm run dev
```

or

```bash
npm start
```

Swagger local URL: `http://localhost:5000/api-docs`

## Environment variables

See [\.env.example](.env.example)

Required:
- `MONGODB_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

Optional:
- `AUTH_COOKIE_ENABLED`
- `SWAGGER_SERVER_URL`

## Deployment (Render)

Live service:
- API base: `https://finance-dashboard-backend-gg5d.onrender.com/api`
- Swagger: `https://finance-dashboard-backend-gg5d.onrender.com/api-docs`
- Health: `https://finance-dashboard-backend-gg5d.onrender.com/health`

`render.yaml` is included, so deploy via Render Blueprint.

## Assumptions

1. No external auth provider (Google/Auth0 etc.); auth is local email/password.
2. Role behavior is enforced at middleware level.
3. Financial records are soft deleted (not physically removed).

## Trade-offs

- Kept JavaScript (no TypeScript) to reduce setup overhead for this submission.
- Kept `x-role` header fallback for compatibility; JWT role is the primary source.
- Dashboard analytics are computed on demand (no background jobs).

## Verification scripts

- Smoke test: `npm run test:smoke`
- QA suite: `npm run test:qa`
- Live endpoint checks:
  - [scripts/qa-live.ps1](scripts/qa-live.ps1)
  - [scripts/verify-deployed.ps1](scripts/verify-deployed.ps1)
  - [scripts/verify-deployed-latest.ps1](scripts/verify-deployed-latest.ps1)
  - [scripts/verify-deployed-extra.ps1](scripts/verify-deployed-extra.ps1)

## Reviewer quick check

This project can be validated quickly:
1. Open the Swagger URL.
2. Login using the admin demo credentials.
3. Call core endpoint groups: `/auth`, `/financial-records`, and `/dashboard`.

Key details (demo users, base URL, seeded accounts, and role behavior) are documented above for fast evaluation.
