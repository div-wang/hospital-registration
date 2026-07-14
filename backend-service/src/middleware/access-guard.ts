import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../services/auth.js";

const whitelist = new Set([
  "GET /health",
  "POST /api/v1/auth/send-sms",
  "POST /api/v1/auth/mobile-login",
]);
const publicReadPrefixes = [
  "/api/v1/hospitals",
  "/api/v1/departments",
  "/api/v1/doctors",
  "/api/v1/schedules",
];

export function accessGuard(req: Request, _res: Response, next: NextFunction): void {
  if (whitelist.has(`${req.method} ${req.path}`)) {
    next();
    return;
  }
  const platform = req.header("platform");
  if (!platform || !["h5", "miniprogram", "app"].includes(platform)) {
    next(new AppError(403, "PLATFORM_REQUIRED", "请求头 platform 必须为 h5、miniprogram 或 app"));
    return;
  }
  const authorization = req.header("authorization");
  if (req.method === "GET" && publicReadPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
    req.platform = platform as Request["platform"];
    if (authorization?.startsWith("Bearer ")) {
      try { req.auth = verifyAccessToken(authorization.slice(7)); } catch { /* 匿名浏览不因过期令牌失败 */ }
    }
    next();
    return;
  }
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(403, "TOKEN_REQUIRED", "请求头 Authorization 缺失或格式不正确"));
    return;
  }
  try {
    req.platform = platform as Request["platform"];
    req.auth = verifyAccessToken(authorization.slice(7));
    next();
  } catch {
    next(new AppError(403, "INVALID_TOKEN", "登录状态已失效，请重新登录"));
  }
}
