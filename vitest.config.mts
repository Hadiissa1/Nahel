import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const stub = (name: string) => fileURLToPath(new URL(`./tests/setup/${name}.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // lib/ is server code written for Next: swap the Next-only modules for
    // small test doubles so it runs under plain Node.
    alias: {
      "server-only": stub("server-only"),
      "next/cache": stub("next-cache"),
      "next/headers": stub("next-headers"),
      "next/navigation": stub("next-navigation"),
      "next/server": stub("next-server"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // node:sqlite is native: one process per test file, so each file gets its
    // own database connection and DATA_DIR.
    pool: "forks",
    setupFiles: ["tests/setup/db.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**"],
      exclude: ["lib/data.ts", "lib/starter-articles.ts", "lib/translations.ts", "lib/admin-i18n.ts"],
    },
  },
});
