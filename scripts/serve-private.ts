/**
 * An agent's own private copy of the game (API, client and headless Chrome), on free ports away
 * from the developer's 5173 / 8787, started and stopped as one unit.
 *
 *   npm run serve:private                        start a copy; prints its URLs, ports and id
 *   npm run serve:private -- stop <id>           stop one copy
 *   npm run serve:private -- stop --session <s>  stop the copies a Claude Code session started
 *   npm run serve:private -- stop                stop every copy (a developer's cleanup)
 *   … stop --from-hook                            SessionEnd hook: stop the ending session's copies
 *                                                 (its id comes as JSON on stdin)
 */
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHookInput } from './shell.ts';

/** Port ranges for private copies: clear of the defaults (5173, 8787, Chrome's 9222). */
export const RANGES = {
  client: [5200, 5299],
  api: [8800, 8899],
  chrome: [9300, 9399],
} as const;

export type Ports = Record<keyof typeof RANGES, number>;

/** The first port of each range that `isFree` accepts and no other copy has `taken`. */
export async function pickPorts(isFree: (port: number) => Promise<boolean>, taken: Set<number>): Promise<Ports> {
  const pick = async ([lo, hi]: readonly [number, number]) => {
    for (let p = lo; p <= hi; p++) if (!taken.has(p) && (await isFree(p))) return p;
    throw new Error(`no free port in ${lo}–${hi}`);
  };
  return { client: await pick(RANGES.client), api: await pick(RANGES.api), chrome: await pick(RANGES.chrome) };
}

/** A running private copy, as recorded in its run file. */
export interface Copy {
  id: string;
  /** Session id of the copy. Every process it starts stays in this session, port or no port. */
  sid: number;
  /** When the session's leader started (clock ticks since boot), so a reused number is never mistaken for it. */
  started: number;
  /** The Claude Code session that started the copy, or null for a developer. */
  owner: string | null;
  ports: Ports;
}

/** Where run files, logs, Chrome profiles and Vite caches live: git-ignored, at the repo root. */
const RUN_DIR = resolve(import.meta.dirname, '..', '.serve-private');

/** Everything a copy keeps on disk. */
const copyPaths = (runDir: string, id: string) => ({
  run: join(runDir, `${id}.json`),
  log: join(runDir, `${id}.log`),
  chrome: join(runDir, `${id}-chrome`),
  vite: join(runDir, `${id}-vite`),
});

export function recordCopy(runDir: string, copy: Copy) {
  mkdirSync(runDir, { recursive: true });
  writeFileSync(copyPaths(runDir, copy.id).run, JSON.stringify(copy, null, 2));
}

/** The recorded copies. A run file that can't be read (half-written, hand-edited) is skipped. */
export function listCopies(runDir: string): Copy[] {
  if (!existsSync(runDir)) return [];
  return readdirSync(runDir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      try {
        return [JSON.parse(readFileSync(join(runDir, f), 'utf8')) as Copy];
      } catch {
        console.warn(`Skipping unreadable run file ${f}.`);
        return [];
      }
    });
}

/** Start time of a process, in clock ticks since boot (field 22 of /proc/<pid>/stat), or null if it's gone. */
export function startTicks(pid: number): number | null {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    return Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19]);
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const survivors = (sid: number) => spawnSync('pgrep', ['-s', String(sid)], { encoding: 'utf8' }).stdout.trim();

/** Wait up to 3 s for every process of a session to exit; true if they all did. */
async function waitGone(sid: number): Promise<boolean> {
  for (let t = 0; t < 30 && survivors(sid); t++) await sleep(100);
  return !survivors(sid);
}

/**
 * Stop every process in the copy's session: TERM first, then KILL whatever is left (tsx watch and
 * concurrently shrug off TERM). If the session's leader has been replaced by an unrelated process
 * of the same number, the run file is stale and nothing is signalled. Removes the copy's files once
 * nothing of it is alive.
 */
export async function stopCopy(runDir: string, id: string): Promise<void> {
  let copy: Copy;
  try {
    copy = JSON.parse(readFileSync(copyPaths(runDir, id).run, 'utf8')) as Copy;
  } catch {
    throw new Error(`no readable run file for private copy "${id}"`);
  }
  const leader = startTicks(copy.sid);
  // Leader gone: its session number stays reserved while any member lives, so signalling is safe.
  const ours = leader === null || leader === copy.started;
  if (ours && survivors(copy.sid)) {
    spawnSync('pkill', ['-TERM', '-s', String(copy.sid)]);
    if (!(await waitGone(copy.sid))) spawnSync('pkill', ['-KILL', '-s', String(copy.sid)]);
    if (!(await waitGone(copy.sid))) {
      throw new Error(`copy ${id} still has processes: ${survivors(copy.sid).replace(/\n/g, ' ')}`);
    }
  }
  for (const path of Object.values(copyPaths(runDir, id))) {
    if (!path.endsWith('.log')) rmSync(path, { recursive: true, force: true });
  }
}

