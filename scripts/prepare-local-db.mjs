import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const migrations = readdirSync('drizzle').filter((name) => name.endsWith('.sql')).sort();
if (!migrations.length) throw new Error('No D1 migrations found in drizzle/.');

const toolEnv = { ...process.env, XDG_CONFIG_HOME: `${process.cwd()}\\.wrangler\\xdg-config` };
for (const migration of migrations) {
  const result = spawnSync(
    process.execPath,
    ['./node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'DB', '--local', '--config', 'dist/worker/wrangler.json', '--persist-to', `${process.cwd()}\\.wrangler\\state`, '--file', `drizzle/${migration}`],
    { cwd: process.cwd(), encoding: 'utf8', env: toolEnv },
  );
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.status !== 0 && !output.includes('already exists')) throw new Error(output);
}

console.log(`Local D1 ready (${migrations.length} migration${migrations.length === 1 ? '' : 's'} checked).`);
