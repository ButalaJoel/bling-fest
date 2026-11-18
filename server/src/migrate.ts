import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./lib/db.js";

// Applies migrations/*.sql in order, once each, inside a transaction.
// An advisory lock stops two deploys from migrating at the same time.
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

const client = await pool.connect();
try {
  await client.query("select pg_advisory_lock(727274)");
  await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await client.query<{ name: string }>("select name from schema_migrations")).rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f)).sort();
  for (const f of files) {
    if (done.has(f)) continue;
    const sql = await readFile(path.join(dir, f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (name) values ($1)", [f]);
      await client.query("commit");
      console.log(`applied ${f}`);
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  console.log("migrations up to date");
} finally {
  await client.query("select pg_advisory_unlock(727274)").catch(() => {});
  client.release();
  await pool.end();
}
