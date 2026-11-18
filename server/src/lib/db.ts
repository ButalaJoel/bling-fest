import "dotenv/config";
import pg from "pg";

// One shared connection pool. Every query in the app goes through query()/tx() with
// $1, $2… placeholders — user input is never concatenated into SQL.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing from server/.env.");

export const pool = new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

/** Run several statements atomically. */
export async function tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
