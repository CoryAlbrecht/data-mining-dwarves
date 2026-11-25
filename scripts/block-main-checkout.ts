/**
 * Claude Code PreToolUse hook (registered in .claude/settings.json) for Bash, Edit, Write and
 * NotebookEdit.
 *
 * Agents work in a linked worktree on their own branch and land changes through a PR (see
 * docs/agents/workflow.md). The main checkout belongs to the developer, and `main` only moves by
 * merging a PR. This hook rejects edits to files in the main checkout and git commands that would
 * write to `main` from any worktree (exit 2 sends the reason back to the agent).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHookInput, simpleCommands } from './shell.ts';

/**
 * The environment without GIT_* variables. Inside a git hook (the pre-commit run of the tests),
 * GIT_DIR and GIT_INDEX_FILE would point every git call at the repo being committed, whatever `-C` says.
 */
export const gitFreeEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

/** Run git in `dir`; its trimmed output, or null when it fails. */
function git(dir: string, ...args: string[]): string | null {
  try {
    return execFileSync('git', ['-C', dir, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env: gitFreeEnv(),
    }).trim();
  } catch {
    return null;
  }
}

/** The nearest directory at or above `path` that exists (a new file's parents may not yet). */
function existingDir(path: string): string {
  let dir = dirname(path);
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  return dir;
}

/** The main checkout of the repo `dir` is in: the worktree that holds the shared .git directory. */
function mainCheckout(dir: string): string | null {
  const common = git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  return common ? dirname(common) : null;
}

/** True when writing `path` would change a file in the main checkout of the repo at `projectDir`. */
export function editBlocked(path: string, projectDir: string): boolean {
  const main = mainCheckout(projectDir);
  const file = resolve(path);
  const dir = existingDir(file);
  if (!main || git(dir, 'rev-parse', '--show-toplevel') !== main) return false;
  return git(main, 'check-ignore', '-q', file) === null; // exits 1 when not ignored
}

/** The git subcommands that write to the branch they act on. */
const WRITES = new Set(['commit', 'push', 'merge', 'rebase', 'reset']);
/** git's global options that take the next word as their value. */
const GLOBAL_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);

/** A git command's directory after its `-C` options, its subcommand and that subcommand's arguments. */
function readGit(args: string[], dir: string): { dir: string; sub?: string; rest: string[] } {
  let k = 0;
  for (; k < args.length && args[k]!.startsWith('-'); k++) {
    if (args[k] === '-C') dir = resolve(dir, args[k + 1] ?? '.');
    if (GLOBAL_VALUE_OPTIONS.has(args[k]!)) k++;
  }
  return { dir, sub: args[k], rest: args.slice(k + 1) };
}

/** The branch checked out in `dir`, or null (detached HEAD, or not in a repo). */
const branchIn = (dir: string) => (existsSync(dir) ? git(dir, 'symbolic-ref', '--short', '-q', 'HEAD') : null);

/** `git push` options that take the next word as their value. */
const PUSH_VALUE_OPTIONS = new Set(['--repo', '-o', '--push-option', '--receive-pack', '--exec']);

/** True when a `git push` with these arguments names `main` as a destination, or pushes every branch. */
function pushesToMain(args: string[]): boolean {
  const positional: string[] = [];
  let repoGiven = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!;
    if (a === '--all' || a === '--branches' || a === '--mirror') return true;
    if (a === '--repo' || a.startsWith('--repo=')) repoGiven = true;
    if (PUSH_VALUE_OPTIONS.has(a)) k++;
    else if (!a.startsWith('-')) positional.push(a);
  }
  const refspecs = repoGiven ? positional : positional.slice(1);
  return refspecs.some((spec) => {
    const dest = spec.replace(/^\+/, '').split(':').at(-1)!;
    return dest.replace(/^refs\/heads\//, '') === 'main';
  });
}

/** True when `command`, run in `cwd`, would commit, push, merge, rebase or reset `main`. */
export function gitBlocked(command: string, cwd: string): boolean {
  for (const { words, dir: here } of simpleCommands(command, cwd)) {
    if (words[0] !== 'git') continue;
    const { dir, sub, rest } = readGit(words.slice(1), here);
    if (!sub || !WRITES.has(sub)) continue;
    if (branchIn(dir) === 'main' || (sub === 'push' && pushesToMain(rest))) return true;
  }
  return false;
}

async function main() {
  const input = await readHookInput<{
    tool_name?: string;
    cwd?: string;
    tool_input?: { command?: string; file_path?: string; notebook_path?: string };
  }>();
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const cwd = input.cwd ?? projectDir;
  let reason: string | undefined;
  if (input.tool_name === 'Bash') {
    if (gitBlocked(input.tool_input?.command ?? '', cwd)) {
      reason = 'git commit/push/merge/rebase/reset would write to main. Work on your own branch in a linked worktree and land it through a PR';
    }
  } else {
    const path = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
    if (path && editBlocked(resolve(cwd, path), projectDir)) {
      reason = `${path} is in the main checkout, which belongs to the developer. Edit it in your own linked worktree`;
    }
  }
  if (reason) {
    process.stderr.write(`Blocked: ${reason}. See docs/agents/workflow.md.\n`);
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
