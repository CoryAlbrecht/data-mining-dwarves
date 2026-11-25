import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listCopies, pickPorts, RANGES, recordCopy, startTicks, stopCopy } from './serve-private.ts';

const inRange = (p: number, [lo, hi]: readonly [number, number]) => p >= lo && p <= hi;

describe('a private copy picks its ports', () => {
  it('takes free ports from its ranges, never the developer defaults', async () => {
    const busy = new Set([5200, 5201, 8800]);
    const ports = await pickPorts(async (p) => !busy.has(p), new Set());
    expect(ports).toEqual({ client: 5202, api: 8801, chrome: 9300 });
    expect(inRange(ports.client, RANGES.client) && inRange(ports.api, RANGES.api) && inRange(ports.chrome, RANGES.chrome)).toBe(true);
    expect([ports.client, ports.api, ports.chrome]).not.toContain(5173);
    expect([ports.client, ports.api, ports.chrome]).not.toContain(8787);
  });

  it('gives a second copy different ports from the first', async () => {
    const free = async () => true;
    const first = await pickPorts(free, new Set());
    const second = await pickPorts(free, new Set(Object.values(first)));
    expect(second.client).not.toBe(first.client);
    expect(second.api).not.toBe(first.api);
    expect(second.chrome).not.toBe(first.chrome);
  });
});

describe('stopping a private copy', () => {
  /** Processes still alive in a session. */
  const alive = (sid: number) => spawnSync('pgrep', ['-s', String(sid)], { encoding: 'utf8' }).stdout.trim();

  it('leaves nothing of it running, even a child that ignores the polite stop and holds no port', async () => {
    const runDir = mkdtempSync(join(tmpdir(), 'serve-private-'));
    // A stand-in copy: a leader with a child that shrugs off SIGTERM, like tsx watch.
    const leader = spawn(
      'node',
      ['-e', `require('child_process').spawn('node', ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)'], { stdio: 'ignore' }); setInterval(() => {}, 1000);`],
      { detached: true, stdio: 'ignore' },
    );
    const sid = leader.pid!;
    await new Promise((r) => setTimeout(r, 500));
    expect(alive(sid).split('\n').length).toBe(2);

    recordCopy(runDir, { id: 'copy-test', sid, started: startTicks(sid)!, owner: null, ports: { client: 5299, api: 8899, chrome: 9399 } });
    await stopCopy(runDir, 'copy-test');

    expect(alive(sid)).toBe('');
    expect(existsSync(join(runDir, 'copy-test.json'))).toBe(false);
  }, 15_000);

  it('never signals a stale run file whose session number now belongs to another process', async () => {
    const runDir = mkdtempSync(join(tmpdir(), 'serve-private-'));
    const stranger = spawn('node', ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    const sid = stranger.pid!;
    await new Promise((r) => setTimeout(r, 300));
    // Recorded long ago by a copy that has since died; the number was reused by the stranger.
    recordCopy(runDir, { id: 'copy-stale', sid, started: startTicks(sid)! - 1, owner: null, ports: { client: 5298, api: 8898, chrome: 9398 } });
    await stopCopy(runDir, 'copy-stale');
    expect(alive(sid)).not.toBe('');
    expect(existsSync(join(runDir, 'copy-stale.json'))).toBe(false);
    process.kill(-sid, 'SIGKILL');
  });

  it('skips a half-written run file instead of failing', () => {
    const runDir = mkdtempSync(join(tmpdir(), 'serve-private-'));
    writeFileSync(join(runDir, 'copy-broken.json'), '{"id": "copy-bro');
    expect(listCopies(runDir)).toEqual([]);
  });
});
