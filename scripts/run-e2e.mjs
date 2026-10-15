import { spawn } from 'node:child_process';

const port = 4173;
const baseUrl = `http://127.0.0.1:${port}`;

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: process.cwd(), stdio: 'inherit' },
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
      throw new Error('Vite preview exited before it became ready.');
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
  throw new Error('Timed out waiting for Vite preview on port 4173.');
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
