import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env; load it ourselves (Node 24 built-in).
try {
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // .env is optional in environments where DATABASE_URL is already set.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Used by migrate/introspection. Points at prisma/dev.db from the project root.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
