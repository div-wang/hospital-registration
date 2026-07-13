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
const bodySchema = z.object({ hospitalId: z.number().int().positive(), parentId: z.number().int().positive().nullable().optional(), code: z.string().trim().min(1).max(50), name: z.string().trim().min(1).max(64), description: z.string().max(255).default(""), sortOrder: z.number().int().min(0).default(0) });

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

router.post("/", requireRoles("merchant_admin", "merchant_staff", "super_admin"), asyncHandler(async (req, res) => {
  const input = bodySchema.parse(req.body); await assertHospitalAccess(req.auth!, input.hospitalId);
  const [result] = await pool.execute<ResultSetHeader>("INSERT INTO departments (hospital_id,parent_id,code,name,description,sort_order) VALUES (?,?,?,?,?,?)", [input.hospitalId,input.parentId??null,input.code,input.name,input.description,input.sortOrder]);
  res.status(201).json({ success:true, data:{ id:result.insertId } });
}));

router.patch("/:id", requireRoles("merchant_admin", "merchant_staff", "super_admin"), asyncHandler(async (req, res) => {
  const id=z.coerce.number().int().positive().parse(req.params.id); const input=bodySchema.omit({hospitalId:true}).partial().refine(v=>Object.keys(v).length>0,"至少提供一个修改字段").parse(req.body);
  const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId FROM departments WHERE id=? AND status=1",[id]); if(!rows[0]) throw new AppError(404,"DEPARTMENT_NOT_FOUND","科室不存在"); await assertHospitalAccess(req.auth!,rows[0].hospitalId);
  const mapping={parentId:"parent_id",code:"code",name:"name",description:"description",sortOrder:"sort_order"} as const; const fields:string[]=[]; const params:unknown[]=[];
  for(const [key,column] of Object.entries(mapping)) if(key in input){fields.push(`${column}=?`);params.push(input[key as keyof typeof input]??null);}
  await pool.query(`UPDATE departments SET ${fields.join(",")} WHERE id=?`,[...params,id]); res.json({success:true,data:{id}});
}));

router.delete("/:id", requireRoles("merchant_admin", "merchant_staff", "super_admin"), asyncHandler(async (req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id); const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId FROM departments WHERE id=? AND status=1",[id]); if(!rows[0]) throw new AppError(404,"DEPARTMENT_NOT_FOUND","科室不存在"); await assertHospitalAccess(req.auth!,rows[0].hospitalId);
  const [doctors]=await pool.query<RowDataPacket[]>("SELECT id FROM doctors WHERE department_id=? AND status=1 LIMIT 1",[id]); if(doctors[0]) throw new AppError(409,"DEPARTMENT_IN_USE","科室下仍有在职医生，无法删除");
  await pool.execute("UPDATE departments SET status=0 WHERE id=?",[id]); res.status(204).send();
}));

export default router;
