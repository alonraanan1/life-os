# Current product handoff — Habit Tracker

The user changed direction on 2026-09-15: Life OS is now a habit tracker with one secondary Finance page. This supersedes the previous eight-area dashboard scope.

## Active scope
- Habits: default screen, scheduled daily completion, dated history, streaks, creation/editing and soft deletion. Includes the existing sleep tracker as a dedicated habit, retaining hours, sleep rating, chart and history.
- Finance: existing complete page, including father's-card expenses and intake integrations.
- Settings: secondary profile, complete backup/import, trash recovery and Google logout.

Tasks, goals, check-ins and the mixed timeline are removed from active navigation and the home screen. Sleep lives inside Habits instead of a separate navigation destination. Existing records, schema, import/export support and integration endpoints are retained for compatibility. Do not delete historical data or silently restore the old dashboard.

## Architecture and publishing
- Canonical repository: https://github.com/alonraanan1/life-os
- Canonical site: https://sites-project.alonraanan1.workers.dev
- Google-only authentication restricted to OWNER_EMAIL remains unchanged.
- D1 is authoritative. This refocus needs no migration.
- GitHub main triggers Cloudflare deploy. CI token lacks D1 migration permissions; future schema changes still need an authenticated local migration before publishing.
- Read CHANGELOG.md and docs/HABIT_TRACKER_PLAN.md before further edits.

## Verification for this refocus
Typecheck, all three domain tests and production build passed. Local API test passed: habit creation, mark, reload, undo, soft delete, anonymous rejection. No production records were changed by QA. Temporary localhost-only session fixture was removed before the final build. Original SleepView, Finance and backend files are unchanged.

Visual QA remains open: the browser tool reported no available browsers, so desktop/mobile layouts were reviewed in source but not rendered interactively. Publishing uses the existing GitHub workflow; verify its run for the exact commit before declaring deployment success.
