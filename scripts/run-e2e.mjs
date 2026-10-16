import { spawn, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;
const toolEnv = { ...process.env, XDG_CONFIG_HOME: `${process.cwd()}\\.wrangler\\xdg-config` };

const migration = readdirSync('drizzle').find((name) => name.endsWith('.sql'));
if (!migration) throw new Error('No D1 migration found in drizzle/.');
const migrationResult = spawnSync(
  process.execPath,
  ['./node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', '--local', '--config', 'dist/worker/wrangler.json', '--persist-to', `${process.cwd()}\\.wrangler\\state`, '--file', `drizzle/${migration}`],
  { cwd: process.cwd(), encoding: 'utf8', env: toolEnv },
);
const migrationOutput = `${migrationResult.stdout ?? ''}\n${migrationResult.stderr ?? ''}`;
if (migrationResult.status !== 0 && !migrationOutput.includes('already exists')) {
  throw new Error(`Unable to prepare the local D1 database:\n${migrationOutput}`);
}

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: process.cwd(), stdio: 'inherit', env: toolEnv },
);

let shuttingDown = false;

async function stopServer() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
}

process.once('SIGINT', () => {
  void stopServer().finally(() => { process.exitCode = 130; });
});

process.once('SIGTERM', () => {
  void stopServer().finally(() => { process.exitCode = 143; });
});

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error('Vite dev server exited before it became ready.');
    }
    try {
      const response = await fetch(baseUrl + '/', {
        signal: AbortSignal.timeout(750),
      });
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('Timed out waiting for Vite dev server on port 4173.');
}

try {
  await waitForServer();
  const runner = spawn(
    process.execPath,
    ['./node_modules/@playwright/test/cli.js', 'test'],
    { cwd: process.cwd(), stdio: 'inherit', env: { ...process.env, TABIFRAME_E2E_BASE_URL: baseUrl } },
  );
  const exitCode = await new Promise((resolve) => {
    runner.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  await stopServer();
  process.exitCode = exitCode;
} catch (error) {
  console.error(error);
  await stopServer();
  process.exitCode = 1;
}
