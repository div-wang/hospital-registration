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
const bodySchema = z.object({ hospitalId:z.number().int().positive(), departmentId:z.number().int().positive(), name:z.string().trim().min(2).max(64), avatarUrl:z.url().max(512).nullable().optional(), title:z.string().trim().max(64).default(""), specialty:z.string().max(500).default(""), description:z.string().max(10000).nullable().optional(), registrationFee:z.number().min(0).max(9999999999).default(0), sortOrder:z.number().int().min(0).default(0) });

router.get("/", asyncHandler(async (req, res) => {
  const input = paginationSchema.extend({
    keyword: z.string().trim().max(100).optional(), hospitalId: z.coerce.number().int().positive().optional(),
    departmentId: z.coerce.number().int().positive().optional(), department: z.string().trim().max(64).optional(),
    province: z.string().trim().max(32).optional(), city: z.string().trim().max(32).optional(), title: z.string().max(32).optional(),
  }).parse(req.query);
  const where = ["d.status=1", "h.status=1", "dep.status=1"];
  const params: unknown[] = [];
  if (input.keyword) { where.push("(d.name LIKE ? OR d.specialty LIKE ? OR h.name LIKE ?)"); params.push(`%${input.keyword}%`, `%${input.keyword}%`, `%${input.keyword}%`); }
  if (input.hospitalId) { where.push("d.hospital_id=?"); params.push(input.hospitalId); }
  if (input.departmentId) { where.push("d.department_id=?"); params.push(input.departmentId); }
  if (input.department) { where.push("dep.name=?"); params.push(input.department); }
  if (input.province) { where.push("h.province=?"); params.push(input.province); }
  if (input.city) { where.push("h.city=?"); params.push(input.city); }
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
    `SELECT d.id, d.name, d.title, d.specialty, d.description, d.avatar_url avatarUrl,
            d.registration_fee registrationFee, h.id hospitalId, h.name hospitalName,
            dep.id departmentId, dep.name departmentName
     FROM doctors d JOIN hospitals h ON h.id=d.hospital_id JOIN departments dep ON dep.id=d.department_id
     WHERE d.id=? AND d.status=1 AND h.status=1 AND dep.status=1`, [id],
  );
  if (!rows[0]) throw new AppError(404, "DOCTOR_NOT_FOUND", "医生不存在");
  res.json({ success: true, data: rows[0] });
}));

router.post("/", requireRoles("merchant_admin","merchant_staff","super_admin"), asyncHandler(async(req,res)=>{
  const input=bodySchema.parse(req.body); await assertHospitalAccess(req.auth!,input.hospitalId);
  const [deps]=await pool.query<RowDataPacket[]>("SELECT id FROM departments WHERE id=? AND hospital_id=? AND status=1",[input.departmentId,input.hospitalId]); if(!deps[0]) throw new AppError(400,"INVALID_DEPARTMENT","科室不属于该医院");
  const [result]=await pool.execute<ResultSetHeader>("INSERT INTO doctors (hospital_id,department_id,name,avatar_url,title,specialty,description,registration_fee,sort_order) VALUES (?,?,?,?,?,?,?,?,?)",[input.hospitalId,input.departmentId,input.name,input.avatarUrl??null,input.title,input.specialty,input.description??null,input.registrationFee,input.sortOrder]);
  res.status(201).json({success:true,data:{id:result.insertId}});
}));

router.patch("/:id", requireRoles("merchant_admin","merchant_staff","super_admin"), asyncHandler(async(req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id); const input=bodySchema.omit({hospitalId:true}).partial().refine(v=>Object.keys(v).length>0,"至少提供一个修改字段").parse(req.body);
  const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId FROM doctors WHERE id=? AND status=1",[id]); if(!rows[0]) throw new AppError(404,"DOCTOR_NOT_FOUND","医生不存在"); await assertHospitalAccess(req.auth!,rows[0].hospitalId);
  if(input.departmentId){const [deps]=await pool.query<RowDataPacket[]>("SELECT id FROM departments WHERE id=? AND hospital_id=? AND status=1",[input.departmentId,rows[0].hospitalId]);if(!deps[0]) throw new AppError(400,"INVALID_DEPARTMENT","科室不属于该医院");}
  const mapping={departmentId:"department_id",name:"name",avatarUrl:"avatar_url",title:"title",specialty:"specialty",description:"description",registrationFee:"registration_fee",sortOrder:"sort_order"} as const; const fields:string[]=[];const params:unknown[]=[];
  for(const [key,column] of Object.entries(mapping))if(key in input){fields.push(`${column}=?`);params.push(input[key as keyof typeof input]??null);} await pool.query(`UPDATE doctors SET ${fields.join(",")} WHERE id=?`,[...params,id]);res.json({success:true,data:{id}});
}));

router.delete("/:id", requireRoles("merchant_admin","merchant_staff","super_admin"), asyncHandler(async(req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id);const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId FROM doctors WHERE id=? AND status=1",[id]);if(!rows[0])throw new AppError(404,"DOCTOR_NOT_FOUND","医生不存在");await assertHospitalAccess(req.auth!,rows[0].hospitalId);await pool.execute("UPDATE doctors SET status=0 WHERE id=?",[id]);await pool.execute("UPDATE doctor_schedules SET status=0 WHERE doctor_id=? AND schedule_date>=CURRENT_DATE",[id]);res.status(204).send();
}));

export default router;
