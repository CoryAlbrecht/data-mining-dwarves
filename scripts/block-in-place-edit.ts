/**
 * Claude Code PreToolUse hook (registered in .claude/settings.json) for Bash commands.
 *
 * `sed -i` / `perl -i` replace a file with a new one, and the running Vite dev server then keeps
 * serving the old contents until it restarts. Source under apps/ and packages/ is edited with the
 * Edit tool instead; this hook rejects in-place sed/perl edits there (exit 2 sends the reason back
 * to the agent).
 */
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const EDITORS = new Set(['sed', 'perl']);

/** True when `command`, run in `cwd`, would edit a file under `repo`/apps or `repo`/packages in place. */
export function blocksInPlaceEdit(command: string, cwd: string, repo: string): boolean {
  const roots = [resolve(repo, 'apps') + sep, resolve(repo, 'packages') + sep];
  // Quoted text (sed scripts, commit messages) is data, never a command or a path.
  const bare = command.replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, ' ');
  for (const segment of bare.split(/&&|\|\||[;|\n]/)) {
    const words = segment.trim().split(/\s+/).filter(Boolean);
    while (words[0] && /^\w+=/.test(words[0])) words.shift(); // VAR=value prefixes
    if (!EDITORS.has(words[0] ?? '')) continue;
    const args = words.slice(1);
    const inPlace = args.some((a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a));
    if (!inPlace) continue;
    const files = args.filter((a) => !a.startsWith('-')).map((a) => resolve(cwd, a));
    if (files.some((f) => roots.some((r) => f.startsWith(r)))) return true;
  }
  return false;
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw) as { cwd?: string; tool_input?: { command?: string } };
  const repo = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  if (blocksInPlaceEdit(input.tool_input?.command ?? '', input.cwd ?? repo, repo)) {
    process.stderr.write(
      'Blocked: sed -i / perl -i replace the file, and the running Vite dev server then serves stale code. ' +
        'Edit files under apps/ and packages/ with the Edit tool (or an in-place write).\n',
    );
    process.exit(2);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main();
