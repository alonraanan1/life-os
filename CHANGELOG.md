# Changelog

This file tracks changes made to the Life OS project by any AI assistant (Claude, ChatGPT/Codex, Cursor, GitHub Copilot, etc.) or by the project owner. Its purpose: let an AI session with no memory of previous sessions understand what was done and continue the work.

## How to use this file

**Before starting work:** read the most recent entries below, plus `AGENTS.md` and `DESIGN.md`, to understand the current state of the project and any open items.

**After finishing a change:** add a new entry at the top of "Entries" (right below this section), using the template below. Do not edit or delete older entries — this is a historical log, not a status board.

Template for a new entry:

```
### YYYY-MM-DD — <AI tool or person>
- **Summary:** what changed and why, in 1-2 lines
- **Files touched:** path/to/file, path/to/other
- **Open items / notes for the next AI:** anything unresolved, follow-ups, or decisions made that shouldn't be silently reversed
```

## Entries

### 2026-09-11 — Claude (Cowork), session 6 — Google sign-in replaces the password
- **Summary:** The password login is gone. Sign-in is now Google OAuth restricted to one allowed address, and the session lasts 400 days and renews on every app open, so each device is signed in once and stays signed in.
- **Files touched:** `lib/auth.ts`, `app/api/auth/route.ts`, `app/api/auth/google/route.ts` (new), `app/api/auth/google/callback/route.ts` (new), `app/api/expense/route.ts`, `components/life/auth-gate.tsx`, `app/globals.css`, `docs/SHORTCUTS.md`, `docs/IMPLEMENTATION_STATUS.md`.
- **Open items / notes for the next AI:**
  - **The flow:** `GET /api/auth/google` issues a random `state`, stores it in a short-lived HttpOnly cookie and redirects to Google with scope `openid email`. `GET /api/auth/google/callback` compares the state, exchanges the code at `oauth2.googleapis.com/token` with the client secret, and checks the returned `id_token` claims: `aud` equals our client id, `iss` is Google, `exp` is in the future, `email_verified` is true, and `email` equals `OWNER_EMAIL`. Anything else redirects to `/?login=<reason>` and the gate renders a Hebrew message. The id_token is trusted without signature verification because it is fetched directly from Google over TLS in the authorization-code exchange — do not copy this shortcut to an implicit flow.
  - **`POST /api/auth` is deleted** along with `passwordHash`, `limited` and the `LIFE_SETUP_TOKEN` check. The `life_owner` and `life_attempts` tables still exist in D1 but nothing reads them; the Shortcuts intake no longer requires an owner row either. No migration was needed, so the CI token's missing D1 permission is still not a problem.
  - **Cookie change worth knowing:** the session cookie moved from `SameSite=Strict` to `Lax`, because a Strict cookie is not returned on the navigation coming back from Google. CSRF protection on writes still comes from the `sameOrigin()` Origin check that every mutating endpoint performs — keep that check if you touch these routes.
  - **Sessions renew on `GET /api/auth`**, which the gate calls on every app start, so an active user never gets logged out. Expiry is `SESSION_AGE` (400 days, the browser cookie ceiling).
  - **Worker secrets now required:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`. `LIFE_SETUP_TOKEN` is dead and can be deleted. The Google client is registered with redirect URI `https://sites-project.alonraanan1.workers.dev/api/auth/google/callback`; the code derives it from the request origin, so a new hostname needs registering in Google Console too.
  - **Recovery if the Google account is ever lost:** there is no password fallback by design. Access would be restored by registering a different address in `OWNER_EMAIL` with wrangler from the owner's machine.
  - **Verified:** typecheck, tests (3/3) and build pass. One `react-compiler` lint finding remains in `auth-gate.tsx` (setState reached from an effect); the file previously carried one finding too, so the repo total is unchanged. The live sign-in was checked after deploy.

