import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { paginationMeta, paginationSchema } from "../lib/pagination.js";
import { requireRoles } from "../middleware/auth.js";
import { assertHospitalAccess } from "../services/hospital-access.js";

const router = Router();
const hospitalBody = z.object({
  code: z.string().trim().min(2).max(50), name: z.string().trim().min(2).max(128), shortName: z.string().trim().max(64).nullable().optional(),
  level: z.string().trim().min(2).max(20), type: z.string().trim().max(32).nullable().optional(), province: z.string().trim().min(2).max(32),
  city: z.string().trim().min(2).max(32), district: z.string().trim().min(2).max(32), address: z.string().trim().min(2).max(255),
  phone: z.string().trim().max(32).nullable().optional(), logoUrl: z.url().max(512).nullable().optional(), licenseNo: z.string().trim().max(64).nullable().optional(),
  description: z.string().max(10000).nullable().optional(), latitude: z.number().min(-90).max(90).nullable().optional(), longitude: z.number().min(-180).max(180).nullable().optional(),
});

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

router.post("/", requireRoles("super_admin"), asyncHandler(async (req, res) => {
  const input = hospitalBody.parse(req.body);
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO hospitals (code,name,short_name,level,type,province,city,district,address,phone,logo_url,license_no,description,latitude,longitude,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [input.code,input.name,input.shortName??null,input.level,input.type??null,input.province,input.city,input.district,input.address,input.phone??null,input.logoUrl??null,input.licenseNo??null,input.description??null,input.latitude??null,input.longitude??null,req.auth!.userId],
  );
  await pool.execute("INSERT INTO accounts (hospital_id) VALUES (?)", [result.insertId]);
  res.status(201).json({ success: true, data: { id: result.insertId } });
}));

router.patch("/:id", requireRoles("merchant_admin", "super_admin"), asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const input = hospitalBody.partial().refine((v) => Object.keys(v).length > 0, "至少提供一个修改字段").parse(req.body);
  await assertHospitalAccess(req.auth!, id);
  const fields: string[] = []; const params: unknown[] = [];
  const mapping = { code:"code",name:"name",shortName:"short_name",level:"level",type:"type",province:"province",city:"city",district:"district",address:"address",phone:"phone",logoUrl:"logo_url",licenseNo:"license_no",description:"description",latitude:"latitude",longitude:"longitude" } as const;
  for (const [key, column] of Object.entries(mapping)) if (key in input) { fields.push(`${column}=?`); params.push(input[key as keyof typeof input] ?? null); }
  const [result] = await pool.query<ResultSetHeader>(`UPDATE hospitals SET ${fields.join(",")} WHERE id=? AND status=1`, [...params, id]);
  if (!result.affectedRows) throw new AppError(404, "HOSPITAL_NOT_FOUND", "医院不存在");
  res.json({ success: true, data: { id } });
}));

router.delete("/:id", requireRoles("super_admin"), asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [result] = await pool.execute<ResultSetHeader>("UPDATE hospitals SET status=0 WHERE id=? AND status=1", [id]);
  if (!result.affectedRows) throw new AppError(404, "HOSPITAL_NOT_FOUND", "医院不存在");
  res.status(204).send();
}));

export default router;
