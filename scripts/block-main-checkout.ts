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
import { basename, dirname, join, resolve, sep } from 'node:path';
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
  const checkout = mainCheckout(projectDir);
  const file = resolve(path);
  if (!checkout) return false;
  // Inside .git, `--show-toplevel` fails, so the repo's own files are matched by path.
  const gitDir = join(checkout, '.git');
  if (file === gitDir || file.startsWith(gitDir + sep)) return true;
  if (git(existingDir(file), 'rev-parse', '--show-toplevel') !== checkout) return false;
  return git(checkout, 'check-ignore', '-q', file) === null; // exits 1 when not ignored
}

/** True when `ref` names the `main` branch. */
const isMain = (ref: string | undefined) => ref?.replace(/^refs\/heads\//, '') === 'main';

/** The git subcommands that write to the branch they act on (`pull` unless it only fast-forwards from origin). */
const MAIN_WRITING_SUBCOMMANDS = new Set(['commit', 'push', 'merge', 'rebase', 'reset', 'cherry-pick', 'revert', 'am', 'pull']);
/** git's global options that take the next word as their value. */
const GLOBAL_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--config-env', '--super-prefix']);
/** The global options that choose which repo and worktree git acts on. */
const LOCATION_OPTIONS = new Set(['-C', '--git-dir', '--work-tree']);

/**
 * A git command's location options (`-C`, `--git-dir`, `--work-tree`, each as one `--opt=value`
 * word or two words), its subcommand and that subcommand's arguments.
 */
function parseGitCommand(args: string[]): { locationArgs: string[]; sub?: string; rest: string[] } {
  const locationArgs: string[] = [];
  let k = 0;
  for (; k < args.length && args[k]!.startsWith('-'); k++) {
    const name = args[k]!.split('=')[0]!;
    if (LOCATION_OPTIONS.has(name)) locationArgs.push(...(name === args[k] ? args.slice(k, k + 2) : [args[k]!]));
    if (GLOBAL_VALUE_OPTIONS.has(args[k]!)) k++;
  }
  return { locationArgs, sub: args[k], rest: args.slice(k + 1) };
}

/** The branch a git command run in `dir` with these location options acts on, or null (detached HEAD, or not in a repo). */
const branchIn = (dir: string, locationArgs: string[]) =>
  existsSync(dir) ? git(dir, ...locationArgs, 'symbolic-ref', '--short', '-q', 'HEAD') : null;

/** `git rebase` options that take the next word as their value. */
const REBASE_VALUE_OPTIONS = new Set(['--onto', '-s', '--strategy', '-X', '--strategy-option', '-x', '--exec']);

/** True when a `git rebase` with these arguments names `main` as the branch to rebase (not the upstream). */
function rebasesMain(args: string[]): boolean {
  const positional: string[] = [];
  for (let k = 0; k < args.length; k++) {
    if (REBASE_VALUE_OPTIONS.has(args[k]!)) k++;
    else if (!args[k]!.startsWith('-')) positional.push(args[k]!);
  }
  return isMain(args.includes('--root') ? positional[0] : positional[1]);
}

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
  return refspecs.some((spec) => isMain(spec.replace(/^\+/, '').split(':').at(-1)));
}

/** `git pull` options that take the next word as their value. */
const PULL_VALUE_OPTIONS = new Set([
  '--depth', '--deepen', '--shallow-since', '--shallow-exclude', '-j', '--jobs', '--upload-pack', '-s', '--strategy',
  '-X', '--strategy-option', '-o', '--server-option', '--negotiation-tip', '--cleanup',
]);

/**
 * True when a `git pull` with these arguments can only fast-forward to `origin`'s `main`: the last
 * of `--ff-only`, `--ff` and `--no-ff` is `--ff-only`, it doesn't rebase, and it names no source
 * other than `origin` and `main`.
 */