### 2026-09-11 — Claude (Cowork), session 6 — Stage 8: the last mock data is gone
- **Summary:** Replaced the seeded home screen and timeline with live D1 data, split the page shell into real modules, and exposed backup, restore, trash and logout. The checklist in `docs/IMPLEMENTATION_STATUS.md` is now fully ticked.
- **Files touched:** `app/page.tsx` (rewritten as a thin shell), `app/globals.css`, `components/life/today.tsx` (new), `components/life/timeline.tsx` (new), `components/life/data.tsx` (new), `components/life/nav.ts` (new), `.github/workflows/check.yml`, `docs/IMPLEMENTATION_STATUS.md`.
- **Open items / notes for the next AI:**
  - **No seed data is left anywhere.** `seedTasks`, `seedHabits`, `seedActivity` and every mock component (`Today`, `BudgetHero`, `Finance`, `Tasks`, `Habits`, `Goals`, `TimelineView`, `TaskList`, `HabitGrid`, `GoalCard`, `ActivityList`, `Composer`, `Quick`, `EmptyState`) were deleted along with the local-state composers that lost their data on refresh. `app/page.tsx` is now only routing, header, sidebar and mobile nav; every screen is a module under `components/life/`.
  - **Home** (`today.tsx`) is composed from the existing `compact` modules Codex built, plus four live summary cards (open tasks with an overdue count, habits marked today, spend today, today's check-in) and the four most recent timeline moments. Every number is derived from records, none are stored.
  - **Timeline** (`timeline.tsx`) derives one feed from transactions, completed tasks, habit marks, check-ins and reached goals, grouped by day with היום/אתמול labels and filters. `buildFeed()` is exported and reused on the home screen — keep it the single source for activity.
  - **`data.tsx` is the new seventh screen** (reachable from the sidebar and the header avatar): backup download via `GET /api/export`, restore via `POST /api/import` with a 2MB guard, per-kind record counts, a trash list of soft-deleted records with one-click restore, the display name (`settings` record), and logout via `DELETE /api/auth` followed by a reload so nothing stays in memory.
  - **The greeting is no longer hardcoded.** It is time-of-day based and uses the `settings.name` record, editable in the new screen; the avatar shows those initials. The old placeholder name is gone. If no name is set the app simply greets without one.
  - **The shell now shows loading and error states.** `useLife().error` was previously invisible, so a failed refresh looked like an empty app; it now renders a retry banner, and first load shows a status line instead of empty states.
  - **CI now gates on more than the build:** `check.yml` runs `npm run typecheck` and `npm run test` before `npm run build`.
  - **Verified before pushing:** `npm run typecheck`, `npm run lint` (no new findings; the pre-existing `components/ui/*` and `hooks/use-mobile.ts` findings are untouched), `npm test` (3/3) and `npm run build` all pass. Local `wrangler dev` end-to-end runs were attempted too but the sandbox worker restarted mid-request, so runtime checks beyond anonymous-401, cross-origin-403 and the Shortcuts-key guard were not completed — worth a manual pass on the live site after this deploys.
  - **Still open:** the production owner account activation is the user's to do (the AI must not choose the password), and the CI Cloudflare token still has no D1 permission, so schema migrations continue to need `npm run db:migrate:remote` from an authenticated local CLI before a deploy that changes the schema. This change adds no migration.

### 2026-09-11 — Codex — Stage 7: goals and check-ins
- **Summary:** Persistent goal creation/editing/progress/deletion, numeric targets/units/deadlines, and dated mood/notes check-ins. One check-in per calendar date; future entries are rejected.
- **Files touched:** components/life/goals.tsx, app/page.tsx, app/globals.css.
- **Open items / notes for the next AI:** Typecheck/build passed. Stage 8 must remove the last seeded home/timeline views, expose backup/trash/logout and verify full end-to-end behavior.


### 2026-09-11 — Codex — Stage 6: finance and Shortcuts intake
- **Summary:** Added persistent income/expense CRUD, custom category entry/filtering, monthly budgets and calculated totals/breakdown. Money is stored in integer agorot. Replaced the dormant Supabase intake with authenticated D1 intake and idempotent externalId handling.
- **Files touched:** components/life/finance.tsx, app/api/expense/route.ts, app/page.tsx, app/globals.css, docs/SHORTCUTS.md.
- **Open items / notes for the next AI:** APPLE_SHORTCUTS_API_KEY configured as Worker secret; owner copy is ignored .env.shortcuts.txt. User still installs the iPhone shortcut; instructions in docs/SHORTCUTS.md. Input amount is ILS, converted to agorot. Account must be activated before shortcut writes. Typecheck/build passed.


### 2026-09-11 — Codex — Stage 5: habit schedules and dated history
- **Summary:** Habit CRUD, chosen weekdays/start date, daily toggle and seven-day history now persist to D1. Streaks count scheduled days, exclude deleted entries and allow today to be pending. Future entries are rejected server-side.
- **Files touched:** components/life/habits.tsx, app/page.tsx, app/globals.css, tests/model.test.mjs, package.json.
- **Open items / notes for the next AI:** Three domain tests cover streak gaps/weekends, Israel timezone and invalid dates/money. Tasks/habits live modules will replace remaining mock home sections at stage 8.


### 2026-09-11 — Codex — Stage 4: real task management
- **Summary:** Task screen now supports saved creation/editing, due date/time, completion, soft delete, search and open/today/overdue/completed filters. Added shared authenticated data provider and accessible editor dialogs.
- **Files touched:** components/life/{use-life,editor,tasks}.tsx, components/life/auth-gate.tsx, app/page.tsx, app/globals.css.
- **Open items / notes for the next AI:** Browser-tested local login and task creation. Typecheck passed. Stage 2/3 deployment run 6 succeeded. Home still uses mock sections until stage 8 replaces it with these shared live modules.


### 2026-09-11 — Codex — Stage 3: persistent records and recovery API
- **Summary:** Added validated D1 records with per-record optimistic concurrency, soft deletion, authenticated export and additive import. No browser storage is authoritative. All data endpoints reject unauthenticated access and cross-origin writes.
- **Files touched:** lib/life-model.ts, lib/life-store.ts, app/api/records, app/api/export, app/api/import, db/schema.ts, drizzle/, package.json.
- **Open items / notes for the next AI:** GitHub Cloudflare token lacks D1 permissions (7403). Keep normal deploy independent of schema migration: apply migrations first with authenticated local CLI using npm run db:migrate:remote, then push. Do not bypass failed migrations. User can optionally add D1 Edit to the CI token later. D1 life_records is the canonical domain store; old schema tables are retained but unused. Local tests passed: create/read/update/delete, stale update 409, export, anonymous 401, cross-origin 403. Import is additive and never overwrites existing IDs. UI wiring follows in stages 4–8.


### 2026-09-11 — Codex — Stage 2: private login and D1 foundation
- **Summary:** Created owner Cloudflare D1 database life-os; added single-owner activation and password login, hashed opaque sessions, same-origin writes and rate limits. Expense intake now denies requests without configured bearer key. Bootstrap code is in ignored local .env.activation.txt and Cloudflare LIFE_SETUP_TOKEN secret; never commit it.
- **Files touched:** lib/auth.ts, app/api/auth/route.ts, components/life/auth-gate.tsx, app/page.tsx, app/globals.css, db/schema.ts, drizzle/, wrangler.database.json, vite.config.ts, package.json, .openai/hosting.json, .gitignore.
- **Open items / notes for the next AI:** Production owner has NOT been activated by the AI; user must choose password. Local-only test account was created. D1 is canonical (ID in wrangler.database.json is non-secret); legacy tables retained. Auth and origin checks passed locally. Stage 3 will replace mock state with validated per-record persistence. Password reset requires authenticated admin CLI (document before completion). Cloudflare and Sites deployments would have distinct D1 stores; only publish Cloudflare canonical site.


### 2026-09-11 — Codex — Stage 1: shared workflow synchronized
- **Summary:** Fast-forwarded local main to GitHub b4176e2; preserved Claude session 5 notes and D1 environment support. User now authorizes real persistence and all eight implementation stages, superseding the earlier mockup-only restriction. Publish a tested checkpoint after each stage.
- **Files touched:** CHANGELOG.md, README.md, docs/IMPLEMENTATION_STATUS.md, .github/workflows/check.yml; preserved Claude changes to vite.config.ts.
- **Open items / notes for the next AI:** GitHub origin is source of truth. main auto-publishes to https://sites-project.alonraanan1.workers.dev; sites remote is retained as fallback, not a second canonical data store. Use branch + PR checks for unfinished work. Cloudflare CLI login works with owner account; never print/store credentials. Next: private access, D1 schema and persistence, tasks, habits, finance, goals/check-ins, dashboard, export/recovery.


### 2026-09-11 — Claude (Cowork), session 5 — **independent deploy is LIVE**
- **Summary:** The GitHub Actions → Cloudflare pipeline now works end to end. Run #3 of "Deploy to Cloudflare" (commit `b4176e2`) completed successfully, deploying the Worker from GitHub's servers with no involvement from the owner's machine and no ChatGPT Sites step. Pushing to `main` is now all it takes to ship.
- **Files touched:** `.openai/hosting.json` (`"d1": "DB"` → `"d1": null`) and `package.json` (added `"deploy": "npm run build && wrangler deploy"`) — both committed directly on github.com by the owner from a phone, so they exist on `main` but **not** in the local working copy.
- **Open items / notes for the next AI:**
  - **What fixed the deploy:** `wrangler deploy` was failing with `D1 binding 'DB' references database '00000000-0000-4000-8000-000000000000' which was not found` — the placeholder ID from `vite.config.ts` that only OpenAI's control plane ever replaced. Since **nothing in the app actually reads D1** (`db/index.ts`'s `getDb()` has no callers; the one live endpoint, `POST /api/expense`, writes to Supabase over REST), the binding was simply dropped by setting `d1: null` in `.openai/hosting.json`. Reverse that when real persistence work starts, and create a genuine database first (`wrangler d1 create`), then put its ID where `vite.config.ts` now reads `CLOUDFLARE_D1_DATABASE_ID`.
  - **Live URL:** https://sites-project.alonraanan1.workers.dev — verified rendering the full dashboard, including the header personalisation from session 3. (Worker name is still `sites-project`, inherited from `package.json`'s `name` field; rename both together if a tidier URL is wanted.)
  - **The local clone is behind and diverged, mildly.** `main` on GitHub has the two phone commits that the local working copy doesn't. Everything else — `app/page.tsx`, `README.md`, `CHANGELOG.md` (through session 4), `docs/` — was already pushed earlier and is live. The only local-only change is `vite.config.ts` (the `CLOUDFLARE_D1_DATABASE_ID` / `CLOUDFLARE_D1_DATABASE_NAME` env-var support) plus this entry. Next time anyone is at that machine: `git pull` first, then commit and push. The files touched on each side are disjoint, so no conflict is expected.
  - **Constraint worth knowing** (cost a lot of time this session): in this environment Claude could read and write files on the owner's machine but could **not** run any command there — no `device_bash`, and computer-use grants terminals "click-only" (no typing) and browsers "read-only". The in-app browser is signed out of everything. So anything requiring a shell or a logged-in session had to be done by the owner. Editing files directly on github.com — which triggers the workflow — turned out to be the one path that needed neither the owner's computer nor a terminal.
  - Deploy secrets already configured in the repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Supabase runtime secrets are still unset on the Worker (not needed while the app is mock-data only).

