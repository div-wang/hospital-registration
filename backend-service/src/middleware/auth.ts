import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../services/auth.js";
import type { UserRole } from "../services/auth.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHORIZED", "请先登录"));
    return;
  }
  try {
    req.auth = verifyAccessToken(authorization.slice(7));
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new AppError(403, "FORBIDDEN", "当前账号没有执行该操作的权限"));
      return;
    }
    next();
  };
}
