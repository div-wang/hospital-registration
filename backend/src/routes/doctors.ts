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
    keyword: z.string().trim().max(100).optional(), hospitalId: z.coerce.number().int().positive().optional(),
    departmentId: z.coerce.number().int().positive().optional(), title: z.string().max(32).optional(),
  }).parse(req.query);
  const where = ["d.status=1", "h.status=1", "dep.status=1"];
  const params: unknown[] = [];
  if (input.keyword) { where.push("(d.name LIKE ? OR d.specialty LIKE ? OR h.name LIKE ?)"); params.push(`%${input.keyword}%`, `%${input.keyword}%`, `%${input.keyword}%`); }
  if (input.hospitalId) { where.push("d.hospital_id=?"); params.push(input.hospitalId); }
  if (input.departmentId) { where.push("d.department_id=?"); params.push(input.departmentId); }
  if (input.title) { where.push("d.title=?"); params.push(input.title); }
  const clause = where.join(" AND ");
  const joins = "FROM doctors d JOIN hospitals h ON h.id=d.hospital_id JOIN departments dep ON dep.id=d.department_id";
  const [countRows] = await pool.query<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) total ${joins} WHERE ${clause}`, params);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.id, d.name, d.title, d.specialty, d.avatar_url avatarUrl, d.registration_fee registrationFee,
            h.id hospitalId, h.name hospitalName, dep.id departmentId, dep.name departmentName
     ${joins} WHERE ${clause} ORDER BY d.id DESC LIMIT ? OFFSET ?`, [...params, input.pageSize, (input.page - 1) * input.pageSize],
  );
  res.json({ success: true, data: rows, pagination: paginationMeta(input.page, input.pageSize, countRows[0]?.total ?? 0) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT d.id, d.name, d.title, d.specialty, d.introduction, d.avatar_url avatarUrl,
            d.registration_fee registrationFee, h.id hospitalId, h.name hospitalName,
            dep.id departmentId, dep.name departmentName
     FROM doctors d JOIN hospitals h ON h.id=d.hospital_id JOIN departments dep ON dep.id=d.department_id
     WHERE d.id=? AND d.status=1 AND h.status=1 AND dep.status=1`, [id],
  );
  if (!rows[0]) throw new AppError(404, "DOCTOR_NOT_FOUND", "医生不存在");
  res.json({ success: true, data: rows[0] });
}));

export default router;
