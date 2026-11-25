/**
 * A small shell-command reader for the Claude Code Bash hooks: enough of bash's quoting, escapes,
 * operators, subshells and redirections to tell which commands a line runs and with which words.
 */
import { resolve } from 'node:path';

/** Shell keywords that can stand before a command word. */
export const KEYWORDS = new Set(['{', '}', '!', 'if', 'then', 'elif', 'else', 'do', 'while', 'until', 'time']);

/** A simple command's words, or the start / end of a subshell. */
export type Piece = string[] | '(' | ')';

/**
 * Split a shell command into simple commands (at `;`, `&&`, `||`, `|`, `&` and newlines), each a
 * list of words with quotes and backslash escapes removed, and mark where subshells `( … )` open
 * and close. Operators inside quotes are plain text, and a `$( … )` stays inside its word (a cd in
 * it can't leak out, and the word around it isn't cut short).
 */
export function parseShell(command: string): Piece[] {
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

/** One command a line runs: its words after prefixes and wrappers, the variables set for it, and its directory. */
export interface SimpleCommand {
  words: string[];
  /** Variables given to this command: VAR=value prefixes, `env VAR=value`, or `export` earlier in the line. */
  env: Set<string>;
  /** Absolute directory it runs in: the starting directory, then every `cd` (scoped to its subshell). */
  dir: string;
}

/**
 * Commands that just run the command after them, with how many option words each takes an
 * argument for. `timeout` also takes a duration before the command.
 */
const WRAPPERS: Record<string, { valueOptions: string[] }> = {
  nohup: { valueOptions: [] },
  exec: { valueOptions: ['-a'] },
  command: { valueOptions: [] },
  setsid: { valueOptions: [] },
  env: { valueOptions: ['-u', '--unset', '-C', '--chdir', '-S'] },
  timeout: { valueOptions: ['-s', '--signal', '-k', '--kill-after'] },
  watch: { valueOptions: ['-n', '--interval', '-d', '--differences'] },
  npx: { valueOptions: ['-p', '--package', '-c', '--call'] },
};

/** Drop a wrapper's own options (and their values) from the front of `words`. */
function dropOptions(words: string[], valueOptions: string[]) {
  while (words[0]?.startsWith('-')) {
    const opt = words.shift()!;
    if (valueOptions.includes(opt)) words.shift();
  }
}

/**
 * Every simple command `line` runs when started in `cwd`, with wrappers (`timeout 60`, `env X=1`,
 * `npx -y`, `npm exec`, `nohup`, `setsid`, `watch`) and keywords peeled off, and the inside of
 * `bash -c "…"` / `sh -c "…"` read as commands too. `cd` and `export` are followed, not yielded.
 */
export function* simpleCommands(line: string, cwd: string): Generator<SimpleCommand> {
  const dirs = [cwd]; // the top is the current directory; a subshell's cd ends with the subshell
  const exported = new Set<string>();
  for (const piece of parseShell(line)) {
    if (piece === '(') dirs.push(dirs.at(-1)!);
    else if (piece === ')') {
      if (dirs.length > 1) dirs.pop();
    } else {
      const words = [...piece];
      const env = new Set(exported);
      for (;;) {
        const w = words[0];
        if (w === undefined) break;
        const assign = /^(\w+)=/.exec(w);
        if (assign) {
          env.add(assign[1]!);
          words.shift();
        } else if (KEYWORDS.has(w)) words.shift();
        else if (w === 'npm' && words[1] === 'exec') {
          words.splice(0, 2);
          dropOptions(words, WRAPPERS.npx!.valueOptions);
        } else if (WRAPPERS[w]) {
          words.shift();
          dropOptions(words, WRAPPERS[w].valueOptions);
          if (w === 'timeout') words.shift(); // its duration
        } else break;
      }
      const dir = dirs.at(-1)!;
      if (words[0] === 'cd') {
        if (words[1]) dirs[dirs.length - 1] = resolve(dir, words[1]);
      } else if (words[0] === 'export') {
        for (const w of words.slice(1)) exported.add(w.split('=')[0]!);
      } else if ((words[0] === 'bash' || words[0] === 'sh') && words[1] === '-c' && words[2] !== undefined) {
        for (const inner of simpleCommands(words[2], dir)) {
          for (const v of env) inner.env.add(v);
          yield inner;
        }
      } else if (words.length) yield { words, env, dir };
    }
  }
}

/** The JSON a Claude Code hook receives on stdin. */
export async function readHookInput<T>(): Promise<T> {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return JSON.parse(raw) as T;
}
