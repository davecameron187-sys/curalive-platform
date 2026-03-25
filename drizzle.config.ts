import { defineConfig } from "drizzle-kit";

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url && (url.startsWith("postgresql://") || url.startsWith("postgres://"))) return url;
  const { PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || "5432"}/${PGDATABASE}`;
  }
  throw new Error("DATABASE_URL or PG* environment variables are required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getConnectionString(),
  },
});
