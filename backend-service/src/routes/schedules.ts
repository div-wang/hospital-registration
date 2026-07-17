import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { paginationMeta, paginationSchema } from "../lib/pagination.js";
import { requireRoles } from "../middleware/auth.js";
import { assertHospitalAccess } from "../services/hospital-access.js";

const router=Router();
const bodySchema=z.object({doctorId:z.number().int().positive(),scheduleDate:z.iso.date(),period:z.enum(["morning","afternoon","evening","custom"]),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),endTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),totalSlots:z.number().int().positive().max(10000),fee:z.number().min(0).max(9999999999)}).refine(v=>v.startTime<v.endTime,{message:"结束时间必须晚于开始时间",path:["endTime"]});

router.get("/",asyncHandler(async(req,res)=>{
  const input=paginationSchema.extend({doctorId:z.coerce.number().int().positive().optional(),hospitalId:z.coerce.number().int().positive().optional(),departmentId:z.coerce.number().int().positive().optional(),includeExpired:z.enum(["true","false"]).default("false")}).parse(req.query);
  const where=["s.status=1","d.status=1"];const params:unknown[]=[];if(input.includeExpired!=="true")where.push("s.schedule_date>=CURRENT_DATE");for(const [key,column] of [["doctorId","s.doctor_id"],["hospitalId","s.hospital_id"],["departmentId","s.department_id"]] as const){if(input[key]){where.push(`${column}=?`);params.push(input[key]);}}
  const clause=where.join(" AND ");const joins="FROM doctor_schedules s JOIN doctors d ON d.id=s.doctor_id JOIN hospitals h ON h.id=s.hospital_id JOIN departments dep ON dep.id=s.department_id";
  const [counts]=await pool.query<(RowDataPacket&{total:number})[]>(`SELECT COUNT(*) total ${joins} WHERE ${clause}`,params);
  const [rows]=await pool.query<RowDataPacket[]>(`SELECT s.id,s.schedule_date scheduleDate,s.period,s.start_time startTime,s.end_time endTime,s.total_slots totalSlots,s.booked_slots bookedSlots,(s.total_slots-s.booked_slots) availableSlots,s.fee,d.id doctorId,d.name doctorName,h.id hospitalId,h.name hospitalName,dep.id departmentId,dep.name departmentName ${joins} WHERE ${clause} ORDER BY s.schedule_date,s.start_time LIMIT ? OFFSET ?`,[...params,input.pageSize,(input.page-1)*input.pageSize]);
  res.json({success:true,data:rows,pagination:paginationMeta(input.page,input.pageSize,counts[0]?.total??0)});
}));

router.post("/",requireRoles("merchant_admin","merchant_staff","super_admin"),asyncHandler(async(req,res)=>{
  const input=bodySchema.parse(req.body);const [doctors]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId,department_id departmentId FROM doctors WHERE id=? AND status=1",[input.doctorId]);const doctor=doctors[0];if(!doctor)throw new AppError(404,"DOCTOR_NOT_FOUND","医生不存在");await assertHospitalAccess(req.auth!,doctor.hospitalId);
  const [result]=await pool.execute<ResultSetHeader>("INSERT INTO doctor_schedules (hospital_id,department_id,doctor_id,schedule_date,period,start_time,end_time,total_slots,fee) VALUES (?,?,?,?,?,?,?,?,?)",[doctor.hospitalId,doctor.departmentId,input.doctorId,input.scheduleDate,input.period,input.startTime,input.endTime,input.totalSlots,input.fee]);res.status(201).json({success:true,data:{id:result.insertId}});
}));

router.patch("/:id",requireRoles("merchant_admin","merchant_staff","super_admin"),asyncHandler(async(req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id);const input=bodySchema.omit({doctorId:true}).partial().refine(v=>Object.keys(v).length>0,"至少提供一个修改字段").parse(req.body);const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId,booked_slots bookedSlots FROM doctor_schedules WHERE id=? AND status=1",[id]);if(!rows[0])throw new AppError(404,"SCHEDULE_NOT_FOUND","排班不存在");await assertHospitalAccess(req.auth!,rows[0].hospitalId);if(rows[0].bookedSlots>0)throw new AppError(409,"SCHEDULE_HAS_BOOKINGS","该排班已有预约，不能修改");
  const mapping={scheduleDate:"schedule_date",period:"period",startTime:"start_time",endTime:"end_time",totalSlots:"total_slots",fee:"fee"} as const;const fields:string[]=[];const params:unknown[]=[];for(const [key,column]of Object.entries(mapping))if(key in input){fields.push(`${column}=?`);params.push(input[key as keyof typeof input]);}await pool.query(`UPDATE doctor_schedules SET ${fields.join(",")} WHERE id=?`,[...params,id]);res.json({success:true,data:{id}});
}));

router.delete("/:id",requireRoles("merchant_admin","merchant_staff","super_admin"),asyncHandler(async(req,res)=>{const id=z.coerce.number().int().positive().parse(req.params.id);const [rows]=await pool.query<RowDataPacket[]>("SELECT hospital_id hospitalId,booked_slots bookedSlots FROM doctor_schedules WHERE id=? AND status=1",[id]);if(!rows[0])throw new AppError(404,"SCHEDULE_NOT_FOUND","排班不存在");await assertHospitalAccess(req.auth!,rows[0].hospitalId);if(rows[0].bookedSlots>0)throw new AppError(409,"SCHEDULE_HAS_BOOKINGS","已有预约的排班不能删除");await pool.execute("UPDATE doctor_schedules SET status=0 WHERE id=?",[id]);res.status(204).send();}));
export default router;
