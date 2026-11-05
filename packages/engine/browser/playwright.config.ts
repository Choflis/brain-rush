import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

export default defineConfig({
  testDir: ".", testMatch: "*.spec.ts", timeout: 90_000, workers: 1,
  reporter: "list", outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "../test-results",
  use: { launchOptions: { executablePath: process.env.CHROME_PATH }, baseURL: "http://127.0.0.1:5174", viewport: { width: 1366, height: 900 }, trace: "retain-on-failure" },
  webServer: { command: "npm run dev:tiendita -w apps/web", cwd: fileURLToPath(new URL("../../../", import.meta.url)), url: "http://127.0.0.1:5174/tiendita.html", reuseExistingServer: true, timeout: 30_000 },
});
