import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_DATABASE: z.string().min(1),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string(),
  MYSQL_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DATA_ENCRYPTION_KEY: z.string().min(1),
  DEV_SMS_CODE: z.string().length(6).default("123456"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables", z.treeifyError(parsed.error));
  process.exit(1);
}

const encryptionKey = Buffer.from(parsed.data.DATA_ENCRYPTION_KEY, "base64");
if (encryptionKey.length !== 32) {
  throw new Error("DATA_ENCRYPTION_KEY must decode to exactly 32 bytes");
}

export const env = {
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean),
  encryptionKey,
};
