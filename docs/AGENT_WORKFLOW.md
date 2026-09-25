# GPT → GPT → Claude workflow

Codex owns the user request, decomposition, integration, and final verification.
For independent substantial tasks, it may spawn a GPT coordinator using the
available internal subagent tools. Each coordinator can run one Claude worker
at a time through `scripts/claude-worker.mjs`. Use at most two Claude workers
concurrently by default, and avoid adding a coordinator for trivial tasks.
If internal GPT subagents are unavailable, Codex directly manages Claude.

This is an on-demand workflow during an active Codex task, not a background
service. The user's Claude account must be logged in; calls consume that
account's usage. The runner defaults to a $1 API budget and ten-minute timeout;
the CLI budget is not a guarantee about subscription usage limits.

## Assignment and isolation

1. Read `AGENTS.md`, the newest `CHANGELOG.md` entries, and `DESIGN.md` for UI work.
2. Inspect status and identify an exact baseline commit. Existing uncommitted
   changes belong to the current writer. A new worktree contains the chosen
   commit, **not** those changes. Resolve dependencies on pending work before
   assigning a worker; never silently commit, stash, or copy the whole workspace.
3. Create an isolated checkout with a unique branch, for example:

   ```sh
   git worktree add -b codex/task-T001 work/agents/T001 HEAD
   ```

   `work/` is already ignored. Use a baseline SHA instead of HEAD where required.
   Each worker owns a distinct worktree. Do not copy credentials, `.env` files,
   local databases, or `node_modules` into it. Install dependencies only as
   needed and authorized. Use separate ports and local databases for servers.
4. Create a task JSON file from `docs/agent-task.example.json`, replacing every
   placeholder with an actual objective, owned files, acceptance criteria,
   coordinator identity, and the verified baseline SHA. Store live briefs in
   `work/agent-tasks/`; keep relevant durable handoffs under `docs/handoffs/`.
5. From the primary checkout, invoke:

   ```sh
   node scripts/claude-worker.mjs work/agent-tasks/T001.json work/agents/T001 edit
   ```

   Use `read` for investigation (the default). The runner saves the submitted
   task, status, stdout JSON, and stderr under `work/agent-runs/`. Each invocation
   is a fresh Claude conversation: follow-up briefs must carry earlier results.

## Permissions and ownership

The runner uses restricted mode, no MCP servers, no skills, no shell tools,
and no inherited user/project/local settings. Read workers get Read/Glob/Grep;
edit workers additionally get Edit/Write, with normal edit permission handling.
No permission-bypass flag is used. If blocked, return the exact blocker to
Codex, which handles the needed operation under its own permissions.
Claude cannot execute tests through this runner: the GPT coordinator does so.
Tool limits and worktree separation do not constitute OS security isolation;
owned-file scope is an instruction that the coordinator verifies in the diff.

Assign shared API contracts, schema/migrations, lockfiles, CI/configuration,
and agent instructions to one owner. Each worker adds its required changelog
entry only within its own worktree; the integrator preserves all entries when
combining them. Workers never merge, push, deploy, delete worktrees, or spawn
additional agents. Do not overlap writes in the same checkout.

## Review and completion

The worker must return: summary, changed files, tests actually run, unverified
claims, blockers, and exact next action. A successful CLI response means only
`returned`, not accepted. The coordinator reviews permission denials, refusal
or budget errors, unexpected files, diff, and acceptance criteria. Check tracked
and untracked files. Run proportional validation independently in the worker
checkout, including desktop/mobile visual QA for meaningful UI changes.

Record task status as `queued → running → returned → verified → integrated`,
or `blocked/failed`. Codex alone marks verified/integrated. On timeout or failure,
keep the checkout and logs for inspection; retries are explicit new invocations.
Integrate only reviewed changes without overwriting concurrent user edits.
Do not automatically publish, merge to a remote, or clean up branches.

For unfinished tasks, write a handoff containing task ID, parent/coordinator,
objective, owned files, baseline and reviewed SHA, worktree/branch, actual
validation results, current status, and one exact next action. Logs may contain
private code and stay local in ignored `work/`.
