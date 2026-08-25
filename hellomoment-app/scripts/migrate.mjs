// One-off migration runner: applies db/schema.sql against DATABASE_URL.
// Usage:  DATABASE_URL="postgres://..." node scripts/migrate.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Example:");
  console.error('  DATABASE_URL="postgres://..." node scripts/migrate.mjs');
  process.exit(1);
}

const sql = readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");

const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