/** True if nothing listens on `port` (any interface). */
function portIsFree(port: number): Promise<boolean> {
  return new Promise((done) => {
    const server = createServer();
    server.once('error', () => done(false));
    server.listen(port, () => server.close(() => done(true)));
  });
}

/**
 * Hold the run directory's lock while choosing ports, so two starts never pick the same ones. It's
 * a kernel lock (flock) on an open file: the kernel releases it when this process exits, however it
 * dies, so a lock can never go stale.
 */
async function withLock<T>(runDir: string, work: () => Promise<T>): Promise<T> {
  mkdirSync(runDir, { recursive: true });
  const fd = openSync(join(runDir, '.lock'), 'a');
  try {
    // flock locks the open file shared with this process, so the lock outlives the flock command.
    const got = spawnSync('flock', ['-x', '-w', '15', '3'], { stdio: ['ignore', 'inherit', 'inherit', fd] });
    if (got.status !== 0) throw new Error('timed out waiting for another serve:private start');
    return await work();
  } finally {
    closeSync(fd); // releases the lock
  }
}

/** Poll until `check` passes, up to `seconds`. */
async function waitFor(check: () => Promise<boolean>, seconds: number): Promise<boolean> {
  for (let t = 0; t < seconds * 2; t++) {
    if (await check()) return true;
    await sleep(500);
  }
  return false;
}
const answers = (url: string) => () => fetch(url).then((r) => r.ok, () => false);

async function start() {
  const repo = resolve(import.meta.dirname, '..');
  const copy = await withLock(RUN_DIR, async () => {
    const taken = new Set(listCopies(RUN_DIR).flatMap((c) => Object.values(c.ports)));
    const ports = await pickPorts(portIsFree, taken);
    const id = `copy-${ports.client}`;
    const paths = copyPaths(RUN_DIR, id);
    const log = openSync(paths.log, 'w');
    const chrome = [
      'google-chrome --headless=new',
      `--remote-debugging-port=${ports.chrome}`,
      `--user-data-dir=${paths.chrome}`,
      '--window-size=420,900 about:blank',
    ].join(' ');
    // detached: a new session, so stopCopy can reach every process the copy ever starts.
    const leader = spawn('bash', ['-c', `npm run dev & ${chrome} & wait`], {
      cwd: repo,
      detached: true,
      stdio: ['ignore', log, log],
      env: { ...process.env, CLIENT_PORT: String(ports.client), API_PORT: String(ports.api), VITE_CACHE_DIR: paths.vite },
    });
    leader.unref();
    const copy: Copy = {
      id,
      sid: leader.pid!,
      started: startTicks(leader.pid!) ?? 0,
      owner: process.env.CLAUDE_CODE_SESSION_ID ?? null,
      ports,
    };
    recordCopy(RUN_DIR, copy);
    return copy;
  });

  const { log } = copyPaths(RUN_DIR, copy.id);
  const url = `http://localhost:${copy.ports.client}/`;
  const up =
    (await waitFor(answers(`${url}api/levels/1`), 60)) &&
    (await waitFor(answers(`http://localhost:${copy.ports.chrome}/json/version`), 20));
  if (!up) {
    await stopCopy(RUN_DIR, copy.id);
    console.error(`Private copy ${copy.id} didn't come up (game or Chrome); stopped it. See ${log}`);
    process.exit(1);
  }
  console.log(`Private copy ${copy.id} is up.`);
  console.log(`  game:   ${url}`);
  console.log(`  api:    http://localhost:${copy.ports.api}/api`);
  console.log(`  chrome: --chrome ${copy.ports.chrome}  (for scripts/cdp.mjs)`);
  console.log(`  log:    ${log}`);
  console.log(`Stop it with: npm run serve:private -- stop ${copy.id}`);
}

/** Stop the chosen copies, carrying on past any that fail; exits non-zero if one did. */
async function stop(args: string[]) {
  const all = listCopies(RUN_DIR);
  let session = args[0] === '--session' ? args[1] : undefined;
  if (args[0] === '--from-hook') {
    session = (await readHookInput<{ session_id?: string }>()).session_id;
    if (!session) return; // no session named: stop nothing rather than everything
  }
  const ids =
    session !== undefined ? all.filter((c) => c.owner === session).map((c) => c.id) : args[0] ? [args[0]] : all.map((c) => c.id);
  let failed = false;
  for (const id of ids) {
    try {
      await stopCopy(RUN_DIR, id);
      console.log(`Stopped ${id}.`);
    } catch (e) {
      failed = true;
      console.error(`Couldn't stop ${id}: ${(e as Error).message}`);
    }
  }
  if (!ids.length) console.log('No private copies to stop.');
  if (failed) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [command, ...rest] = process.argv.slice(2);
  await (command === 'stop' ? stop(rest) : start());
}
