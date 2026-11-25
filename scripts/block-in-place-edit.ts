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
/** Short options whose argument is the editor's script (sed and perl), not a file. */
const SCRIPT_SHORT = new Set(['-e', '-f']);
/** The same as long options, which may also carry it as `--expression=…`. */
const SCRIPT_LONG = ['--expression', '--file'];

/** Shell keywords that can stand before a command word. */
const KEYWORDS = new Set(['{', '}', '!', 'if', 'then', 'elif', 'else', 'do', 'while', 'until', 'time']);

/** A simple command's words, or the start / end of a subshell. */
type Piece = string[] | '(' | ')';

/**
 * Split a shell command into simple commands (at `;`, `&&`, `||`, `|`, `&` and newlines), each a
 * list of words with quotes and backslash escapes removed, and mark where subshells `( … )` open
 * and close. Operators inside quotes are plain text, and a `$( … )` stays inside its word (a cd in
 * it can't leak out, and the word around it isn't cut short).
 */
function parse(command: string): Piece[] {
  const pieces: Piece[] = [[]];
  let word: string | null = null;
  /** The next word is a redirection target (`> file`), never a command word or a file to edit. */
  let redirect = false;
  const add = (text: string) => (word = (word ?? '') + text);
  const current = () => {
    const last = pieces.at(-1);
    if (Array.isArray(last)) return last;
    const fresh: string[] = [];
    pieces.push(fresh);
    return fresh;
  };
  const endWord = () => {
    if (word !== null && !redirect) current().push(word);
    if (word !== null) redirect = false;
    word = null;
  };
  for (let i = 0; i < command.length; i++) {
    const c = command[i]!;
    if (c === '\\' && command[i + 1] === '\n') i++; // line continuation
    else if (c === '\\') add(command[++i] ?? ''); // escaped character, taken literally
    else if (c === "'") {
      const close = command.indexOf("'", i + 1);
      const end = close === -1 ? command.length : close;
      add(command.slice(i + 1, end)); // single quotes: no escapes inside
      i = end;
    } else if (c === '"') {
      let text = '';
      for (i++; i < command.length && command[i] !== '"'; i++) {
        text += command[i] === '\\' && i + 1 < command.length ? command[++i] : command[i];
      }
      add(text);
    } else if (c === '$' && command[i + 1] === '(') {
      let depth = 0;
      const start = i;
      for (; i < command.length; i++) {
        const q = command[i];
        if (q === "'" || q === '"') {
          // A quoted span inside the substitution: its brackets don't count.
          for (i++; i < command.length && command[i] !== q; i++) if (q === '"' && command[i] === '\\') i++;
        } else if (q === '(') depth++;
        else if (q === ')' && --depth === 0) break;
      }
      add(command.slice(start, i + 1));
    } else if (/\s/.test(c) && c !== '\n') endWord();
    else if (c === '<' || c === '>' || (c === '&' && command[i + 1] === '>')) {
      if (word !== null && /^\d+$/.test(word)) word = null; // a file descriptor, as in 2>
      endWord();
      while ('<>&'.includes(command[i + 1] ?? ' ')) i++; // >>, >&, &>, &>>
      redirect = true;
    } else if (c === '(' || c === ')') {
      endWord();
      pieces.push(c, []);
    } else if (';|&\n'.includes(c)) {
      endWord();
      if ((c === '&' || c === '|') && command[i + 1] === c) i++; // && and ||
      pieces.push([]);
    } else add(c);
  }
  endWord();
  return pieces.filter((p) => !Array.isArray(p) || p.length);
}

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
  const dirs = [cwd]; // the top is the current directory; a subshell's cd ends with the subshell
  for (const piece of parse(command)) {
    if (piece === '(') dirs.push(dirs.at(-1)!);
    else if (piece === ')') {
      if (dirs.length > 1) dirs.pop();
    } else {
      const words = [...piece];
      // VAR=value prefixes and shell keywords that can come before a command
      while (words[0] && (/^\w+=/.test(words[0]) || KEYWORDS.has(words[0]))) words.shift();
      const dir = dirs.at(-1)!;
      if (words[0] === 'cd' && words[1]) dirs[dirs.length - 1] = resolve(dir, words[1]);
      if (!EDITORS.has(words[0] ?? '')) continue;
      const args = words.slice(1);
      const inPlace = args.some((a) => a === '--in-place' || a.startsWith('--in-place=') || /^-[a-zA-Z]*i/.test(a));
      if (!inPlace) continue;
      const files = editedFiles(args).map((a) => resolve(dir, a));
      if (files.some((f) => roots.some((r) => f.startsWith(r)))) return true;
    }
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