function fastForwardsFromOrigin(args: string[]): boolean {
  let ffOnly = false;
  let rebase = false;
  const positional: string[] = [];
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!;
    if (a === '--ff-only') ffOnly = true;
    else if (a === '--ff' || a === '--no-ff') ffOnly = false;
    else if (a === '--no-rebase' || a === '--rebase=false') rebase = false;
    else if (a === '-r' || a === '--rebase' || a.startsWith('--rebase=')) rebase = true;
    else if (PULL_VALUE_OPTIONS.has(a)) k++;
    else if (!a.startsWith('-')) positional.push(a);
  }
  const [remote, ...refspecs] = positional;
  return ffOnly && !rebase && (remote === undefined || remote === 'origin') && refspecs.every(isMain);
}

/** `git branch` options that take the next word as their value. */
const BRANCH_VALUE_OPTIONS = new Set([
  '-u', '--set-upstream-to', '--sort', '--format', '--contains', '--no-contains', '--merged', '--no-merged', '--points-at',
]);

/** True when a `git branch` with these arguments force-moves, renames or copies onto, or deletes `main`. */
function branchMovesMain(args: string[]): boolean {
  let force = false;
  let move = false;
  let del = false;
  const positional: string[] = [];
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!;
    if (BRANCH_VALUE_OPTIONS.has(a)) k++;
    else if (a.startsWith('--')) {
      force ||= a === '--force';
      move ||= a === '--move' || a === '--copy';
      del ||= a === '--delete';
    } else if (a.startsWith('-') && a.length > 1) {
      // A cluster of short flags, as in -fM.
      force ||= a.includes('f');
      move ||= /[mMcC]/.test(a);
      del ||= /[dD]/.test(a);
    } else positional.push(a);
  }
  if (del) return positional.some(isMain);
  if (move) return isMain(positional.at(-1)); // the new name: `-M old new`, or `-M new` for the current branch
  return force && isMain(positional[0]); // `-f main <start>` moves main; `-f other main` only reads it
}

/** The ref a `git update-ref` with these arguments changes. */
function updateRefTarget(args: string[]): string | undefined {
  for (let k = 0; k < args.length; k++) {
    if (args[k] === '-m') k++;
    else if (!args[k]!.startsWith('-')) return args[k];
  }
  return undefined;
}

/** The location options that GIT_DIR and GIT_WORK_TREE, given to a command run in `dir`, stand for. */
const envLocationArgs = (env: Map<string, string>, dir: string) =>
  [
    ['GIT_DIR', '--git-dir'],
    ['GIT_WORK_TREE', '--work-tree'],
  ].flatMap(([name, option]) => (env.has(name!) ? [`${option}=${resolve(dir, env.get(name!)!)}`] : []));

/** True when `command`, run in `cwd`, would write to `main` (see MAIN_WRITING_SUBCOMMANDS), or move it without a commit. */
export function gitBlocked(command: string, cwd: string): boolean {
  for (const { words, env, dir } of simpleCommands(command, cwd)) {
    if (!words[0] || basename(words[0]) !== 'git') continue;
    const { locationArgs, sub, rest } = parseGitCommand(words.slice(1));
    // Options on the command line override the environment, so they come last.
    const onMain = () => branchIn(dir, [...envLocationArgs(env, dir), ...locationArgs]) === 'main';
    if (sub === 'branch' && branchMovesMain(rest)) return true;
    if (sub === 'update-ref') {
      const ref = updateRefTarget(rest);
      if (isMain(ref) || (ref === 'HEAD' && onMain())) return true;
    }
    if (!sub || !MAIN_WRITING_SUBCOMMANDS.has(sub)) continue;
    if (sub === 'pull' && fastForwardsFromOrigin(rest)) continue;
    if (sub === 'push' && pushesToMain(rest)) return true;
    if (sub === 'rebase' && rebasesMain(rest)) return true;
    if (onMain()) return true;
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
      reason = 'this git command would write to or move main (on main, git pull is allowed only as git pull --ff-only, from origin). Work on your own branch in a linked worktree and land it through a PR';
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
