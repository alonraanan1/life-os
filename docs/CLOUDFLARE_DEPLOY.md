# Deploying to Cloudflare

The one-time setup is done: the site is live at https://sites-project.alonraanan1.workers.dev and deploys itself.

## How a deploy happens

1. A push to `main` runs `.github/workflows/deploy.yml`.
2. It runs `npm run deploy`, which is `vinext build && wrangler deploy`.
3. The build writes the Worker config to `dist/server/wrangler.json`. It is generated from `vite.config.ts`, which takes the D1 binding from `wrangler.database.json`. There is no hand-written `wrangler.jsonc`.

Pull requests run `.github/workflows/check.yml` (typecheck, tests, build; not lint yet). A push straight to `main` runs none of those, so run them and `npm run lint` locally first.

To see whether a commit deployed: `https://api.github.com/repos/alonraanan1/life-os/actions/runs?head_sha=<sha>`.

## Secrets

- **GitHub repository secrets:** `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, used by the deploy workflow.
- **Worker secrets** (`npx wrangler secret put <NAME>`): `APPLE_SHORTCUTS_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OWNER_EMAIL`. Never commit them or paste them into a shared Shortcut.

## Database changes

The D1 schema is `db/schema.ts`; migrations live in `drizzle/`. The CI token cannot migrate D1, so a schema change needs `npm run db:generate`, then `npm run db:migrate:remote` from an authenticated machine, before the code that needs it is pushed.

Most changes need no migration: records are JSON in `life_records`, so a new record kind (like `dadPayment`) is only a change to `lib/life-model.ts`.
