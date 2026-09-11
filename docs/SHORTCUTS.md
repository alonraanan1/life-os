# Apple Shortcuts intake

All endpoints below live at `https://sites-project.alonraanan1.workers.dev` and share ONE secret:

Header `Authorization: Bearer YOUR_PRIVATE_KEY`

The key is provisioned as the Worker secret `APPLE_SHORTCUTS_API_KEY` (owner's local copy: `.env.shortcuts.txt`). Never commit it. Every endpoint below is gated by this bearer key alone — no cookie/session needed, so these work from Shortcuts running outside the browser.

Build five small shortcuts (one per action below), each with its own name and its own icon/color, then a sixth "Life OS" menu shortcut that runs one of the other five based on a "Choose from Menu" step — see the bottom of this file.

## 1. הוצאה חדשה — POST /api/expense

Body: `{ "amount": 45.50, "category": "אוכל", "description": "ארוחת צהריים", "date": "2026-09-11", "externalId": "..." }`

`amount` is ILS (stored as agorot). `date` and `externalId` are optional (date defaults to today). Use the same `externalId` on retry to avoid duplicates. 201 = created, 200 = already recorded.

Shortcut steps: Ask for Input (Number) → amount. Choose from List (your categories) → category. Ask for Input (Text, optional) → description. Generate UUID (once, reused as externalId on retry within the same run). Get Contents of URL: POST, headers `Content-Type: application/json` + `Authorization: Bearer ...`, JSON body with the four fields above.

## 2. משימה חדשה — POST /api/task

Body: `{ "title": "לקנות חלב", "date": "2026-09-11", "time": "18:00", "externalId": "..." }`

`title` is required; `date`, `time`, `externalId` are all optional (task is created with no date/time if omitted). 201 = created, 200 = already recorded (only relevant if you pass externalId).

Shortcut steps: Ask for Input (Text) → title. (Optional) Ask for Input (Date) → format as `YYYY-MM-DD` for date. Get Contents of URL: POST with the bearer header and a JSON body `{"title": title}` (add date/time keys only if you collected them).

## 3. סימון הרגל כבוצע — GET + POST /api/habit-mark

GET (no body) returns `{ "habits": ["שתיית מים", "קריאה 20 דק׳"] }` — the live list of your habit names, for a dynamic picker.

POST body: `{ "title": "שתיית מים", "date": "2026-09-11" }` — `title` must match an existing habit's name (not case-sensitive, whitespace-trimmed); `date` optional (defaults to today, can't be future). Returns `{"ok":true,"habit":"...","date":"..."}` or 404 `{"error":"habit_not_found"}` if the name doesn't match anything.

Shortcut steps: Get Contents of URL (GET, bearer header) → Get Dictionary from Input → Get Value for `habits` → Choose from List → Get Contents of URL (POST, bearer header, JSON body `{"title": <chosen habit>}`).

## 4. צ׳ק־אין יומי — POST /api/checkin

Body: `{ "mood": 4, "note": "יום טוב", "date": "2026-09-11" }`

`mood` is required, an integer 1–5. `note` and `date` optional (date defaults to today, can't be future). Saving twice for the same day overwrites that day's check-in (by design — one check-in per day). Returns `{"ok":true,"date":"...","mood":4}`.

Shortcut steps: Ask for Input (Number, range 1–5, or Choose from List with the five options) → mood. Ask for Input (Text, optional) → note. Get Contents of URL: POST, bearer header, JSON body `{"mood": mood, "note": note}`.

## 5. עדכון התקדמות במטרה — GET + POST /api/goal-progress

GET (no body) returns `{ "goals": ["קרן חופשה ביוון"] }` — your live goal names.

POST body: either `{ "title": "קרן חופשה ביוון", "delta": 200 }` (adds 200 to the goal's current progress — negative numbers subtract) or `{ "title": "...", "current": 3600 }` (sets the absolute value instead). `title` must match an existing goal's name. Returns `{"ok":true,"goal":"...","current":3600,"target":5000,"pct":72}` or 404 `{"error":"goal_not_found"}`.

Shortcut steps: Get Contents of URL (GET, bearer header) → Get Dictionary from Input → Get Value for `goals` → Choose from List → Ask for Input (Number) → how much to add → Get Contents of URL (POST, bearer header, JSON body `{"title": <chosen goal>, "delta": <number>}`).

## Ready-made .shortcut files

Six `.shortcut` files (one per action above, plus a dedicated "הוצאת אבא" shortcut — see below) were generated with the bearer key already embedded and delivered directly to the owner in chat; the menu shortcut still needs to be assembled by hand in the Shortcuts app (Choose from Menu → Run Shortcut per action), since personal automations/menus aren't something that imports from a file.

"הוצאת אבא" is a stripped-down expense shortcut for a recurring case: charges made on the owner's father's card via Apple Pay. It only asks for the amount — category (`הוצאות אבא`) and description are fixed. Apple does not expose Apple Pay/Wallet transaction details to Shortcuts (no automation trigger can read a transaction's amount), so full hands-off logging isn't possible; this shortcut is the lowest-friction alternative (one tap, one number). It can optionally be wired to a Personal Automation that triggers when a notification arrives from Wallet, to open the shortcut automatically — but the amount still has to be typed in by hand.

## The menu shortcut

Build a sixth shortcut ("Life OS") with a single "Choose from Menu" action listing the five actions above by name (הוצאה חדשה / משימה חדשה / סימון הרגל / צ׳ק־אין יומי / עדכון התקדמות במטרה). Under each menu item, add a "Run Shortcut" action pointing at that action's own shortcut (pass no input — each one asks for what it needs on its own). This way each shortcut also keeps working standalone (put it on the Home Screen, run it via Siri, or add it to a Focus Filter/automation on its own), and the menu shortcut is just a front door to all five. Give the menu shortcut a Siri phrase like "לייף אין דבר חדש" or whatever feels natural to say out loud.

All five actions are idempotent by design where it matters: expense and task both accept an `externalId` to make retries safe; habit-mark, check-in and goal-progress simply overwrite the same day/goal, so re-running one after a network hiccup never creates duplicates.
