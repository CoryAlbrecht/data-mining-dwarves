/**
 * Claude Code PreToolUse hook (registered in .claude/settings.json) for Bash commands.
 *
 * Agents start the game only as a private copy (`npm run serve:private`), so they never take the
 * developer's 5173 / 8787 (or Vite preview's 4173). This hook rejects agent commands that would
 * start the client, the API or a preview on a default port (exit 2 sends the reason back).
 */
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readHookInput, simpleCommands } from './shell.ts';

/** Which workspace a command targets. */
type App = 'client' | 'server' | 'root';

/** Which servers a command starts. */
interface Servers {
  client?: boolean;
  api?: boolean;
  preview?: boolean;
}

/** The workspace a name (`@dmd/client`, `apps/server`, …) or directory points at. */
const appOf = (name: string | undefined): App | undefined =>
  name?.includes('client') ? 'client' : name?.includes('server') ? 'server' : undefined;

/** What a package-manager script starts in a workspace: the client's and server's dev/start/preview. */
function scriptServers(script: string | undefined, app: App): Servers {
  if (script === 'preview') return { preview: app !== 'server' };
  if (script === 'dev') return { client: app !== 'server', api: app !== 'client' };
  if (script === 'start') return { api: app === 'server' }; // only the server has a start script
  return {};
}

/** What one command starts, given its words and the workspace it runs in. */
function serversStarted(words: string[], here: App, isServerEntry: (arg: string) => boolean): Servers {
  const [cmd, ...args] = words;
  if (cmd === 'npm' || cmd === 'pnpm' || cmd === 'yarn') {
    const valueOf = (...flags: string[]) =>
      args.find((_, k) => flags.includes(args[k - 1]!)) ?? args.find((a) => flags.some((f) => a.startsWith(`${f}=`)))?.split('=')[1];
    let workspace = valueOf('-w', '--workspace', '--prefix', '--filter', '-F', '-C', '--dir');
    let rest = args.filter((a, k) => !a.startsWith('-') && !['-w', '--workspace', '--prefix', '--filter', '-F', '-C', '--dir'].includes(args[k - 1]!));
    if (cmd === 'yarn' && rest[0] === 'workspace') {
      workspace = rest[1];
      rest = rest.slice(2);
    }
    if (rest[0] === 'run' || rest[0] === 'run-script') rest = rest.slice(1);
    return scriptServers(rest[0], appOf(workspace) ?? here);
  }
  if (cmd === 'vite' || cmd?.endsWith('/vite')) {
    const sub = args.find((a) => !a.startsWith('-'));
    if (sub === 'build' || sub === 'optimize') return {};
    return sub === 'preview' ? { preview: true } : { client: true };
  }
  if (cmd === 'tsx' || cmd === 'node' || cmd?.endsWith('/tsx')) {
    const valueOptions = ['--import', '--require', '-r', '--loader'];
    const entry = args.find((a, k) => !a.startsWith('-') && a !== 'watch' && !valueOptions.includes(args[k - 1]!));
    return entry && isServerEntry(entry) ? { api: true } : {};
  }
  return {};
}

/** True when `command`, run in `cwd` inside `repo`, would start the game on a default port. */
export function blocksDefaultPortStart(command: string, cwd: string, repo: string): boolean {
  for (const { words, env, dir } of simpleCommands(command, cwd)) {
    if (words.some((w) => ['--help', '-h', '--version', '-v', '--check', '-c'].includes(w))) continue;
    const here = appOf(relative(repo, dir).split('/').slice(0, 2).join('/')) ?? 'root';
    const serverEntry = resolve(repo, 'apps/server/src/index.ts');
    const servers = serversStarted(words, here, (arg) => resolve(dir, arg) === serverEntry);
    const portFlag = words.some((w) => w === '--port' || w.startsWith('--port='));
    if (servers.preview && !portFlag) return true;
    if (servers.client && !env.has('CLIENT_PORT') && !portFlag) return true;
    if (servers.api && !env.has('API_PORT') && !env.has('PORT')) return true;
  }
  return false;
}

async function main() {
  const input = await readHookInput<{ cwd?: string; tool_input?: { command?: string } }>();
  const repo = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  if (blocksDefaultPortStart(input.tool_input?.command ?? '', input.cwd ?? repo, repo)) {
    process.stderr.write(
      "Blocked: this would start the game on a default port (5173 / 8787 / 4173), the developer's own. " +
        'Start a private copy with `npm run serve:private` (see the verify-in-browser skill), and stop it ' +
        'with `npm run serve:private -- stop <id>` when done.\n',
    );
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
