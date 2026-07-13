import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export type UserRole = "user" | "merchant_admin" | "merchant_staff" | "super_admin";

export function signAccessToken(payload: { userId: number; phone: string; role: UserRole }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): { userId: number; phone: string; role: UserRole } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.userId !== "number" || typeof payload.phone !== "string" ||
        !["user", "merchant_admin", "merchant_staff", "super_admin"].includes(String(payload.role))) throw new Error();
    return { userId: payload.userId, phone: payload.phone, role: payload.role as UserRole };
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  }
}
