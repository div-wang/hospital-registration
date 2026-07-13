import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { paginationMeta, paginationSchema } from "../lib/pagination.js";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const input = paginationSchema.extend({ hospitalId: z.coerce.number().int().positive().optional(), keyword: z.string().trim().max(64).optional() }).parse(req.query);
  const where = ["d.status = 1", "h.status = 1"];
  const params: unknown[] = [];
  if (input.hospitalId) { where.push("d.hospital_id = ?"); params.push(input.hospitalId); }
  if (input.keyword) { where.push("d.name LIKE ?"); params.push(`%${input.keyword}%`); }
  const clause = where.join(" AND ");
  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) total FROM departments d JOIN hospitals h ON h.id=d.hospital_id WHERE ${clause}`, params);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.id, d.code, d.name, d.parent_id parentId, d.description, h.id hospitalId, h.name hospitalName
     FROM departments d JOIN hospitals h ON h.id=d.hospital_id WHERE ${clause}
     ORDER BY d.id DESC LIMIT ? OFFSET ?`, [...params, input.pageSize, (input.page - 1) * input.pageSize],
  );
  res.json({ success: true, data: rows, pagination: paginationMeta(input.page, input.pageSize, countRows[0]?.total ?? 0) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.id, d.code, d.name, d.parent_id parentId, d.description, h.id hospitalId, h.name hospitalName
     FROM departments d JOIN hospitals h ON h.id=d.hospital_id WHERE d.id=? AND d.status=1 AND h.status=1`, [id],
  );
  if (!rows[0]) throw new AppError(404, "DEPARTMENT_NOT_FOUND", "科室不存在");
  res.json({ success: true, data: rows[0] });
}));

export default router;
