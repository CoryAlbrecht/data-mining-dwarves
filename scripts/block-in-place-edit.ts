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
import { readHookInput, simpleCommands } from './shell.ts';

const EDITORS = new Set(['sed', 'perl']);
/** Short options whose argument is the editor's script (sed and perl), not a file. */
const SCRIPT_SHORT = new Set(['-e', '-f']);
/** The same as long options, which may also carry it as `--expression=…`. */
const SCRIPT_LONG = ['--expression', '--file'];

/** The files a sed or perl command names: its arguments minus options and its script. */
function editedFiles(args: string[]): string[] {
  const files: string[] = [];
  let scriptGiven = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k]!;
    if (SCRIPT_SHORT.has(a) || SCRIPT_LONG.includes(a)) {
      scriptGiven = true;
      k++; // the script itself
    } else if (SCRIPT_LONG.some((o) => a.startsWith(`${o}=`))) scriptGiven = true;
    else if (/^-[a-zA-Z]/.test(a)) {
      // A short-option cluster. -e or -f in it takes the rest of the word (-es/a/b/, -pes/a/b/) or,
      // at its end, the next word (-pe 'code'). Everything after -i is its backup suffix (-iref).
      const letters = a.slice(1).match(/^[a-hj-zA-Z]*/)![0]; // the options before any -i
      const at = letters.search(/[ef]/);
      if (at >= 0) {
        scriptGiven = true;
        if (at + 2 === a.length) k++;
      }
    } else if (a.startsWith('-')) continue;
    else if (!scriptGiven) scriptGiven = true; // first bare word is the script
    else files.push(a);
  }
  return files;
}

/** True when `command`, run in `cwd`, would edit a file under `repo`/apps or `repo`/packages in place. */
export function blocksInPlaceEdit(command: string, cwd: string, repo: string): boolean {
  const roots = [resolve(repo, 'apps') + sep, resolve(repo, 'packages') + sep];
  for (const { words, dir } of simpleCommands(command, cwd)) {
    if (!EDITORS.has(words[0]!)) continue;
    const args = words.slice(1);
    const inPlace = args.some((a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a));
    if (!inPlace) continue;
    const files = editedFiles(args).map((a) => resolve(dir, a));
    if (files.some((f) => roots.some((r) => f.startsWith(r)))) return true;
  }
  return false;
}

async function main() {
  const input = await readHookInput<{ cwd?: string; tool_input?: { command?: string } }>();
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
