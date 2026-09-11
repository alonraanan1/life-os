# Changelog

This file tracks changes made to the Life OS project by any AI assistant (Claude, ChatGPT/Codex, Cursor, GitHub Copilot, etc.) or by the project owner. Its purpose: let an AI session with no memory of previous sessions understand what was done and continue the work.

## How to use this file

**Before starting work:** read the most recent entries below, plus `AGENTS.md` and `DESIGN.md`, to understand the current state of the project and any open items.

**After finishing a change:** add a new entry at the top of "Entries" (right below this section), using the template below. Do not edit or delete older entries — this is a historical log, not a status board.

Template for a new entry:

```
### YYYY-MM-DD — <AI tool or person>
- **Summary:** what changed and why, in 1-2 lines
- **Files touched:** path/to/file, path/to/other
- **Open items / notes for the next AI:** anything unresolved, follow-ups, or decisions made that shouldn't be silently reversed
```

## Entries

### 2026-09-11 — Claude (Cowork)
- **Summary:** Set up the project as a neutral, multi-AI-friendly workspace: added this changelog and a matching "Multi-AI Change Log" section in `AGENTS.md`, plus a project `README.md` and GitHub setup guide.
- **Files touched:** `CHANGELOG.md` (new), `AGENTS.md` (added a section, rest untouched), `README.md` (new), `docs/GITHUB_SETUP.md` (new)
- **Open items / notes for the next AI:** The only git remote today is `sites`, pointing at OpenAI's ChatGPT Sites host (`git.chatgpt-team.site`) — the proprietary, ChatGPT-only remote the owner wants to stop depending on for day-to-day editing. The owner still needs to create a GitHub repo and add it as a second remote (`origin`) from their own machine's terminal, since that step requires their own GitHub login — see `docs/GITHUB_SETUP.md` for the exact commands. Once that's done, GitHub is the neutral place every AI tool clones/pushes to; the `sites` remote can stay if the owner still wants to redeploy through ChatGPT Sites, or be removed later.
