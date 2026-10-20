import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The fallback keeps `prisma generate` working on a fresh checkout and on
    // CI, where .env.local is absent but no database connection is needed.
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
