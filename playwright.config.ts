import { defineConfig } from "@playwright/test";

/**
 * Tests de bout en bout : l'extension construite (.output/chrome-mv3) est
 * chargée dans Chromium, et le panneau est ouvert comme une page (voir
 * e2e/fixtures.ts). Playwright ne sait pas charger une extension dans
 * Firefox : Firefox et Zen passent par docs/recette-manuelle.md.
 *
 * `npm run test:e2e` construit l'extension avant de lancer les tests.
 */
export default defineConfig({
  testDir: "./e2e",
  // Chaque test ouvre son propre Chromium avec l'extension : on les passe l'un après l'autre.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "line" : "list",
  timeout: 30_000,
  use: {
    trace: "on-first-retry",
  },
});
