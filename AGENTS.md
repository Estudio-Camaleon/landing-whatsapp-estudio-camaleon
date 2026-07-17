# AGENTS.md — WhatsApp Landing Page System

## Stack
- **Frontend:** Vanilla HTML + CSS + JS (ES modules, no framework). Uses `var` not `const/let`.
- **Backend:** JS (ESM) Vercel Serverless Functions in `api/`, served by `@vercel/node`.
- **DB:** Supabase (PostgreSQL). Schema in `supabase/schema.sql`, migrations in `supabase/migrations/`.
- **Auth:** Custom HMAC-SHA256 token (JWT-like), not Supabase Auth.
- **Test:** Vitest (node env, `tests/**/*.test.js`).
- **CI/CD:** GitHub Actions → semantic-release → Vercel deploy.
- **No linter, no formatter, no TypeScript.** No `tsconfig.json` exists.

## Key Commands
| Command | What |
|---|---|
| `npm run dev` | Custom Express dev server (`node dev-server.js`) — loads API handlers dynamically |
| `npm run dev:vercel` | `vercel dev` (Vercel's local server) |
| `npm test` | `vitest run` — single auth test (needs `ADMIN_PASSWORD` set) |
| `npm run test:watch` | `vitest` |
| `npm run build` | no-op |
| `npx semantic-release` | Release (main only) |
| `npx vercel deploy --prod` | Production deploy |

## Dev Server Quirks
- `dev-server.js` is an Express server wrapping Vercel API handlers from `api/*.js`.
- API routes are registered in an `API_ROUTES` array inside `dev-server.js` — if you add a new API file, add it there too.
- On Windows, dynamic imports use `file:///` URL prefix.
- Loads `.env.local` for env vars.

## Architecture
- **Entrypoint:** `index.html` → `<script type="module" src="main.js">`
- **Frontend services:** `services/config.js`, `services/themes.js`, `services/ui.js`, `services/brand-loader.js`, `services/api.js`
- **API endpoints** (all GET/POST/PUT/DELETE under `/api/`):
  - `/assign-vendor` — rewrite to `/api/assign-vendor` (this is the main public endpoint)
  - `/auth/login`, `/brands`, `/vendors`, `/sucursales`, `/events`, `/upload-asset`, `/brand-config`, `/public-brands`, `/get-stats`, `/get-vendors`
- **Brand detection:** `?brand=slug` query param → custom domain → fallback default
- **Cooldown:** 5min per IP (stored in Supabase events table + localStorage frontend cache)
- **Round-robin:** Independent per brand, stored in `rotation_state` table

## Testing
- Only one test file: `tests/main.test.js` — tests `signToken`/`verifyToken` from `api/_lib/auth.js`.
- Test sets `process.env.ADMIN_PASSWORD = "test-secret"` in `beforeAll`.
- Run standalone: `npx vitest run tests/main.test.js`

## DB Notes
- Schema is **idempotent** (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- `brands` table has presentation columns (`theme`, `heading`, `button_text`, padding/spacing fields) added via a migration.
- `brands-data.js` in `api/_lib/` provides static fallback config when DB is empty.
- Storage bucket `brand-assets` must be created manually in Supabase dashboard.
- RLS policies allow anon SELECT on most tables, admin CRUD via service role key.

## Deploy
- CI runs test → semantic-release (bumps version + git tag) → `vercel deploy --prod`.
- Node version discrepancies: `.nvmrc` = 24, `package.json` engines = 20.x, CI = 22. CI wins.
- Vercel includes security headers (HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- `.vercelignore` excludes tests, vitest config, CI config, README, env files.

## Admin Panel
- SPA at `apps/admin/` (login at `/login`, dashboard at `/apps/admin/`).
- Auth token stored in `localStorage` key `wa-admin-token`.
- API calls from admin use Bearer token header, checked in each admin API endpoint.
