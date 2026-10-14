import { spawn } from 'node:child_process';

const server = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1'],
  { cwd: process.cwd(), stdio: 'inherit' },
);

let shuttingDown = false;

function stopServer() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.kill('SIGTERM');
}

process.once('SIGINT', () => {
  stopServer();
  process.exit(130);
});

process.once('SIGTERM', () => {
  stopServer();
  process.exit(143);
});

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error('Vite preview exited before it became ready.');
    }
    try {
      const response = await fetch('http://127.0.0.1:4173/', {
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
    { cwd: process.cwd(), stdio: 'inherit' },
  );
  const exitCode = await new Promise((resolve) => {
    runner.once('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
  stopServer();
  process.exit(exitCode);
} catch (error) {
  console.error(error);
  stopServer();
  process.exit(1);
}
