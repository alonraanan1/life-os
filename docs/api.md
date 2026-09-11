# Life OS API

All automation endpoints live under `/api` and return JSON. Keep the Supabase service role key on the server only.

## Create expense

`POST /api/expense`

```json
{
  "amount": 45,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-09-11T13:30:00+03:00",
  "externalId": "shortcut-2026-09-11-1330"
}
```

`externalId` is optional and intended for idempotency when an Apple Shortcut retries. The endpoint validates amount, category, and ISO-8601 date before inserting into Supabase.

## Health

`GET /api/health`

The same module boundary can later add `/api/task`, `/api/habit-entry`, `/api/check-in`, and `/api/goal-progress` without changing the dashboard.
