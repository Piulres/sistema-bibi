import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      SESSION_SECRET: "test-session-secret-32-chars-min",
      CRON_SECRET: "test-cron-secret",
      PAYMENT_GATEWAY: "mock",
      COMMUNICATION_PROVIDER: "console",
      ASSISTANT_ENABLED: "true",
      ASSISTANT_PROVIDER: "mock",
    },
  },
});
