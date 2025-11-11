# Next.js Core Concepts (Practical Cheat‑Sheet)

This guide is for developers transitioning to Next.js (App Router, v13+) from other stacks (e.g., Python/ML). It focuses on mental models, the key primitives, and how to build production features quickly.

## Mental Model

- Full‑stack React framework: Server and Client components in one project.
- File‑system routing: Folders and files drive routes (no router config).
- Hybrid rendering: Static, SSR, ISR, Edge runtimes — pick per route.
- Convention over configuration: Most behavior is opt‑in via file names and exports.

## App Router Basics

- `app/` directory contains routes as folders. Special files:
  - `app/layout.tsx`: root layout (HTML shell, header, global UI).
  - `app/page.tsx`: the route’s main page component (`/`).
  - `app/<segment>/page.tsx`: child routes (`/segment`).
  - `app/<segment>/[id]/page.tsx`: dynamic routes (`/segment/:id`).
  - `app/<segment>/loading.tsx`: streaming fallback while data loads.
  - `app/<segment>/error.tsx`: route‑scoped error boundary.
- Co‑locate UI and data logic by route.

## Server vs Client Components

- Server Components (default): run on the server, can access secrets, DBs, fetch directly; no browser JS by default.
- Client Components: add `'use client'` at the top; run in the browser, can use state, effects, event handlers.
- Compose: Server components can render client components as children; lift up data fetching to servers, keep interactivity in clients.

## Data Fetching

- Use the built‑in `fetch` in Server Components to call APIs/DBs. It’s automatically cached unless `{ cache: 'no-store' }`.
- Read request context with `headers()` and `cookies()` from `next/headers` in Server Components or Server Actions.
- For dynamic data with SSR: set `fetch(..., { cache: 'no-store' })` or export `dynamic = 'force-dynamic'`.
- For static data: allow the default cache, or export `revalidate = <seconds>` for ISR.

## Server Actions (Forms without custom APIs)

- Define async functions annotated with `'use server'` directly in components and pass them to `form action`.
- They run on the server and can perform writes, revalidate paths, and redirect.
- Typical pattern:
  - Process input
  - Call database/API
  - `revalidatePath('/target')`
  - `redirect('/target')` (Next returns `303` to force a fresh `GET`)

## Routing and Navigation

- Links: use `<a href="/route">` or `<Link href="/route">` in client components.
- Dynamic params: route folder `[id]` exposes `{ params: { id } }` in a Server Component.
- Redirects: use `redirect('/path')` in Server Components/Actions; middleware can intercept globally.

## Caching and Revalidation

- Default fetch in Server Components caches per request and can persist across builds.
- Bust caches with `revalidatePath('/route')` (per‑route) or `revalidateTag('tag')` (per‑resource tagging).
- Use `{ cache: 'no-store' }` for always‑fresh reads (admin pages, dashboards).

## API Routes

- App Router APIs live under `app/api/<name>/route.ts`.
  - Export HTTP methods: `export async function GET(req) {}`, `POST`, `PUT`, `DELETE`.
  - Return `NextResponse.json(...)` or streams.
- Use for external integrations, webhooks, custom endpoints, or as a thin layer around your DB.

## Middleware

- `middleware.ts` runs before requests; can `next()`, `redirect()`, or rewrite.
- Good for auth gates, locale routing, legacy redirects.
- `export const config = { matcher: ['/protected/:path*'] }` controls which paths run middleware.

## Environment and Secrets

- `process.env.*` via `.env.local` for dev; load with Next automatically.
- Server Components, Server Actions, and APIs can safely use secrets.
- Client Components must never embed secrets; call APIs instead.

## Styling

- Works with CSS Modules, TailwindCSS, or any CSS‑in‑JS.
- Add global styles in `app/globals.css` and per‑component styles via classes.

## Auth Patterns (Minimal to Robust)

- Minimal: cookie sessions + middleware gate (as in this project).
- Robust: NextAuth/Auth.js, JWTs or session stores, CSRF protection for forms.
- Always set `httpOnly`, `secure` (HTTPS), and `sameSite` cookies for production.

## Error Handling

- Route‑scoped: `error.tsx` and `loading.tsx` for graceful failure/streaming.
- Programmatic: try/catch in Server Actions and APIs; return meaningful status codes.

## Performance Tips

- Prefer Server Components for data fetching and heavy logic — no client JS.
- Use streaming (`loading.tsx`) for long network calls.
- `dynamic = 'error' | 'force-static' | 'force-dynamic'` to control rendering.
- Memoize large client lists; use `React.Suspense` for deferred UI.

## Local Dev Workflow

- Start dev: `npm run dev` and open the printed local URL.
- Inspect server logs for route/build status and API responses.
- Co‑locate feature logic per route; iterate quickly with server actions.

## Production Deployment (Overview)

- Build: `npm run build`; Start: `npm run start`.
- Environment: set `.env` on the host/provider.
- Edge vs Node runtimes: choose per route based on API/DB needs.

## How It Maps to Python/ML Mindset

- Server Components ≈ server‑side controllers/views — secure, fast, stateless per request.
- Client Components ≈ browser‑side widgets — interactive UI only.
- Server Actions ≈ RPC endpoints triggered by forms — no manual routing needed.
- Middleware ≈ request interceptors — central auth/redirect logic.
- File‑system routes ≈ URLConf by folder structure — minimal boilerplate.

## Practical Patterns in This Codebase

- Session middleware: allows `/api/*` and `/login`, gates app pages, redirects unauthenticated users.
- Edit form: server action performs an update, then `revalidatePath('/')` and `redirect('/')`.
- Swagger UI: `GET /api/openapi` serves spec, `/apis` renders interactive docs.

## Essential Imports (by use‑case)

- `next/headers`: `headers()`, `cookies()` for request context.
- `next/cache`: `revalidatePath`, `revalidateTag` for cache control.
- `next/navigation`: `redirect()` in server; `useRouter()` in client.
- `next/server`: `NextRequest`, `NextResponse` for API routes and middleware.

## Minimal Examples

- Server Page (SSR):

```ts
// app/users/page.tsx
import { headers } from 'next/headers';
export default async function UsersPage() {
  const host = headers().get('host');
  const res = await fetch(`http://${host}/api/users`, { cache: 'no-store' });
  const data = await res.json();
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

- Server Action (form submit):

```tsx
// app/profile/page.tsx
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export default function ProfilePage() {
  async function save(formData: FormData) {
    'use server';
    const name = String(formData.get('name'));
    await fetch('/api/profile', { method: 'PUT', body: JSON.stringify({ name }) });
    revalidatePath('/profile');
    redirect('/profile');
  }
  return <form action={save}><input name="name" /><button>Save</button></form>;
}
```

- API Route:

```ts
// app/api/users/route.ts
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json([{ id: 1, name: 'Ada' }]);
}
```

## Debugging Checklist

- Build errors: check files under `app/` for missing default exports and invalid async functions.
- Route not found: folder/file naming must match the URL; dynamic params use `[param]`.
- Server Action returning 303: expected; it triggers a fresh GET. Use client‑side fetch if you need a 200 in place.
- Cookies not reflected in UI: server‑rendered components show cookie state on full page loads; re‑navigate to update.

---
Use this guide as a quick reference while developing. Expand with project‑specific patterns (auth, DB, background jobs) as your app grows.