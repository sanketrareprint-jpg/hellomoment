import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

// Reuse a single pool across hot reloads / serverless invocations.
const isLocalDb = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL ?? "");

export const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
