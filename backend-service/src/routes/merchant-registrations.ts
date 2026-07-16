import{Router}from"express";
import type{RowDataPacket}from"mysql2";
import{z}from"zod";
import{pool}from"../db/pool.js";
import{decryptSensitive}from"../lib/crypto.js";
import{asyncHandler}from"../lib/async-handler.js";
import{AppError}from"../lib/errors.js";
import{paginationMeta,paginationSchema}from"../lib/pagination.js";
import{requireRoles}from"../middleware/auth.js";
import{assertHospitalAccess}from"../services/hospital-access.js";

const router=Router();
router.use(requireRoles("merchant_admin","merchant_staff","super_admin"));
const maskName=(name:string)=>name.length<=1?"*":`${name[0]}${"*".repeat(Math.max(1,name.length-1))}`;
const maskPhone=(phone:string)=>phone.replace(/^(\d{3})\d+(\d{4})$/,"$1****$2");
const maskId=(id:string)=>id.length>8?`${id.slice(0,3)}***********${id.slice(-4)}`:"********";

router.get("/",asyncHandler(async(req,res)=>{
  const input=paginationSchema.extend({hospitalId:z.coerce.number().int().positive(),status:z.enum(["pending_payment","paid","confirmed","completed","cancelled","refunded","expired"]).optional(),keyword:z.string().trim().max(64).optional()}).parse(req.query);
  await assertHospitalAccess(req.auth!,input.hospitalId);
  const where=["hospital_id=?"],params:unknown[]=[input.hospitalId];
  if(input.status){where.push("status=?");params.push(input.status)}
  if(input.keyword){where.push("(doctor_name LIKE ? OR department_name LIKE ? OR order_no LIKE ?)");params.push(`%${input.keyword}%`,`%${input.keyword}%`,`%${input.keyword}%`)}
  const clause=where.join(" AND ");
  const[counts]=await pool.query<(RowDataPacket&{total:number})[]>(`SELECT COUNT(*) total FROM registration_orders WHERE ${clause}`,params);
  const[rows]=await pool.query<RowDataPacket[]>(`SELECT id,order_no orderNo,person_name personName,person_phone personPhone,person_id_card_ciphertext idCipher,doctor_name doctorName,doctor_title doctorTitle,department_name departmentName,visit_date visitDate,period,visit_number visitNumber,amount,status,created_at createdAt FROM registration_orders WHERE ${clause} ORDER BY visit_date DESC,created_at DESC LIMIT ? OFFSET ?`,[...params,input.pageSize,(input.page-1)*input.pageSize]);
  const data=rows.map(({idCipher,...row})=>{const idCard=decryptSensitive(idCipher);return{...row,personName:maskName(row.personName),personPhone:maskPhone(row.personPhone),personIdCard:maskId(idCard)}});
  res.json({success:true,data,pagination:paginationMeta(input.page,input.pageSize,counts[0]?.total??0)});
}));

router.get("/:id",asyncHandler(async(req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id);
  const[rows]=await pool.query<RowDataPacket[]>(`SELECT id,order_no orderNo,hospital_id hospitalId,person_name personName,person_phone personPhone,person_id_card_ciphertext idCipher,doctor_name doctorName,doctor_title doctorTitle,department_name departmentName,visit_date visitDate,period,visit_number visitNumber,amount,status,symptoms,cancel_reason cancelReason,created_at createdAt,completed_at completedAt,cancelled_at cancelledAt FROM registration_orders WHERE id=?`,[id]);
  const row=rows[0];if(!row)throw new AppError(404,"ORDER_NOT_FOUND","挂号订单不存在");await assertHospitalAccess(req.auth!,row.hospitalId);
  const{idCipher,hospitalId,...data}=row;res.json({success:true,data:{...data,personIdCard:decryptSensitive(idCipher)}});
}));

router.patch("/:id/status",asyncHandler(async(req,res)=>{
  const id=z.coerce.number().int().positive().parse(req.params.id);const input=z.object({status:z.enum(["completed","cancelled"]),reason:z.string().trim().max(255).optional()}).parse(req.body);
  const connection=await pool.getConnection();try{await connection.beginTransaction();const[rows]=await connection.query<RowDataPacket[]>("SELECT hospital_id hospitalId,schedule_id scheduleId,status FROM registration_orders WHERE id=? FOR UPDATE",[id]);const order=rows[0];if(!order)throw new AppError(404,"ORDER_NOT_FOUND","挂号订单不存在");await assertHospitalAccess(req.auth!,order.hospitalId);if(!["pending_payment","paid","confirmed"].includes(order.status))throw new AppError(409,"ORDER_STATUS_LOCKED","当前订单状态不能再修改");if(input.status==="completed")await connection.execute("UPDATE registration_orders SET status='completed',completed_at=NOW(3) WHERE id=?",[id]);else{await connection.execute("UPDATE registration_orders SET status='cancelled',cancel_reason=?,cancelled_at=NOW(3) WHERE id=?",[input.reason||"医院取消",id]);if(order.scheduleId)await connection.execute("UPDATE doctor_schedules SET booked_slots=GREATEST(booked_slots-1,0) WHERE id=?",[order.scheduleId])}await connection.commit();res.json({success:true,data:{id,status:input.status}})}catch(error){await connection.rollback();throw error}finally{connection.release()}
}));
export default router;
