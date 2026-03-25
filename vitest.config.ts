import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: [
      // More-specific aliases MUST come before the generic "@" catch-all
      { find: "@/server", replacement: path.resolve(templateRoot, "server") },
      { find: "@/drizzle", replacement: path.resolve(templateRoot, "drizzle") },
      { find: "@/client", replacement: path.resolve(templateRoot, "client", "src") },
      { find: "@shared", replacement: path.resolve(templateRoot, "shared") },
      { find: "@assets", replacement: path.resolve(templateRoot, "attached_assets") },
      // Generic @ maps to client/src (frontend components)
      { find: "@", replacement: path.resolve(templateRoot, "client", "src") },
    ],
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      // Ensure DEV_BYPASS is disabled in tests so protectedProcedure throws for unauthenticated callers
      NODE_ENV: "test",
    },
  },
});
