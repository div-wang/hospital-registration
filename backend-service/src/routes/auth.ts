import { createHash, randomInt } from "node:crypto";
import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { signAccessToken, type UserRole } from "../services/auth.js";

const router = Router();
const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确");
const hashCode = (phone: string, code: string) => createHash("sha256").update(`${phone}:${code}:${env.JWT_SECRET}`).digest("hex");

router.post("/send-sms", asyncHandler(async (req, res) => {
  const input = z.object({ phone: phoneSchema, scene: z.enum(["login", "bind_phone"]).default("login") }).parse(req.body);
  const [recent] = await pool.query<RowDataPacket[]>(
    "SELECT created_at FROM sms_verification_codes WHERE phone=? AND scene=? ORDER BY id DESC LIMIT 1",
    [input.phone, input.scene],
  );
  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < env.SMS_RESEND_INTERVAL_SECONDS * 1000) {
    throw new AppError(429, "SMS_TOO_FREQUENT", `请${env.SMS_RESEND_INTERVAL_SECONDS}秒后再获取验证码`);
  }
  const [daily] = await pool.query<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) total FROM sms_verification_codes WHERE phone=? AND created_at>=CURRENT_DATE",
    [input.phone],
  );
  if ((daily[0]?.total ?? 0) >= env.SMS_DAILY_LIMIT) throw new AppError(429, "SMS_DAILY_LIMIT", "今日验证码发送次数已达上限");

  if (env.NODE_ENV === "production") throw new AppError(503, "SMS_PROVIDER_NOT_CONFIGURED", "生产短信服务尚未配置");
  const code = env.DEV_SMS_CODE || String(randomInt(100000, 1000000));
  await pool.execute(
    `INSERT INTO sms_verification_codes (phone, scene, code_hash, expires_at, request_ip)
     VALUES (?, ?, ?, DATE_ADD(NOW(3), INTERVAL ? SECOND), ?)`,
    [input.phone, input.scene, hashCode(input.phone, code), env.SMS_CODE_TTL_SECONDS, req.ip ?? null],
  );
  res.json({ success: true, data: { expiresIn: env.SMS_CODE_TTL_SECONDS, debugCode: code } });
}));

router.post("/mobile-login", asyncHandler(async (req, res) => {
  const input = z.object({ phone: phoneSchema, verificationCode: z.string().length(6) }).parse(req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [codes] = await connection.query<RowDataPacket[]>(
      `SELECT id, code_hash codeHash FROM sms_verification_codes
       WHERE phone=? AND scene='login' AND used_at IS NULL AND expires_at>NOW(3)
       ORDER BY id DESC LIMIT 1 FOR UPDATE`, [input.phone],
    );
    const code = codes[0];
    if (!code || code.codeHash !== hashCode(input.phone, input.verificationCode)) {
      throw new AppError(401, "INVALID_SMS_CODE", "短信验证码错误或已过期");
    }
    await connection.execute("UPDATE sms_verification_codes SET used_at=NOW(3) WHERE id=?", [code.id]);

    const [rows] = await connection.query<(RowDataPacket & { id: number; phone: string; role: UserRole; status: number })[]>(
      "SELECT id, phone, role, status FROM users WHERE phone=? FOR UPDATE", [input.phone],
    );
    let user = rows[0];
    let isNewUser = false;
    if (!user) {
      const [result] = await connection.execute<ResultSetHeader>("INSERT INTO users (phone, last_login_at) VALUES (?, NOW(3))", [input.phone]);
      user = { id: result.insertId, phone: input.phone, role: "user", status: 1 } as RowDataPacket & { id: number; phone: string; role: UserRole; status: number };
      isNewUser = true;
    } else {
      if (user.status !== 1) throw new AppError(403, "USER_DISABLED", "该账号已被禁用");
      await connection.execute("UPDATE users SET last_login_at=NOW(3) WHERE id=?", [user.id]);
    }
    await connection.commit();
    const tokenPayload = { userId: user.id, phone: user.phone, role: user.role };
    res.json({ success: true, data: { accessToken: signAccessToken(tokenPayload), tokenType: "Bearer", user: tokenPayload, isNewUser } });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}));

router.post("/third-party/bind", asyncHandler(async () => {
  throw new AppError(501, "NOT_IMPLEMENTED", "微信、千问、支付宝账号绑定接口已预留，暂未开放");
}));

export default router;
