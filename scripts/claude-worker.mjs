#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, realpathSync, createWriteStream } from 'node:fs';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const [briefPath, checkoutPath, mode = 'read'] = process.argv.slice(2);
if (!briefPath || !checkoutPath || !['read', 'edit'].includes(mode)) {
  console.error('Usage: node scripts/claude-worker.mjs TASK.json WORKTREE [read|edit]');
  process.exit(2);
}
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const task = JSON.parse(readFileSync(resolve(briefPath), 'utf8'));
const checkout = realpathSync(resolve(checkoutPath));
if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(task.id ?? '') ||
    !/^[a-f0-9]{40,64}$/.test(task.baseSha ?? '') ||
    typeof task.objective !== 'string' || !task.objective.trim() ||
    typeof task.coordinator !== 'string' || !task.coordinator.trim() ||
    !Array.isArray(task.ownedFiles) || !task.ownedFiles.length ||
    !Array.isArray(task.acceptance) || !task.acceptance.length ||
    !task.acceptance.every(x => typeof x === 'string' && x.trim())) {
  throw new Error('Task requires id, coordinator, full baseSha, objective, ownedFiles, and acceptance.');
}
for (const file of task.ownedFiles) {
  if (typeof file !== 'string' || !file || isAbsolute(file) ||
      file.split(/[\\/]/).includes('..') || file.startsWith('.git/')) {
    throw new Error('ownedFiles must contain repository-relative paths.');
  }
}
if (realpathSync(git(checkout, 'rev-parse', '--show-toplevel')) !== checkout ||
    git(checkout, 'rev-parse', 'HEAD') !== task.baseSha) {
  throw new Error('Checkout must be a repository root at the specified baseline SHA.');
}
if (mode === 'edit') {
  const common = cwd => realpathSync(resolve(cwd, git(cwd, 'rev-parse', '--git-common-dir')));
  if (checkout === root || common(checkout) !== common(root)) {
    throw new Error('Edit mode requires a separate worktree of this repository.');
  }
  if (git(checkout, 'status', '--porcelain')) {
    throw new Error('Edit mode requires a clean worktree; review existing changes first.');
  }
}
const budget = task.budgetUsd ?? 1;
const seconds = task.timeoutSeconds ?? 600;
if (!Number.isFinite(budget) || budget <= 0 || budget > 10 ||
    !Number.isFinite(seconds) || seconds < 10 || seconds > 1800) {
  throw new Error('budgetUsd must be >0 and <=10; timeoutSeconds must be 10..1800.');
}
if (task.model !== undefined && !['haiku', 'sonnet', 'opus'].includes(task.model)) {
  throw new Error('model must be haiku, sonnet, or opus.');
}
const run = resolve(root, 'work/agent-runs', `${task.id}-${Date.now()}-${process.pid}`);
mkdirSync(run, { recursive: true });
const save = (name, value) => writeFileSync(resolve(run, name), JSON.stringify(value, null, 2) + '\n');
save('task.json', task);
const tools = mode === 'read' ? 'Read,Glob,Grep' : 'Read,Glob,Grep,Edit,Write';
const prompt = [
  'You are a bounded Claude worker managed by a GPT coordinator.',
  'Read AGENTS.md and recent CHANGELOG.md entries first; read DESIGN.md before UI work.',
  'Follow docs/AGENT_WORKFLOW.md if present. No further delegation.',
  'Edit only ownedFiles, plus the required CHANGELOG.md entry in this checkout.',
  'Do not access credentials or change git/configuration/settings. Do not merge, push, or deploy.',
  'Return summary, changed files, tests actually run, unverified claims, blockers, and exact next action.',
  'You have no command execution tools. Ask your coordinator to run needed tests.',
  mode === 'read' ? 'This is read-only; make no changes.' : 'Implement only the assigned scope.',
  JSON.stringify(task, null, 2),
].join('\n\n');
save('status.json', { state: 'running', checkout, mode, startedAt: new Date().toISOString() });
console.log(`Worker logs: ${relative(root, run)}`);
const output = createWriteStream(resolve(run, 'result.json'));
const errors = createWriteStream(resolve(run, 'stderr.log'));
const child = spawn('claude', [
  '-p', '--restricted', '--output-format', 'json', '--no-session-persistence',
  '--permission-mode', mode === 'read' ? 'dontAsk' : 'acceptEdits',
  '--permission-prompts', 'none', '--tools', tools, '--allowedTools', tools,
  '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
  '--setting-sources', '', '--disable-slash-commands', '--no-chrome',
  '--max-budget-usd', String(budget),
  ...(task.model ? ['--model', task.model] : []),
], { cwd: checkout, stdio: ['pipe', 'pipe', 'pipe'] });
child.stdout.pipe(output);
child.stderr.pipe(errors);
child.stdin.on('error', () => {});
child.stdin.end(prompt);
let stopReason;
let killTimer;
const stop = reason => {
  if (stopReason) return;
  stopReason = reason;
  child.kill('SIGTERM');
  killTimer = setTimeout(() => child.kill('SIGKILL'), 5000);
};
const timer = setTimeout(() => stop('timed_out'), seconds * 1000);
process.once('SIGINT', () => stop('interrupted'));
process.once('SIGTERM', () => stop('interrupted'));
let launchError;
child.on('error', error => { launchError = error.message; });
child.on('close', async (code, signal) => {
  clearTimeout(timer);
  clearTimeout(killTimer);
  await Promise.all([output, errors].map(stream => stream.writableFinished
    ? Promise.resolve() : new Promise(resolveDone => stream.once('finish', resolveDone))));
  let result;
  try { result = JSON.parse(readFileSync(resolve(run, 'result.json'), 'utf8')); } catch {}
  const success = code === 0 && result?.type === 'result' &&
    result.subtype === 'success' && result.is_error !== true;
  const denied = result?.permission_denials?.length > 0;
  const state = stopReason ?? (launchError || !success ? 'failed' : denied ? 'blocked' : 'returned');
  save('status.json', { state, checkout, mode, code, signal, launchError,
    finishedAt: new Date().toISOString(), reviewRequired: true });
  console.log(`Worker ${state}. Inspect result.json and checkout diff before acceptance.`);
  process.exitCode = state === 'returned' ? 0 : 1;
});
