import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "NOT_FOUND", `接口不存在：${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "请求参数不正确", details: error.issues } });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, error: { code: error.code, message: error.message, details: error.details } });
    return;
  }
  req.log?.error?.({ err: error }, "Unhandled request error");
  res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } });
}