### 2026-09-11 — Claude (Cowork), session 4
- **Summary:** Started building the independent-deploy pipeline the owner asked for (push to `main` → live site updates at one stable URL, no ChatGPT involved). Owner has now created a Cloudflare account. Added the GitHub Actions workflow and a step-by-step doc; the remaining steps need to run once, by hand, on the owner's machine (an AI can't do them — they require the owner's own Cloudflare login).
- **Files touched:** `docs/CLOUDFLARE_DEPLOY.md` (new — full explanation and steps). `.github/workflows/deploy.yml` (new, **not committed by this session** — the remote file-write tool used this session refuses to write anything under `.github/workflows/` for security reasons, so the file was handed to the owner directly to place by hand; if you're an AI with normal write access to the repo, just create it from the content in `docs/CLOUDFLARE_DEPLOY.md`'s companion or ask the owner for the file they were given).
- **Open items / notes for the next AI:**
  - **Not done yet, blocking automatic deploy:** the owner still needs to (1) run `npm install && npx wrangler login && npx wrangler deploy` once locally — this generates `wrangler.jsonc` and a `deploy` script in `package.json`, and creates a real D1 database (choose "create new" if asked, ignore the OpenAI placeholder one); (2) commit and push what that generates; (3) create a Cloudflare API token and add it plus the Account ID as GitHub repo secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`). Full detail in `docs/CLOUDFLARE_DEPLOY.md`. Until all of that is done, `.github/workflows/deploy.yml` will just fail on push (harmless, but expected) or may not even exist yet in the repo if the owner hasn't placed it.
  - Once that's working, this repo will have **two independent deploy paths**: the original `sites` remote (ChatGPT Sites) and the new GitHub Actions → Cloudflare pipeline. Both are intentional; don't remove either without the owner asking.
  - Runtime secrets for Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APPLE_SHORTCUTS_API_KEY`) still aren't set on the new Cloudflare Worker — not needed while the app is mock-data-only; see `docs/CLOUDFLARE_DEPLOY.md`'s last section when that changes.

