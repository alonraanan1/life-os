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
