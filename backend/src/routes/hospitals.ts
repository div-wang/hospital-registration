import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { paginationMeta, paginationSchema } from "../lib/pagination.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const input = paginationSchema.extend({
    keyword: z.string().trim().max(100).optional(), province: z.string().max(32).optional(),
    city: z.string().max(32).optional(), district: z.string().max(32).optional(), level: z.string().max(20).optional(),
  }).parse(req.query);
  const where = ["status = 1"];
  const params: unknown[] = [];
  if (input.keyword) { where.push("(name LIKE ? OR short_name LIKE ? OR address LIKE ?)"); params.push(`%${input.keyword}%`, `%${input.keyword}%`, `%${input.keyword}%`); }
  for (const field of ["province", "city", "district", "level"] as const) {
    if (input[field]) { where.push(`${field} = ?`); params.push(input[field]); }
  }
  const clause = where.join(" AND ");
  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) total FROM hospitals WHERE ${clause}`, params);
  const offset = (input.page - 1) * input.pageSize;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, code, name, short_name shortName, level, type, province, city, district, address, phone, latitude, longitude
     FROM hospitals WHERE ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, input.pageSize, offset],
  );
  res.json({ success: true, data: rows, pagination: paginationMeta(input.page, input.pageSize, countRows[0]?.total ?? 0) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, code, name, short_name shortName, level, type, province, city, district, address, phone,
            description, latitude, longitude, created_at createdAt, updated_at updatedAt
     FROM hospitals WHERE id = ? AND status = 1`, [id],
  );
  if (!rows[0]) throw new AppError(404, "HOSPITAL_NOT_FOUND", "医院不存在");
  res.json({ success: true, data: rows[0] });
}));

export default router;