### 2026-09-11 — Claude (Cowork), session 3
- **Summary:** Small design fix per owner request (owner said: work independently, don't wire real data yet): the header greeted "בוקר טוב, דניאל" (a leftover placeholder name from whoever generated the mock) and showed a hardcoded avatar/date instead of the owner's own name and the real date. Fixed both — the greeting/avatar now say "אלון", and the date under the page title is computed client-side from the real clock instead of being frozen as a string.
- **Files touched:** `app/page.tsx` (added a `today` state + effect in `HomePage`, threaded a `dateLabel` prop into `AppHeader`, changed the hardcoded name/avatar initials).
- **Open items / notes for the next AI:**
  - This was a pure frontend/cosmetic change — no backend, no data wiring, consistent with the "mockup only for now" direction below.
  - **Heads-up on file reverts:** while working this session, an edit to this exact file (`CHANGELOG.md`) briefly disappeared and had to be redone — most likely because the owner had it open in an editor (or a sync tool such as OneDrive on the `Desktop` folder) and a stale save overwrote the newer content. If you're an AI working through the same kind of remote file-write flow (not a live `git`/editor session), it's worth double-checking a file actually persisted a few minutes after writing it, especially right after asking the owner to look at something.
  - **New goal from the owner, not yet started:** have the whole project deploy itself automatically from GitHub — any AI (or the owner) just pushes to `main`, and the live site updates at one stable URL, with no manual step through ChatGPT. This is very achievable in principle because the app already targets Cloudflare Workers, **but** today's deploy path is tightly coupled to OpenAI's own tooling: `vite.config.ts` imports `@openai/sites-vite-plugin`, and the D1 database binding is a placeholder ID that OpenAI's "control plane" fills in at deploy time (see `db/index.ts`'s error message and `.openai/hosting.json`). Setting up an independent auto-deploy (e.g. GitHub Actions running `wrangler deploy`, or Cloudflare's own "connect to Git" feature) will need the owner's **own** Cloudflare account and a real D1 database created under it — that's a one-time step only the owner can do (an AI cannot create accounts or hold API tokens on someone's behalf). Don't rip out the existing OpenAI/`sites()` integration when building this — add the new deploy path alongside it, the same way GitHub was added alongside the `sites` git remote, so the current ChatGPT Sites deploy keeps working as a fallback.

