# AGENTS.md — bunnysave-clone (省钱兔)

A faithful Next.js 15 App Router clone of [bunnysave.com](https://www.bunnysave.com/). RSC-first, statically rendered from scraped JSON, with NextAuth v5 + Neon Postgres for auth.

This file documents non-obvious knowledge — commands, patterns, and gotchas that take trial-and-error to discover.

## Quick start

```bash
pnpm install
pnpm dev                # http://localhost:3000
pnpm build && pnpm start
pnpm lint               # next lint

# Populate the Postgres deal catalog from src/data/*.json (required once
# before first dev/build so /, /category/*, /deal/*, /sitemap.xml have data):
pnpm db:seed
```

Python is needed for the data scraper (uses the vendored venv):

```bash
.venv/bin/python scripts/parse.py   # canonical parse script (uses .venv/bin/python)
python3 scripts/scrape.py            # raw scrape (writes data/homepage.html)
```

The repo uses **pnpm** (lockfile is `pnpm-lock.yaml`). Node 20+, pnpm 10+, Python 3.11+.

## Architecture

### Data flow

```
bunnysave.com (HTML)
  └─ scripts/scrape.py        → data/homepage.html, data/image_urls.json, data/deals_raw.json
  └─ scripts/parse.py         → src/data/deals.json, src/data/brands.json
                                (images also copied to public/images/{deals,brands,site}/)

src/data/*.json (static)
  └─ src/lib/deals.ts         → getDeals() / getBrands() / getDeal() (server-only, fs.readFile)
  └─ src/app/page.tsx         → HomePage (RSC, revalidate=300s)
  └─ src/app/category/[...slug]/page.tsx
  └─ src/app/deal/[id]/page.tsx
  └─ src/app/sitemap.ts
```

Deals/brands/categories live in **three layers**:
1. `data/` — raw scrape artifacts (gitignored for `homepage.html`).
2. `src/data/` — committed seed JSON (`deals.json`, `brands.json`).
3. **Postgres (runtime)** — `categories`, `brands`, `deals`, `deal_categories` tables, created lazily by `ensureSchema()` in `src/lib/db.ts`. This is what the app actually reads at request time.

To regenerate from the scrape pipeline: `pnpm parse && pnpm db:seed`. The seed script (`scripts/seed.ts`) upserts brands + deals from `src/data/*.json`, populates the category tree, and auto-classifies each deal into the categories whose keywords match its title.

### Routing map

| Route                          | File                                              | Type |
| ------------------------------ | ------------------------------------------------- | ---- |
| `/`                            | `src/app/page.tsx`                                | RSC, revalidate=300 |
| `/category/[...slug]`          | `src/app/category/[...slug]/page.tsx`             | RSC, revalidate=600, has `generateStaticParams` for parent + subs |
| `/deal/[id]`                   | `src/app/deal/[id]/page.tsx`                      | RSC, revalidate=600, `generateStaticParams` from `getDeals()` |
| `/search`                      | `src/app/search/page.tsx`                         | RSC, server-side filter (case-insensitive `includes`) |
| `/stores`                      | `src/app/stores/page.tsx`                         | RSC, all brands w/ `q=` filter |
| `/account`                     | `src/app/account/page.tsx`                        | Suspense → `AccountPanel` (client) |
| `/account/favorites`           | `src/app/account/favorites/page.tsx`              | Stub (no real favorites yet) |
| `/login`, `/signup`, `/login/forgot` | thin wrappers around `<AuthPage>`           | Client component, `Suspense` |
| `/submit`                      | RSC shell + `<SubmitForm>` client component       |     |
| `/legal/{affiliate-disclosure,privacy,terms}` | static                         |     |
| `/sitemap-info`                | human-readable sitemap                            |     |
| `/api/auth/[...nextauth]`      | re-exports `@/auth-handler` (`{GET,POST}`)        |     |
| `/api/auth/signup`             | bcrypt + insert user, **does not call `signIn()`** |     |
| `/api/auth/magic/request`      | POST — auto-create user + insert magic_link token |     |
| `/api/auth/magic`              | GET — consume token, set `magic_email_pending` cookie, redirect to `/` |     |
| `/api/newsletter`              | POST — validates email, currently **does not persist** (filesystem is read-only on Vercel) |     |
| `/api/submit`                  | POST — validates title + http(s) URL, `console.log`s the payload |     |

### Server vs client components

- All `src/app/**/page.tsx` are **RSC by default**; only files with `"use client"` are client components.
- Client components: `Header`, `Footer`, `SearchBar`, `NewsletterForm`, `Sidebar`, `AccountPanel`, `AuthPage`, `ForgotForm`, `SubmitForm`, `DealCard`'s caller, both providers.
- Auth-aware UI (`Header`, `Footer`, `AccountPanel`, `AuthPage`) reads session via `useSession()` from `next-auth/react` — the layout wraps children in `<SessionProvider>` (`src/components/providers/SessionProvider.tsx`).

### Auth (NextAuth v5)

- Single `NextAuth({...})` export in `src/auth.ts`. The handlers are re-exported via `src/auth-handler.ts` → `src/app/api/auth/[...nextauth]/route.ts`.
- Providers: `Credentials` (email + bcrypt, 12 rounds), `Credentials` (id `magic-link`, used after the magic-link route sets `magic_email_pending` cookie), `Google` (only registered when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` env vars are set).
- `session.strategy = "jwt"`. Session callback injects `session.user.id` from a DB lookup in `jwt()` callback.
- DB tables (`users`, `magic_links`) are **lazily created on first call** by `ensureSchema()` in `src/lib/db.ts` — no migrations. Uses Postgres via `@neondatabase/serverless` (`neon()` HTTP driver) — requires `DATABASE_URL` (Vercel Neon integration) or `AUTH_DB_URL` at runtime.
- Magic-link flow: `POST /api/auth/magic/request` → insert token (15 min TTL, random 32-byte hex) → email via Resend if `RESEND_API_KEY` set, else `console.log` the link. `GET /api/auth/magic?token=…` consumes the token, sets `magic_email_pending` cookie, calls `signIn("magic-link", { email, redirect: false })`, redirects to `/`.
- **Important**: `/api/auth/signup` deliberately does **not** call `signIn()` from inside the route — the README inline-comment in that file explains it produces an empty 500 body. The client (`AuthPage.tsx`) calls `signIn("credentials", …)` itself after a successful signup POST.
- Forgot password (`/login/forgot`) is currently a **stub** — it always returns success without sending anything (`src/components/auth/ForgotForm.tsx`).

### Database helpers (`src/lib/db.ts`)

- Thin async wrapper around the `@neondatabase/serverless` HTTP `neon()` client. Helpers: `fetchOne`, `fetchAll`, `exec` — all `await`-able. `db()` ensures schema and returns the bound query function.
- The `Neonql` const at the bottom is a tagged-template shim used inside `ensureSchema()` — it stringifies back to SQL because the `neon()` HTTP driver doesn't parse template tags but takes positional `$1` params. When writing new queries use the `fetchOne/fetchAll/exec` helpers with `$1, $2, ...` placeholders.
- `ensureSchema()` creates both the auth tables (`users`, `magic_links`) and the deal catalog tables (`categories`, `brands`, `deals`, `deal_categories`) on first call.

### Deal catalog (Postgres)

- Schema (defined in `src/lib/db.ts:ensureSchema`):
  - `categories(slug PK, label, description, sort_order, parent_slug FK→categories)` — hierarchical, two levels.
  - `brands(id PK, name, logo, deal_count, sort_order)`.
  - `deals(id PK, title, brand_id FK, cover, cta, source, price, discount, description, is_free, is_hot, heat, published_at)`.
  - `deal_categories(deal_id, category_slug)` — many-to-many join.
- Loaders in `src/lib/deals.ts` are now all `async`: `getDeals`, `getDeal`, `getBrands`, `getCategories`, `getCategoryTree`, `categoryFor`. The static `CATEGORIES` constant has been removed; callers must `await getCategories()`.
- Categories are cached in-process for 60 s (`loadCategories` in `src/lib/deals.ts`) since they rarely change.
- Seed: `pnpm db:seed` (or `pnpm db:seed -- --fresh` to truncate first). Reads `src/data/deals.json` + `src/data/brands.json`, infers `price`, `discount`, `is_free`, `is_hot`, `heat` from the title, and auto-tags each deal into matching categories via `classifyDeal`.
- `generateStaticParams` for `/category/[...slug]` and `/deal/[id]`, plus `sitemap.ts`, gracefully return empty/fallback when `DATABASE_URL` is unset so offline builds don't hard-fail. The pages remain renderable via `dynamicParams = true`.

### `localImageFor()` — image path resolver (`src/lib/image-path.ts`)

Pure function (safe in client components). Takes a remote URL like `https://assets.dealselected.com/deals/abc.jpg?v=123`, extracts the bucket (`deals`/`brands`/`site`) and filename, returns `/images/<bucket>/<filename>`. Falls back to `/images/<bucket>/placeholder.svg`. This is why every `<Image src>` in components goes through `localImageFor(...)` instead of using `deal.cover` directly — the local mirror in `public/images/` is what `<Image>` actually loads.

## Important gotchas

### Auth env vars
- `AUTH_SECRET` is required. In dev without it, the code falls back to `"dev-only-secret-change-me"` (`src/auth.ts:17`). **Always set `AUTH_SECRET` in production** (`openssl rand -base64 32`).
- Google provider is **conditionally registered** — if either `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing, the button on `/login` is the only visible evidence; `signIn("google", …)` will fail server-side.

### Magic-link cookies
- The `magic_email_pending` cookie is `HttpOnly`, `SameSite=Lax`, `Max-Age=120` (2 min). The window is intentionally short because it bridges the redirect from `GET /api/auth/magic` to the `signIn("magic-link", …)` call inside the same handler.

### Image fallback
- If `localImageFor` can't determine a bucket (e.g. URL not from `assets.dealselected.com`) it returns `/images/<fallbackBucket>/placeholder.svg`. Many scraped brands end up as hex-hash filenames with title-cased names (e.g. `0C4D4F68797C347A1F4332Fe21Abae9C`) — see `data/brands.json`. The UI still works because the logo URL itself loads.

### `DealCard.deriveMeta()` heuristics
- `src/components/DealCard.tsx:112` synthesizes `badge`, `priceLine`, `description`, `heat` (random 80–280), and `relativeTime` from the title regex since the dataset is shallow. Don't refactor the deal shape without also updating this function.
- `heat` uses `Math.random()` and renders on every server render — fine for now but it will visually flicker on revalidation. If you cache-render this aggressively, derive heat deterministically from `deal.id`.

### Image `priority` propagation
- `DealCard` only sets `priority` when `index < 4` (passed from `HomePage`). Subcategory grids (`/category/[...slug]`) and `/deal/[id]` related list do not — first card on `/deal/[id]` uses `priority` directly.

### Category sub-routes are keyword filters
- `src/app/category/[...slug]/page.tsx:239` defines `SUBCATEGORY_KEYWORDS` (zh + en strings) used by `filterDealsForRoute`. The current scraped dataset is shallow (10 deals), so most subcategory pages will look empty — that's expected, not a bug.

### Static data, not a CMS
- The site does **not** have an admin UI. To add deals/brands: edit `src/data/*.json`, or re-run `scripts/scrape.py && scripts/parse.py`. The `pnpm parse` script regenerates from cached `data/homepage.html` (no network).

### Deploy — `scripts/deploy.py` secrets
- The script **refuses to run** without `VERCEL_TOKEN` (and optionally `VERCEL_TEAM_ID`). Tokens are never hardcoded in source. It uploads via `/v2/files`, creates a deployment via `/v13/deployments`, then polls. Excludes `.next`, `node_modules`, `.venv`, `data`, `.git`, all `.env*` files, and `tsconfig.tsbuildinfo`.
- The recommended path is Git integration — `scripts/deploy.py` exists for the manual REST-API option.

### Build caveats
- `optimizePackageImports: ["react", "react-dom"]` is enabled in `next.config.mjs`. Don't add heavy barrel imports (`import { x } from "lodash"`).
- `images.formats: ["image/webp"]` — Next emits WebP via `<Image>`. New `remotePatterns` must be added if you switch assets CDN.
- `experimental.optimizePackageImports` triggers a console warning on `next build` (it was promoted to stable in 15.5 but still flagged). Non-fatal.

## Code conventions

- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json`).
- **Components**: PascalCase, default-exported *only* for client components used directly; all internal helpers are named exports. Co-locate route-specific components in a sibling `components/<domain>/` dir (e.g. `components/auth/`, `components/account/`, `components/submit/`).
- **Tailwind**: custom palette is `bunny-{ink,muted,accent,surface,soft,line}` (defined in `tailwind.config.ts`). Brand orange is `#F97316` (used literally in many components — the `bunny-accent` token equals this).
- **CSS**: `globals.css` defines two utility classes used heavily: `.gradient-brand` (background gradient) and `.gradient-brand-text` (text gradient). Also `.card-shadow` and `animate-float-*` keyframes for the auth page decorations.
- **i18n**: UI is **zh-CN only**. `<html lang="zh-CN">` and `metadata.alternates.languages` declare `zh-CN` → `SITE.url`, `en` → `SITE.enUrl`, `x-default` → `SITE.enUrl`.
- **Forms**: every form component uses the `state: "idle" | "submitting" | "ok" | "err"` pattern with a single `msg` string. Follow this for any new form.
- **Validation regex**: emails use `/^[^@\s]+@[^@\s]+\.[^@\s]+$/` — duplicated literally in every form/route. Don't substitute a stronger one without updating them all.
- **API responses**: `{ ok: boolean, message: string, ...payload }`. Always return `NextResponse.json(...)`, not raw `Response`.

## Common edits

| Goal                          | Touch                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Add/remove a nav group        | `src/components/Header.tsx` — `NAV_GROUPS` array                                   |
| Add a category                | `src/lib/deals.ts` — push to `CATEGORIES`; also `KNOWN_SUBCATEGORIES`/`SUBCATEGORY_LABEL`/`SUBCATEGORY_KEYWORDS` in `category/[...slug]/page.tsx` |
| Add a legal page              | create `src/app/legal/<slug>/page.tsx`, link from `Footer.tsx`                     |
| Change brand colors / fonts   | `tailwind.config.ts` (`bunny.*`) and `globals.css` (`--brand-from/--brand-to`)     |
| Update site identity          | `src/lib/site.ts` — `SITE` constant (name, url, social, email)                     |
| Refresh scraped data          | `python3 scripts/scrape.py` then `.venv/bin/python scripts/parse.py`               |
| New API route                 | create `src/app/api/<name>/route.ts`, export `runtime = "nodejs"` (Neon needs it)  |

## Known stubs (intentional)

- `/api/newsletter` — validates but **does not persist**. The inline comment in `route.ts` explains the Vercel filesystem constraint; wire to Mailchimp/Buttondown/Loops when ready.
- `/api/submit` — validates and `console.log`s. No `submit_queue` table yet.
- `/login/forgot` — `ForgotForm` always returns success after a fake 600ms delay; no email is sent.
- `/account/favorites` — surfaces a "coming soon" message plus the first 4 deals. No favorites table.
- Apple OAuth button on `/login` — disabled with a "即将推出" pill; no provider wired.

## File / dir reference

```
src/
  app/                    # Next App Router
    api/                  # Nodejs runtime, all POST/GET handlers
    category/[...slug]/   # catch-all dynamic route
    deal/[id]/            # single-deal page with generateStaticParams
    legal/, sitemap-info/, sitemap.ts, robots.ts
  components/
    auth/, account/, submit/, providers/
    Header.tsx Footer.tsx Sidebar.tsx SearchBar.tsx
    NewsletterForm.tsx DealCard.tsx BrandGrid.tsx
  data/                   # canonical deals.json + brands.json (committed)
  lib/
    deals.ts              # server-only JSON loader + CATEGORIES
    db.ts                 # Neon client + fetchOne/fetchAll/exec + ensureSchema
    image-path.ts         # client-safe localImageFor/localImageExists
    site.ts               # SITE constant (name, url, social)
    types.ts              # Deal, Brand, Category
  auth.ts                 # NextAuth v5 config (providers, callbacks, magic-link helpers)
  auth-handler.ts         # { GET, POST } from NextAuth handlers
scripts/
  scrape.py               # bunnysave.com → data/*.html/json + public/images/
  parse.py                # BeautifulSoup → src/data/*.json
  deploy.py               # Vercel REST API deploy
public/
  images/{deals,brands,site}/   # populated by scrape.py; placeholder.svg is fallback
data/                     # raw scrape outputs (homepage.html gitignored)
.venv/                    # Python 3.14 venv with bs4 + lxml (preinstalled)
```

## Testing

There is **no automated test suite** in this repo (no `__tests__/`, no `vitest`/`jest` config, no Playwright). Verification is by manual build:

```bash
pnpm build   # catches TS errors + RSC boundary violations
pnpm lint
```

When adding new routes or modifying auth, the recommended smoke-test:

```bash
pnpm build && pnpm start
# browse /, /category/daily-deals, /deal/<id>, /login, /signup, /search?q=...
```