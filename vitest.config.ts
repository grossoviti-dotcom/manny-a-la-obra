import { defineConfig } from "vitest/config";
import path from "node:path";
import { config } from "dotenv";

// Las pruebas corren contra una rama aislada de Neon (TEST_DATABASE_URL o .env.test), nunca producción.
config({ path: ".env.test" });

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: process.env.TEST_DATABASE_URL ? { DATABASE_URL: process.env.TEST_DATABASE_URL } : {},
  },
});
