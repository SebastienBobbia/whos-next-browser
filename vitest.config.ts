import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing/vitest-plugin";

/**
 * WxtVitest remplace l'API du navigateur par un faux en mémoire (stockage
 * compris). Le plugin Svelte compile les runes des fichiers .svelte.ts.
 */
export default defineConfig({
  plugins: [WxtVitest(), svelte()],
  test: {
    include: ["src/**/*.test.ts"],
  },
});
