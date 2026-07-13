import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { signAccessToken, verifySmsCode } from "../services/auth.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const mobileSchema = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确");

router.post("/mobile-login", asyncHandler(async (req, res) => {
  const input = z.object({ mobile: mobileSchema, verificationCode: z.string().length(6) }).parse(req.body);
  verifySmsCode(input.mobile, input.verificationCode);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<(RowDataPacket & { id: number; mobile: string; status: number })[]>(
      "SELECT id, mobile, status FROM users WHERE mobile = ? FOR UPDATE",
      [input.mobile],
    );
    let user = rows[0];
    let isNewUser = false;
    if (!user) {
      const [result] = await connection.execute<ResultSetHeader>("INSERT INTO users (mobile, last_login_at) VALUES (?, NOW(3))", [input.mobile]);
      user = { id: result.insertId, mobile: input.mobile, status: 1 } as RowDataPacket & { id: number; mobile: string; status: number };
      isNewUser = true;
    } else {
      if (user.status !== 1) throw new AppError(403, "USER_DISABLED", "该账号已被禁用");
      await connection.execute("UPDATE users SET last_login_at = NOW(3) WHERE id = ?", [user.id]);
    }
    await connection.commit();
    res.json({ success: true, data: { accessToken: signAccessToken({ userId: user.id, mobile: user.mobile }), tokenType: "Bearer", user: { id: user.id, mobile: user.mobile }, isNewUser } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

router.post("/third-party/bind", requireAuth, asyncHandler(async (_req, _res) => {
  throw new AppError(501, "NOT_IMPLEMENTED", "第三方账号绑定接口已预留，暂未开放");
}));

export default router;
