# Life OS

A personal habit tracker with a finance page, for one owner. It started on OpenAI's ChatGPT Sites and is now a normal git project that deploys to Cloudflare Workers, edited by any AI coding tool or by hand.

## Tech stack

- **Framework:** React 19 on `vinext` (a Vite-based, Next.js-style app router) — see `app/`
- **UI:** hand-written CSS in `app/globals.css` on Tailwind CSS 4; `components/ui` keeps only the two shadcn parts in use (button, dialog on `@base-ui/react`)
- **Data:** Cloudflare D1, one `life_records` table of JSON records (kinds and validation in `lib/life-model.ts`); Drizzle schema in `db/schema.ts`, migrations in `drizzle/`. Endpoints: `docs/api.md`
- **Hosting/runtime:** Cloudflare Workers via `wrangler`
- **Lint/format:** `oxlint` / `oxfmt`

## Getting started

```
npm install
npm run dev      # local dev server (vinext dev)
npm run build     # production build
npm run lint       # oxlint
npm run typecheck # tsc
npm test          # node:test + JSDOM
npm run format    # oxfmt
npm run db:generate  # drizzle-kit generate
```

Secrets (`APPLE_SHORTCUTS_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`) are Worker secrets; see `docs/CLOUDFLARE_DEPLOY.md`. Never commit them.

## Project structure

- `app/` — the single page and the API routes (`app/api`)
- `components/life/` — the screens; `components/ui/` — button and dialog
- `lib/` — the data model, store, auth and Shortcut helpers
- `db/`, `drizzle/` — D1 schema and migrations
- `tests/` — `npm test`
- `public/` — static assets
- `docs/` — API, deploy, Shortcuts, agent workflow

## Working on this project with AI tools

This project is meant to be edited by more than one AI assistant over time — Claude, ChatGPT/Codex, Cursor, GitHub Copilot, or others — often in separate sessions with no shared memory. Two files make that handoff work:

- **`AGENTS.md`** — standing instructions every AI should follow (design rules, and the change-log workflow below).
- **`CHANGELOG.md`** — a running log of what each AI session changed and why, plus any open items for the next session. Read the latest entries before starting work; add a new entry when you finish.

See `DESIGN.md` for the visual design system, and `docs/api.md` for the API reference.

## Git remotes

- `origin` — https://github.com/alonraanan1/life-os — canonical shared source. Pushes to main deploy to https://sites-project.alonraanan1.workers.dev. Work on branches for unfinished changes; pull requests run build checks.

Read `docs/IMPLEMENTATION_STATUS.md` for the current handoff and pending stages.
