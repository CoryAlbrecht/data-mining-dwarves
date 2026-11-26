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
 * and close. Operators inside quotes are plain text, and a `$( … )` or backtick substitution stays
 * inside its word, so the word around it isn't cut short. Each substitution outside single quotes
 * is also read as a subshell placed just before the command it is part of: its commands are seen,
 * and a cd in it can't leak out.
 */
/** A heredoc waiting for its body: the line that ends it, and whether `<<-` strips leading tabs. */
interface Heredoc {
  delimiter: string;
  strip: boolean;
}

export function parseShell(command: string): Piece[] {
  const pieces: Piece[] = [[]];
  let word: string | null = null;
  /** The next word is a redirection target (`> file`), never a command word or a file to edit. */
  let redirect = false;
  /** The next redirection target is a heredoc's delimiter (`<<WORD`); `strip` for `<<-`. */
  let heredocNext: { strip: boolean } | null = null;
  /** Heredocs whose bodies start after the current line ends. */
  const heredocs: Heredoc[] = [];
  const add = (text: string) => (word = (word ?? '') + text);
  const current = () => {
    const last = pieces.at(-1);
    if (Array.isArray(last)) return last;
    const fresh: string[] = [];
    pieces.push(fresh);
    return fresh;
  };
  /** Read `inner`, a substitution's command, as a subshell placed before the command now being read. */
  const substitute = (inner: string) => {
    current();
    pieces.splice(pieces.length - 1, 0, '(', ...parseShell(inner), ')');
  };
  const startsSubstitution = (i: number) => command[i] === '`' || (command[i] === '$' && command[i + 1] === '(');
  /** Read the `$( … )` or backtick substitution starting at `i`, and substitute() its command: returns its raw text and where it ends. */
  const readSubstitution = (i: number) => {
    const start = i;
    let inner = '';
    if (command[i] === '`') {
      for (i++; i < command.length && command[i] !== '`'; i++) {
        inner += command[i] === '\\' && /[`\\$]/.test(command[i + 1] ?? '') ? command[++i] : command[i];
      }
    } else {
      let depth = 0;
      /** Heredocs opened on the substitution's current line, whose bodies (data, brackets and all) start at its end. */
      const opened: Heredoc[] = [];
      for (; i < command.length; i++) {
        const q = command[i];
        const heredoc = q === '<' && command[i - 1] !== '<' ? /^<<(-?)[ \t]*(?:'([^']*)'|"([^"]*)"|\\?([^\s;&|()<>]+))/.exec(command.slice(i)) : null;
        if (q === "'" || q === '"') {
          // A quoted span inside the substitution: its brackets don't count.
          for (i++; i < command.length && command[i] !== q; i++) if (q === '"' && command[i] === '\\') i++;
        } else if (heredoc) {
          opened.push({ delimiter: heredoc[2] ?? heredoc[3] ?? heredoc[4]!, strip: heredoc[1] === '-' });
          i += heredoc[0].length - 1;
        } else if (q === '\n' && opened.length) i = skipHeredocs(i, opened.splice(0));
        else if (q === '(') depth++;
        else if (q === ')' && --depth === 0) break;
      }
      inner = command.slice(start + 2, i);
    }
    substitute(inner);
    return { raw: command.slice(start, i + 1), end: i };
  };
  const endWord = () => {
    if (word !== null && !redirect) current().push(word);
    if (word !== null && redirect && heredocNext) {
      heredocs.push({ delimiter: word, ...heredocNext });
      heredocNext = null;
    }
    if (word !== null) redirect = false;
    word = null;
  };
  /** Skip the bodies of `opened`, the heredocs opened on the line that ends at `i` (a newline); returns where the next line starts. */
  const skipHeredocs = (i: number, opened: Heredoc[]) => {
    for (const { delimiter, strip } of opened) {
      for (;;) {
        const end = command.indexOf('\n', i + 1);
        const line = command.slice(i + 1, end === -1 ? command.length : end);
        i = end === -1 ? command.length : end;
        if ((strip ? line.replace(/^\t+/, '') : line) === delimiter || end === -1) break;
      }
    }
    return i;
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
        if (startsSubstitution(i)) {
          const { raw, end } = readSubstitution(i);
          text += raw;
          i = end;
        } else text += command[i] === '\\' && i + 1 < command.length ? command[++i] : command[i];
      }
      add(text);
    } else if (startsSubstitution(i)) {
      const { raw, end } = readSubstitution(i);
      add(raw);
      i = end;
    } else if (/\s/.test(c) && c !== '\n') endWord();
    else if (c === '<' || c === '>' || (c === '&' && command[i + 1] === '>')) {
      if (word !== null && /^\d+$/.test(word)) word = null; // a file descriptor, as in 2>
      endWord();
      let op = command.slice(i).match(/^(&?[<>]+&?)/)![1]!;
      if (op === '<<' && command[i + 2] === '-') op = '<<-'; // a '-' after any other operator closes a descriptor (>&-)
      if (op === '<<' || op === '<<-') heredocNext = { strip: op === '<<-' };
      i += op.length - 1; // >>, >&, &>, &>>, <<, <<-, <<<
      redirect = true;
    } else if (c === '(' || c === ')') {
      endWord();
      pieces.push(c, []);
    } else if (';|&\n'.includes(c)) {
      endWord();
      if ((c === '&' || c === '|') && command[i + 1] === c) i++; // && and ||
      if (c === '\n' && heredocs.length) i = skipHeredocs(i, heredocs.splice(0)); // their bodies are data, not commands
      redirect = false; // a redirection with no target (as in >&-) ends here
      heredocNext = null;
      pieces.push([]);
    } else add(c);
  }
  endWord();
  return pieces.filter((p) => !Array.isArray(p) || p.length);
}

/** One command a line runs: its words after prefixes and wrappers, the variables set for it, and its directory. */
export interface SimpleCommand {
  words: string[];
  /** Variables given to this command, with their values: VAR=value prefixes, `env VAR=value`, or `export` earlier in the line. */
  env: Map<string, string>;
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

/** concurrently's options that take a value; its other arguments are commands to run. */
const CONCURRENTLY_VALUE_OPTIONS = [
  '-n', '--names', '-c', '--prefix-colors', '-p', '--prefix', '-l', '--prefix-length', '-t', '--timestamp-format',
  '-m', '--max-processes', '-s', '--success', '--restart-tries', '--restart-after', '--kill-signal', '--name-separator',
];

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
 * `bash -c "…"`, `sh -c "…"` and concurrently's command strings read as commands too. `cd` and `export` are followed, not yielded.
 */
export function* simpleCommands(line: string, cwd: string): Generator<SimpleCommand> {
  const dirs = [cwd]; // the top is the current directory; a subshell's cd ends with the subshell
  const exported = new Map<string, string>();
  for (const piece of parseShell(line)) {
    if (piece === '(') dirs.push(dirs.at(-1)!);
    else if (piece === ')') {
      if (dirs.length > 1) dirs.pop();
    } else {
      const words = [...piece];
      const env = new Map(exported);
      for (;;) {
        const w = words[0];
        if (w === undefined) break;
        const assign = /^(\w+)=(.*)$/s.exec(w);
        if (assign) {
          env.set(assign[1]!, assign[2]!);
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
        for (const w of words.slice(1)) {
          const [name, ...value] = w.split('=');
          exported.set(name!, value.length ? value.join('=') : (exported.get(name!) ?? ''));
        }
      } else if ((words[0] === 'bash' || words[0] === 'sh') && words[1] === '-c' && words[2] !== undefined) {
        yield* innerCommands(words[2], dir, env);
      } else if (words[0] === 'concurrently') {
        const args = words.slice(1);
        for (let k = 0; k < args.length; k++) {
          if (CONCURRENTLY_VALUE_OPTIONS.includes(args[k]!)) k++;
          else if (!args[k]!.startsWith('-')) yield* innerCommands(args[k]!, dir, env);
        }
      } else if (words.length) yield { words, env, dir };
    }
  }
}

/** The commands inside a command string (`bash -c "…"`, concurrently's arguments), inheriting `env`. */
function* innerCommands(line: string, dir: string, env: Map<string, string>): Generator<SimpleCommand> {
  for (const command of simpleCommands(line, dir)) {
    for (const [name, value] of env) if (!command.env.has(name)) command.env.set(name, value);
    yield command;
  }
}

/** The JSON a Claude Code hook receives on stdin. */
export async function readHookInput<T>(): Promise<T> {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return JSON.parse(raw) as T;
}
