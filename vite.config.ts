import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';
import { sites } from './build/sites-vite-plugin';

const PLACEHOLDER_DATABASE_ID = '00000000-0000-4000-8000-000000000000';

export default defineConfig({
  plugins: [
    react(),
    sites({ mockAuth: true }),
    cloudflare({
      viteEnvironment: { name: 'worker' },
      inspectorPort: false,
      config: {
        name: 'server',
        main: './worker/index.ts',
        compatibility_date: '2026-05-22',
        compatibility_flags: ['nodejs_compat'],
        d1_databases: hostingConfig.d1
          ? [{ binding: hostingConfig.d1, database_name: 'tabiframe-projects', database_id: PLACEHOLDER_DATABASE_ID }]
          : [],
        assets: {
          not_found_handling: 'single-page-application',
          run_worker_first: ['/api/*'],
        },
      },
    }),
  ],
});
