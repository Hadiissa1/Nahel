import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const ADMIN_PASSWORD = "e2e-admin-password";

export default defineConfig({
  testDir: "e2e",
  // Tests share one server and one database: run them one after the other.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // A forgotten test.only must not silently skip the rest in CI.
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node e2e/server.mjs",
    url: `http://localhost:${PORT}`,
    // Always a fresh build and a fresh database.
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      PORT: String(PORT),
      DATA_DIR: path.join(os.tmpdir(), "nahel-e2e"),
      ADMIN_PASSWORD,
      // No real emails from the browser tests.
      BREVO_API_KEY: "",
      MAIL_DRIVER: "",
    },
  },
});
