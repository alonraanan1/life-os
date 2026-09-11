# Apple Shortcuts expense intake

POST https://sites-project.alonraanan1.workers.dev/api/expense
Header Content-Type: application/json
Header Authorization: Bearer YOUR_PRIVATE_KEY

Body:
{ "amount": 45.50, "category": "אוכל", "description": "ארוחת צהריים", "date": "2026-09-11", "externalId": "a-unique-id-for-this-expense" }

amount is in ILS (the app stores integer agorot). Use the same externalId when retrying so the expense is not duplicated. A 201 creates a record; 200 with created:false means already recorded. Activate the owner account first. The key is provisioned separately as APPLE_SHORTCUTS_API_KEY and must never be committed. Owner's local copy is .env.shortcuts.txt. No Supabase dependency remains in this endpoint.

In iPhone Shortcuts use Ask for Input for amount, Choose from List for category, Generate UUID once for externalId, and Get Contents of URL with POST, headers and JSON fields above. iPhone installation requires the owner; no shortcut has been installed remotely.