### 2026-09-11 — Claude (Cowork), session 2
- **Summary:** Reviewed the whole codebase (frontend, API routes, both database schemas, hosting config) and confirmed the current direction with the owner before touching any code. No code changed in this session — this entry just records the owner's direction for whoever works on this next.
- **Files touched:** none (read-only review); this changelog entry only.
- **Open items / notes for the next AI:**
  - **Single user.** This is a personal app for the owner only — no multi-tenant/auth model needs to be designed for right now.
  - **Current priority is visual/design polish only.** The owner explicitly does NOT want the mock data wired to a real backend yet. Do not connect the UI to Supabase/D1, and do not "fix" the seed data by making it dynamic, unless asked.
  - Known state, left as-is on purpose for now: almost all numbers in the UI (`app/page.tsx`) are hardcoded seed data, not read from a database. The task/expense composers only update local React state (lost on refresh) — they don't call `/api/expense` or any endpoint.
  - Known architecture ambiguity, **not yet decided**: there are two parallel, overlapping database schemas — `db/schema.ts` (Drizzle ORM → Cloudflare D1) and `supabase/schema.sql` (Postgres → Supabase). Only `POST /api/expense` is wired, and it writes to Supabase's `expense_intake` table. Whichever AI eventually works on real data wiring should raise this with the owner before picking one.
  - Known security gap, **not yet fixed** (left alone per current priority): `.env.example` defines `APPLE_SHORTCUTS_API_KEY`, but `app/api/expense/route.ts` never checks it — the endpoint currently accepts requests from anyone who has the URL.
  - `docs/api.md` documents planned-but-not-built endpoints: `/api/task`, `/api/habit-entry`, `/api/check-in`, `/api/goal-progress`.

### 2026-09-11 — Claude (Cowork)
- **Summary:** Set up the project as a neutral, multi-AI-friendly workspace: added this changelog and a matching "Multi-AI Change Log" section in `AGENTS.md`, plus a project `README.md` and GitHub setup guide.
- **Files touched:** `CHANGELOG.md` (new), `AGENTS.md` (added a section, rest untouched), `README.md` (new), `docs/GITHUB_SETUP.md` (new)
- **Open items / notes for the next AI:** The only git remote today is `sites`, pointing at OpenAI's ChatGPT Sites host (`git.chatgpt-team.site`) — the proprietary, ChatGPT-only remote the owner wants to stop depending on for day-to-day editing. The owner still needs to create a GitHub repo and add it as a second remote (`origin`) from their own machine's terminal, since that step requires their own GitHub login — see `docs/GITHUB_SETUP.md` for the exact commands. Once that's done, GitHub is the neutral place every AI tool clones/pushes to; the `sites` remote can stay if the owner still wants to redeploy through ChatGPT Sites, or be removed later.
