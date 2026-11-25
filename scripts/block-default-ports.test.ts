import { describe, expect, it } from 'vitest';
import { blocksDefaultPortStart } from './block-default-ports.ts';

const repo = '/home/dev/dmd';
const blocks = (cmd: string, cwd = repo) => blocksDefaultPortStart(cmd, cwd, repo);

describe("agents keep off the developer's dev ports", () => {
  it('blocks starting the app on the default ports', () => {
    for (const cmd of [
      'npm run dev',
      'cd apps/client && npm run dev',
      'npm run dev -w @dmd/client',
      'npm run dev -w @dmd/server &',
      'npm run preview',
      'npx vite',
      'vite --host',
      'cd apps/server && npx tsx watch src/index.ts',
      'nohup npm run dev > dev.log 2>&1 &',
      'CLIENT_PORT=5300 npm run dev', // the API would still take 8787
      'timeout 60 npm run dev',
      'timeout -k 5 60 npx vite',
      'setsid -f npm run dev',
      'bash -c "npm run dev"',
      'npx -y vite',
      'npm exec vite',
      'npm run start -w @dmd/server',
      'cd apps/server && npm start',
      'node --import tsx apps/server/src/index.ts',
      'yarn workspace @dmd/client dev',
      'pnpm --filter @dmd/server dev',
      '(cd apps/client && npm run dev)',
    ]) {
      expect(blocks(cmd), cmd).toBe(true);
    }
  });

  it("follows the shell's directory from earlier commands", () => {
    expect(blocks('npx tsx watch src/index.ts', `${repo}/apps/server`)).toBe(true);
    expect(blocks('npm start', `${repo}/apps/server`)).toBe(true);
  });

  it('lets moved starts, private copies and everything else through', () => {
    for (const cmd of [
      'npm run serve:private',
      'npm run serve:private -- stop copy-5200',
      'API_PORT=8899 CLIENT_PORT=5299 npm run dev',
      'export API_PORT=8899 CLIENT_PORT=5299; npm run dev',
      'env API_PORT=8899 CLIENT_PORT=5299 npm run dev',
      'CLIENT_PORT=5299 npm run dev -w @dmd/client',
      'API_PORT=8899 npm run dev -w @dmd/server',
      'timeout 60 env API_PORT=8899 CLIENT_PORT=5299 npm run dev',
      'npx vite --port 5299',
      'npx vite build',
      'npx vite --version',
      'npm run dev --help',
      'npm run preview -- --port 4299',
      'npm test',
      'npm run build',
      'npm run typecheck',
      'npm run mine-stats -- 1 12',
      'npx tsx scripts/formulas.ts',
      'npx tsx apps/server/src/levels.test.ts',
      'node --check apps/server/src/index.ts',
      '(cd apps/client) && npm test',
      'git commit -m "npm run dev on 5173"',
      'grep -n "npm run dev" README.md',
    ]) {
      expect(blocks(cmd), cmd).toBe(false);
    }
  });
});
