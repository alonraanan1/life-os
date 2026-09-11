# Deploying independently to Cloudflare (no ChatGPT needed)

Goal: any AI tool (or the owner) pushes to `main` on GitHub, and the live site redeploys automatically at one stable URL — without going through ChatGPT Sites.

The app already targets Cloudflare Workers (it uses `@cloudflare/vite-plugin` and `wrangler`), so this doesn't need a rewrite — it needs its own Cloudflare account wired up instead of relying on OpenAI's managed one. `.openai/hosting.json` and the placeholder D1 database ID in `vite.config.ts` are part of OpenAI's ChatGPT Sites control plane; they're left untouched here so that path keeps working as a fallback.

## One-time setup (must be run by the owner, from their own machine)

This can't be done by an AI: it needs the owner's own Cloudflare login and a browser to approve it. Everything after this is automatic.

1. Make sure you have a Cloudflare account (free tier is enough — https://dash.cloudflare.com/sign-up).
2. In a terminal, inside the `LifeOs` project folder:
   ```
   npm install
   npx wrangler login
   npx wrangler deploy
   ```
   `wrangler login` opens a browser to approve access. `wrangler deploy` will notice there's no Wrangler config yet, detect this is a Vite + Cloudflare Workers project, and offer to generate one (`wrangler.jsonc`) plus add a `deploy` script to `package.json` — accept the defaults it suggests. If it asks about the D1 database binding, choose to **create a new database** (the one referenced today is a placeholder used only by OpenAI's own deploy process, not a real database).
   This step deploys the site once, by hand, and prints the live URL (something like `life-os.<your-subdomain>.workers.dev`).
3. Commit and push what this step generated/changed (at least `wrangler.jsonc` and `package.json`):
   ```
   git add wrangler.jsonc package.json package-lock.json
   git commit -m "Add Cloudflare deploy config"
   git push
   ```
4. Create a Cloudflare API token: Cloudflare dashboard -> click your profile icon (top right) -> **My Profile** -> **API Tokens** -> **Create Token** -> use the **"Edit Cloudflare Workers"** template -> Continue -> Create Token. Copy the token value (shown once).
5. Find your Account ID: Cloudflare dashboard -> **Workers & Pages** -> it's shown in the right-hand sidebar ("Account ID"), or on the overview page. Copy it.
6. Add both as GitHub repo secrets: on github.com, open the `life-os` repo -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** -> add `CLOUDFLARE_API_TOKEN` (the token from step 4) and `CLOUDFLARE_ACCOUNT_ID` (from step 5).

## After that

Every future push to `main` — from Claude, ChatGPT, Cursor, or anyone editing the repo directly — triggers `.github/workflows/deploy.yml`, which runs `npm run deploy` automatically and updates the live site at the same URL. No manual deploy step, and no dependency on ChatGPT Sites.

If a deploy run fails right after setup, it's almost always because the secrets weren't added yet (step 6) — add them, then re-run the failed workflow from the GitHub "Actions" tab (no need to push again).

## Not covered by this setup (do later, only if/when needed)

- Runtime secrets the deployed Worker needs to actually reach Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APPLE_SHORTCUTS_API_KEY`) — set with `wrangler secret put <NAME>`, one at a time, once real data wiring becomes the priority (see `CHANGELOG.md` — it currently isn't).
- Applying the database schema (`db/schema.ts` / `supabase/schema.sql`) to whichever database ends up being the real one — also part of the data-wiring work, not the deploy pipeline.
