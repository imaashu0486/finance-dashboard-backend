# Finance Dashboard Backend

This is the backend I built for a finance dashboard project.

I intentionally kept it simple enough to read quickly, but still production-minded in places where it matters (auth, validation, permission checks, and reporting queries).

## Why I picked this stack

- **Node.js + Express**: fast to iterate on, and easy to keep API boundaries clean.
- **MongoDB (Mongoose)**: reporting needs flexible querying + aggregation, and Mongo handles that well.
- **Joi**: request validation close to the route entry point, so bad payloads fail early.

## Project shape

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

I used a service layer because it keeps controllers thin and makes logic easier to test in isolation.

## Assumptions

1. There is no separate auth provider (Google/Auth0/etc.); login is local user/password.
2. Roles are controlled in app data (`admin`, `analyst`, `viewer`).
3. Financial records are soft-deleted, not physically removed.

## Trade-offs I made

- I kept a single codebase without introducing TypeScript to avoid setup overhead for this submission.
- `x-role` header support is still present for backward compatibility, but JWT role is the primary source.
- No background job queue was added; all analytics run on-demand using Mongo aggregations.

## API decisions (personal notes)

- **Service layer**: I wanted business logic out of route/controller files so endpoint handlers stay readable.
- **JWT**: added because role-based access without signed identity is easy to spoof. JWT fixed that quickly.
- **Refresh token rotation**: protects against long-lived token replay and gives cleaner session invalidation.
- **MongoDB**: chosen mainly for aggregation pipelines (`$group`, `$facet`) used by dashboard endpoints.

## Security/permission model

- JWT access token (`Authorization: Bearer ...`) protects private routes.
- Permission check middleware maps role -> allowed actions.
- Refresh token sessions are stored and revocable.

Permission map:

```js
{
  admin: ['create', 'read', 'update', 'delete', 'summary'],
  analyst: ['read', 'summary'],
  viewer: ['read']
}
```

## Swagger docs

- Swagger UI is available at:
  - `http://localhost:5000/api-docs`
- OpenAPI spec is generated from JSDoc comments in [src/docs/swagger.paths.js](src/docs/swagger.paths.js).

## Setup

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

## Environment variables

See [\.env.example](.env.example)

Required in practice:

- `MONGODB_URI`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

Useful optional values:

- `AUTH_COOKIE_ENABLED`
- `SWAGGER_SERVER_URL`

## Main endpoints

Base: `http://localhost:5000/api`

### Auth
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`

### Users
- `POST /users`
- `GET /users`
- `PATCH /users/:id`

### Financial records
- `POST /financial-records`
- `GET /financial-records` (filters + pagination + search)
- `PATCH /financial-records/:id`
- `DELETE /financial-records/:id` (soft delete)

### Dashboard
- `GET /dashboard/total-income`
- `GET /dashboard/total-expense`
- `GET /dashboard/net-balance`
- `GET /dashboard/category-wise`
- `GET /dashboard/monthly-trends`
- `GET /dashboard/last-transactions`
- `GET /dashboard/top-expense-categories`
- `GET /dashboard/summary`

## Verification scripts

- Smoke test: `npm run test:smoke`
- QA suite: `npm run test:qa`
- Live endpoint check script: [scripts/qa-live.ps1](scripts/qa-live.ps1)

## Submission cleanup notes

- Added [\.gitignore](.gitignore) with `.env` ignored.
- Kept runtime logs minimal (startup + request logs only).
- Removed repetitive helper naming and tightened wording in service/controller code.
