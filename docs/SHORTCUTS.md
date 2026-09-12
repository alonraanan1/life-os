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

## 6. ציון שינה — POST /api/sleep

Body: `{ "score": 82, "hours": 7.5, "date": "2026-09-12", "note": "" }` — one record per night, id `sleep:<date>`, so re-posting the same day overwrites. At least one of `score` (0–100) or `hours` (0–24) is required; `date` defaults to today and refers to the night just ended.

Garmin's Sleep Score cannot be pulled automatically: Garmin's proprietary metrics (Sleep Score, Body Battery, Training Readiness) have no HealthKit equivalent and never leave Garmin Connect, and the Garmin Connect iOS app exposes no Shortcuts actions. Only sleep stages and duration reach Apple Health. So the score is typed; hours are optional.

## 7. The hub — GET + POST /api/hub

This is the one shortcut that replaces all the others. **GET** returns `{summary, menu}` where the menu is built from today's live state: sleep and check-in appear at the top only while they're still missing (and move to the bottom as "עדכון" once recorded), each habit still unmarked today appears with its current streak, and each unfinished goal appears with its progress. **POST** takes `{choice, value}` — the choice is the menu line exactly as chosen (the server strips the "(hint)" suffix), and the value is free text that the server parses per action:

- `הרגל: <name>` — no value needed; marks it done today, replies with the new streak
- `ציון שינה` — first number is the score, an optional second number is hours
- `צ׳ק־אין` — first number is mood 1–5, the remaining words become the note
- `הוצאה` — first number is the amount, next word is the category, the rest is the description
- `הוצאת אבא` — amount only; category is fixed to `הוצאות אבא`
- `משימה` — the whole value is the title
- `מטרה: <name>` — the number is a delta added to current progress

It replies `{ok:true, message}` with a human-readable confirmation, which the shortcut shows. Because the server does the parsing and the state logic, the phone side stays linear — no If/Otherwise branches to maintain.

## Why there are no ready-made .shortcut files

Generating `.shortcut` files and handing them over does not work, and cannot be made to work from here. Since iOS 15 Apple requires shortcut files to be **signed** before they can be imported; unsigned property lists are rejected outright. Signing happens either through Apple's iCloud service (only reachable from inside the Shortcuts app, via "Copy iCloud Link") or with the `shortcuts sign` CLI on macOS. With a Windows machine and no Mac, neither path is available, so every generated file is dead on arrival regardless of whether its contents are correct.

The shortcuts are therefore built by hand in the Shortcuts app. The `?plain=1` mode on `/api/hub` exists precisely to keep that hand-building short — see the hub section below. If a Mac ever enters the picture, `shortcuts sign -i unsigned.shortcut -o signed.shortcut -m anyone` turns a generated file into an importable one.

"הוצאת אבא" is a stripped-down expense flow for a recurring case: charges made on the owner's father's card via Apple Pay. It only asks for the amount — category (`הוצאות אבא`) and description are fixed.

"הוצאת אבא אוטומטי" is the hands-off version of the same thing, meant to be driven by the **Transaction** personal-automation trigger (iOS 17+). It asks nothing at all: it reads the amount from Shortcut Input and posts it straight through. Set it up on the phone (personal automations can't be imported from a file): Shortcuts → Automation → New → **Transaction** → pick the father's card only → **Run Immediately** (turn off "Ask Before Running") → **Run Shortcut** → "הוצאת אבא אוטומטי", and set that action's Input to the transaction's **Amount** property.

Note on formatting: the amount arriving from Wallet may be currency-formatted (`₪45.50`, `1,234.56`). `num()` in `lib/shortcuts.ts` strips everything except digits, dot and minus before validation, so all the numeric Shortcuts fields (expense amount, check-in mood, goal delta) tolerate that.

## The "Life OS" hub shortcut

Five actions, built by hand, no branching. `BASE` below is `https://sites-project.alonraanan1.workers.dev/api/hub?plain=1` and `KEY` is the value in `.env.shortcuts.txt`.

1. **Get Contents of URL** — `BASE`, method GET, one header `Authorization: Bearer KEY`. With `plain=1` the reply is a bare JSON array, which Shortcuts treats as a list.
2. **Choose from List** — input is the *Contents of URL* magic variable; prompt "מה קרה?".
3. **Ask for Input** — type Text, and drag the *Chosen Item* magic variable in as the **prompt**, so the question is the menu line itself and explains what to type.
4. **Get Contents of URL** — `BASE`, method POST, same Authorization header, Request Body JSON with two text fields: `choice` = *Chosen Item*, `value` = *Provided Input*.
5. **Show Result** — the *Contents of URL* from step 4; with `plain=1` the reply is the confirmation sentence as bare text.

Give it a Siri phrase and put it on the Home Screen; it is the single entry point for everything.

Two one-off shortcuts are worth building alongside it, both posting to the same hub: a morning "ציון שינה" (Ask for Input → POST with `choice` = `ציון שינה`, `value` = *Provided Input*), and "הוצאת אבא אוטומטי" for the Transaction automation (a single POST with `choice` = `הוצאת אבא`, `value` = *Shortcut Input*).

All actions are idempotent where it matters: expense and task accept an `externalId` to make retries safe; habit-mark, check-in, sleep and goal-progress overwrite the same day/goal, so re-running one after a network hiccup never creates duplicates.
