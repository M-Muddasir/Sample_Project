# Sample Project (Next.js + Payload CMS)

This project is a Next.js 14 application with a small CMS layer using Payload (Postgres adapter). It lets you:

- Manage "API Spec Jobs" that store generated OpenAPI specs from documentation URLs.
- View and edit job records (status/result), and preview generated specs via Swagger UI.
- Authenticate with a minimal cookie-based session using a custom `app-users` collection.
- Explore and call app APIs through an interactive Swagger page.

## Stack

- `Next.js 14` App Router, Server Components, Server Actions
- `Payload CMS v3` with `@payloadcms/db-postgres`
- `Postgres` persistence
- `TailwindCSS` for basic styles
- `swagger-ui-react` for interactive API docs

## Quick Start

1) Create `.env.local` with required variables:

```
PAYLOAD_SECRET=dev-secret
PAYLOAD_SERVER_URL=http://localhost:3003
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<db>
OPENAI_API_KEY=<your-openai-key>
```

2) Install and run dev:

```
npm install
npm run dev
```

The dev server typically runs at `http://localhost:3003` (ports may increment if 3000–3002 are busy).

## Data Model

Defined in `payload.config.ts`:

- `api-spec-jobs`
  - `url: text`
  - `status: select('done' | 'error')`
  - `result?: textarea` (OpenAPI JSON)
  - `error?: textarea`

- `app-users`
  - `username: text`
  - `passwordHash: text` (scrypt-based hash)

Admin UI is disabled: `admin: { disable: true }`. Authentication is custom via `sessionUser` cookie.

## Authentication

- `POST /api/auth/register` — body `{ "username": string, "password": string }` → stores scrypt hash in `app-users`.
- `POST /api/auth/login` — body `{ "username", "password" }` → verifies credentials and sets `sessionUser` cookie.
- `POST /api/auth/logout` — clears `sessionUser` cookie.

`middleware.ts` enforces session for app pages (`/`, `/edit/*`, `/spec/*`, `/apis`) and allows `/api/*`, assets, and `/login` without auth.

## Pages

- `/` — Home. Lists jobs; delete and generate actions.
- `/edit/[id]` — Edit a job’s `status` and `result`. Save action revalidates `/` and redirects to it.
- `/spec/[id]` — Preview the job’s `result` JSON with Swagger.
- `/apis` — Interactive Swagger UI for calling app APIs.
- `/login` — Client page for register/login.

## API Routes

- `GET /api/jobs` — list jobs; optional `?id=<id>` returns a single job.
- `PUT /api/jobs` — update a job: body `{ id: string, data: object }`.
- `DELETE /api/jobs` — delete a job: body `{ id: string }`.

- `POST /api/generate-openapi` — body `{ urls: string[], model?: string }`. Fetches docs (first public, subsequent private via code-defined creds), generates OpenAPI JSON, and persists `api-spec-jobs` if DB configured.

- `GET /api/openapi` — exposes an OpenAPI spec for the app’s endpoints, used by `/apis`.

- `POST /api/auth/register` — create user.
- `POST /api/auth/login` — login and set cookie.
- `POST /api/auth/logout` — logout and clear cookie.

## Development Notes

### Database & Migrations

This project uses the Postgres adapter. Ensure `DATABASE_URL` points to a reachable database before using registration or persistence features.

For a fresh dev setup (to create tables for current config):

```
npx payload migrate:fresh --config ./payload.config.ts
```

Alternative migration commands:

```
npx payload migrate:create --config ./payload.config.ts
npx payload migrate --config ./payload.config.ts
npx payload migrate:status --config ./payload.config.ts
npx payload generate:db-schema --config ./payload.config.ts
```

`payload-generated-schema.ts` is produced by `generate:db-schema` and reflects the current config.

### Server Actions & Redirects

Next.js Server Actions often respond with `303` to trigger a fresh `GET`. In this project:

- Edit save redirects to `/` after `revalidatePath('/')`.
- Delete redirects back to `/` so the list updates immediately.

### Environment Requirements

- `OPENAI_API_KEY` is required to use `/api/generate-openapi`.
- The login flow requires `DATABASE_URL` to persist users.

## Running End-to-End

1) Set `.env.local` and start dev: `npm run dev`.
2) Visit `http://localhost:3003/login` to register and log in.
3) On `/`, paste documentation URLs and click Generate; refresh the list to see new jobs.
4) Use Edit to update a job, Save to return to the main page.
5) Use Swagger Preview `/spec/[id]` to inspect generated OpenAPI JSON.
6) Try API Explorer at `/apis` to call app APIs interactively.
7) Use Logout in the navbar when done.

## Troubleshooting

- Registration returns `500`:
  - Ensure `DATABASE_URL` is set and reachable.
  - Run a migration to create `app-users` and other tables: `npx payload migrate:fresh --config ./payload.config.ts` (dev only; drops/recreates tables).

- `/apis` not accessible:
  - The page is behind session middleware. Log in first or remove `/apis` from the `matcher` in `middleware.ts`.

- Ports increment to `3003` or higher:
  - Other local apps occupy ports; Next will auto-select an available port and print it in dev logs.

## Project Structure

```
app/
  api/
    auth/ (register, login, logout)
    jobs/ (GET/PUT/DELETE job records)
    generate-openapi/ (create job specs)
    openapi/ (OpenAPI spec for the app)
  apis/ (Swagger UI page for APIs)
  edit/[id]/ (edit page)
  spec/[id]/ (Swagger preview page)
  login/ (client login/register page)
  ui/ (NavBar, SwaggerUIViewer)
middleware.ts (session, legacy route redirects)
payload.config.ts (collections and adapter)
payload-types.ts (generated)
payload-generated-schema.ts (generated DB schema)
```

## Security

- The project uses HTTP-only `sessionUser` cookie for minimal authentication. In production, use secure cookies (`secure`, `sameSite`), HTTPS, and robust auth.
- The `generate-openapi` route contains code for fetching documentation that may include private auth flows. Review and secure before production use.

## Scripts

- `npm run dev` — start Next dev server
- `npm run build` — build
- `npm run start` — start production build

## License

This project is for demonstration. Add your preferred license if needed.