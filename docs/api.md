# Life OS API

Every endpoint lives under `/api` and answers JSON. All data sits in one Cloudflare D1 table, `life_records`: one row per record, a JSON `data` column, and a `version` that each write must match (a stale write gets `409`). Record kinds and their validation are in `lib/life-model.ts` (`kinds`, `validate`).

There are two ways in:

- **The app** uses a session cookie from Google sign-in (only `OWNER_EMAIL` gets one) and must be same-origin.
- **Apple Shortcuts** send `Authorization: Bearer <APPLE_SHORTCUTS_API_KEY>`, checked by `authorized()` in `lib/shortcuts.ts`. Field-by-field setup is in `docs/SHORTCUTS.md`.

## App

| Endpoint | What it does |
| --- | --- |
| `GET /api/health` | Liveness check, no auth. |
| `GET /api/auth` · `DELETE /api/auth` | Session status · sign out. |
| `GET /api/auth/google` → `/api/auth/google/callback` | Google sign-in. |
| `GET /api/records` · `POST /api/records` | Every record · write one record (`{kind, id, version, data, deleted?}`; version `0` creates). |
| `GET /api/export` · `POST /api/import` | Backup (`format: "life-os"`, `schemaVersion: 1`) · restore, up to 1,000 records per import, existing ids kept. |

## Shortcuts (Bearer key)

| Endpoint | What it does |
| --- | --- |
| `POST /api/expense` | A Wallet or bank charge. A positive amount is enough; a charge without merchant or `externalId` stays pending review. |
| `GET /api/expense/pending` · `POST` | Charges waiting for review, with what each is missing · complete one. |
| `GET /api/habits/pending` · `POST` | Today's unfinished habits and steps as one list · mark the chosen ones. |
| `GET /api/habit-mark` · `POST` | Habit titles · add one completion (capped at the target; never clears a finished day). |
| `POST /api/sleep` | Log a night (score and/or hours). |
| `POST /api/checkin` | Log a mood check-in. |
| `POST /api/task` | Add a task. |
| `GET /api/goal-progress` · `POST` | Goal titles · add progress. |
| `GET /api/hub` · `POST` | One menu for a single Shortcut (`?plain=1` returns a bare array for Choose from List) · run the chosen item. |

A rejected key answers `401 {"error":"unauthorized"}`. On `/api/habits/pending` it also logs a value-free `shortcut_auth_rejected` line (header present or not, shapes only) in the Worker.
