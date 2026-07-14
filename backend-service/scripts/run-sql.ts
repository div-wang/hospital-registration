import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

const file = process.argv[2];
if (!file) throw new Error("Usage: tsx scripts/run-sql.ts <sql-file>");
const sql = await readFile(resolve(file), "utf8");
const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  multipleStatements: true,
});
try { await connection.query(sql); console.log(`Executed ${file}`); } finally { await connection.end(); }
