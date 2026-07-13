import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabase, pool } from "./db/pool.js";

await checkDatabase();
const server = app.listen(env.PORT, () => console.log(`Hospital registration API listening on http://localhost:${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
