import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  outputDir: '/tmp/brain-rush-design-tests',
  use: {
    baseURL: 'http://localhost:5173',
    launchOptions: { executablePath: process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : undefined), args: ['--no-sandbox'] },
  },
});
