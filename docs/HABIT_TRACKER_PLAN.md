# Habit Tracker refocus — 2026-09-15

## Product decision
Life OS becomes a habit tracker with one secondary finance page. This supersedes the previous eight-module dashboard plan. Preserve Google owner-only authentication, D1 storage, backup/import, trash recovery and existing financial integrations. No schema migrations or deletion of existing records are required.

## Implementation plan
1. Replace dashboard-first navigation with Habits (default) and Finance. Keep profile/data settings secondary. Remove tasks, goals, check-ins, sleep and mixed timeline from active navigation, headers and quick actions. Retain legacy records and export compatibility.
2. Make the habit screen a coherent daily workspace: selected date (never future), planned/completed count, percentage based only on scheduled habits, direct toggle and undo, clear rest-day/empty states, create/edit/delete, selected weekdays and start date.
3. Keep history in the habit screen: previous seven dates, individual marks and scheduled-day streaks. Explain which date the summary describes; do not invent aggregate data or inflate rest-day progress. Preserve the existing sleep module inside Habits as a dedicated sleep habit, including hours, 0–100 score, notes, chart, history and editing. Keep its existing sleep records; no migration or separate primary navigation.
4. Reuse the existing full finance module as the single finance page, including the father's-card section and existing intake behavior. No finance cards or mixed activity feed on the habit home.
5. Retain a secondary settings surface for name, backup/export/import, logout and recovery. Reduce legacy counts without hiding legacy records from full backups.
6. Preserve the existing dark emerald design and improve hierarchy/responsive spacing. Two-destination mobile navigation, accessible touch targets and visible focus; no new dependencies or decorative assets.
7. Review with typecheck, existing/domain tests, build, desktop/mobile visual QA and local habit create/toggle/reload where possible. Confirm auth/data/finance APIs unchanged.
8. Append CHANGELOG and update implementation status. Commit and push reviewed source to GitHub; verify Cloudflare deployment terminal success and keep the existing URL.

## Delegation
GPT-5.6 Luna implements only the bounded frontend change. Root agent owns review, test environment, handoff documentation, Git operations and publication. No concurrent edits to the same files.

## Acceptance criteria
- Opening the app lands directly on habits, with no tasks, finance summaries or unrelated modules on that page.
- Finance remains a complete single secondary destination.
- Scheduled-day denominator, historic selection and toggles agree; future dates cannot be recorded.
- Existing authentication, saved data, backup and recovery remain intact.
- Desktop and mobile have no clipped controls or unintended horizontal overflow.

## Mobile refinement — user screenshot, 2026-09-15
- Remove the nested container hierarchy on Habits: open sections and a compact progress summary, with the existing palette and controls preserved.
- Reduce header copy and date control width; align habit actions and separate schedule text from streak text so Hebrew metadata does not break awkwardly.
- Give sleep one heading while retaining chart, history, hours, score, notes and CRUD.
- Accept fractional sleep hours such as 7.12 through the website, matching the existing numeric Shortcuts/backend contract. Do not reinterpret existing values as hours-and-minutes notation or migrate saved records.
- Luna implements the scoped frontend changes; root reviews, documents, validates and deploys. Browser capture remains unavailable; the supplied screenshot is the visual evidence for this refinement.

## Fixed calendar weeks
Habit history uses Sunday through Saturday of the selected date's week, replacing the rolling seven days. Following today rolls to the new week on Sunday in Israel time. Future days remain visible but cannot be marked; previous weeks and streaks remain intact. Selecting a historical date displays its calendar week.
