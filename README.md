# Life OS

A personal life-management app (expenses, tasks/habits, check-ins, goals) originally scaffolded and hosted through OpenAI's ChatGPT Sites, and now also set up as a normal git project so it can be edited by any AI coding tool or by hand.

## Tech stack

- **Framework:** React 19 on `vinext` (a Vite-based, Next.js-style app router) — see `app/`
- **UI:** shadcn/ui components (`components/ui`), Tailwind CSS 4, Radix-based `@base-ui/react`
- **Data:** Drizzle ORM schema in `db/schema.ts`; Cloudflare D1 binding (`db: "DB"`, see `.openai/hosting.json`) plus Supabase for the API layer (see `docs/api.md`)
- **Hosting/runtime:** Cloudflare Workers via `wrangler`
- **Lint/format:** `oxlint` / `oxfmt`

## Getting started

```
npm install
npm run dev      # local dev server (vinext dev)
npm run build     # production build
npm run lint       # oxlint
npm run format    # oxfmt
npm run db:generate  # drizzle-kit generate
```

Copy `.env.example` to `.env` and fill in real values before running anything that touches Supabase or the Apple Shortcuts API. Never commit `.env` — it's already git-ignored.

## Project structure

- `app/` — pages and API routes (`app/api`)
- `components/ui/` — shadcn-based UI components
- `db/` — Drizzle ORM schema and client
- `supabase/` — Supabase SQL schema
- `hooks/`, `lib/` — shared hooks and utilities
- `public/` — static assets
- `docs/` — reference docs (API endpoints, GitHub setup)

## Working on this project with AI tools

This project is meant to be edited by more than one AI assistant over time — Claude, ChatGPT/Codex, Cursor, GitHub Copilot, or others — often in separate sessions with no shared memory. Two files make that handoff work:

- **`AGENTS.md`** — standing instructions every AI should follow (design rules, and the change-log workflow below).
- **`CHANGELOG.md`** — a running log of what each AI session changed and why, plus any open items for the next session. Read the latest entries before starting work; add a new entry when you finish.

See `DESIGN.md` for the visual design system, and `docs/api.md` for the API reference.

## Git remotes

- `sites` — the original remote, pointing at OpenAI's ChatGPT Sites hosting. Push here to redeploy through ChatGPT.
- `origin` — https://github.com/alonraanan1/life-os — canonical shared source. Pushes to main deploy to https://sites-project.alonraanan1.workers.dev. Work on branches for unfinished changes; pull requests run build checks.

Read `docs/IMPLEMENTATION_STATUS.md` for the current handoff and pending stages.
