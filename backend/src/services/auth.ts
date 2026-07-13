import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";

export function verifySmsCode(mobile: string, code: string): void {
  if (env.NODE_ENV === "production") {
    throw new AppError(503, "SMS_PROVIDER_NOT_CONFIGURED", "短信验证码服务尚未配置");
  }
  if (code !== env.DEV_SMS_CODE) {
    throw new AppError(401, "INVALID_SMS_CODE", "短信验证码不正确");
  }
  void mobile;
}

export function signAccessToken(payload: { userId: number; mobile: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] });
}

export function verifyAccessToken(token: string): { userId: number; mobile: string } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.userId !== "number" || typeof payload.mobile !== "string") throw new Error();
    return { userId: payload.userId, mobile: payload.mobile };
  } catch {
    throw new AppError(401, "INVALID_TOKEN", "登录状态已失效，请重新登录");
  }
}
