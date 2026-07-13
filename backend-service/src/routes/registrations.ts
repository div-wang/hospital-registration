import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/async-handler.js";
import { AppError } from "../lib/errors.js";
import { createOrderNo } from "../lib/order-no.js";
import { paginationMeta, paginationSchema } from "../lib/pagination.js";

const router = Router();
router.use(requireAuth);

router.post("/", asyncHandler(async (req, res) => {
  const input = z.object({
    registrationPersonId: z.number().int().positive(), hospitalId: z.number().int().positive(),
    departmentId: z.number().int().positive(), doctorId: z.number().int().positive(), scheduleId: z.number().int().positive(),
    symptoms: z.string().trim().max(1000).default(""),
  }).parse(req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [people] = await connection.query<RowDataPacket[]>(
      "SELECT id, name, phone, id_card_ciphertext FROM registration_people WHERE id=? AND user_id=? AND deleted_at IS NULL",
      [input.registrationPersonId, req.auth!.userId],
    );
    const person = people[0];
    if (!person) throw new AppError(404, "PERSON_NOT_FOUND", "挂号人不存在或不属于当前用户");
    const [resources] = await connection.query<RowDataPacket[]>(
      `SELECT h.id hospitalId,h.name hospitalName,dep.id departmentId,dep.name departmentName,d.id doctorId,d.name doctorName,d.title doctorTitle,
              s.id scheduleId,s.schedule_date visitDate,s.period,s.fee amount,s.total_slots totalSlots,s.booked_slots bookedSlots
       FROM doctor_schedules s JOIN doctors d ON d.id=s.doctor_id JOIN hospitals h ON h.id=s.hospital_id JOIN departments dep ON dep.id=s.department_id
       WHERE s.id=? AND d.id=? AND h.id=? AND dep.id=? AND s.status=1 AND s.schedule_date>=CURRENT_DATE AND d.status=1 AND h.status=1 AND dep.status=1 FOR UPDATE`,
      [input.scheduleId, input.doctorId, input.hospitalId, input.departmentId],
    );
    const resource = resources[0];
    if (!resource) throw new AppError(400, "INVALID_MEDICAL_RESOURCE", "医院、科室与医生的关联关系不正确");
    if (resource.bookedSlots >= resource.totalSlots) throw new AppError(409, "SCHEDULE_SOLD_OUT", "该排班号源已约满");
    const visitNumber = Number(resource.bookedSlots) + 1;
    const orderNo = createOrderNo();
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO registration_orders
       (order_no,user_id,registration_person_id,hospital_id,department_id,doctor_id,schedule_id,person_name,person_phone,
        person_id_card_ciphertext,hospital_name,department_name,doctor_name,doctor_title,visit_date,period,visit_number,amount,symptoms)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [orderNo, req.auth!.userId, person.id, resource.hospitalId, resource.departmentId, resource.doctorId,
       resource.scheduleId,person.name,person.phone,person.id_card_ciphertext,resource.hospitalName,resource.departmentName,
       resource.doctorName,resource.doctorTitle,resource.visitDate,resource.period,visitNumber,resource.amount,input.symptoms],
    );
    await connection.execute("UPDATE doctor_schedules SET booked_slots=booked_slots+1 WHERE id=?", [resource.scheduleId]);
    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId, orderNo, status: "pending_payment", amount: resource.amount } });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}));

router.get("/", asyncHandler(async (req, res) => {
  const input = paginationSchema.extend({ status: z.string().max(32).optional() }).parse(req.query);
  const params: unknown[] = [req.auth!.userId];
  const statusClause = input.status ? " AND status=?" : "";
  if (input.status) params.push(input.status);
  const [counts] = await pool.query<(RowDataPacket & { total: number })[]>(`SELECT COUNT(*) total FROM registration_orders WHERE user_id=?${statusClause}`, params);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_no orderNo, person_name personName, person_phone personPhone, hospital_name hospitalName,
            department_name departmentName, doctor_name doctorName, doctor_title doctorTitle, visit_date visitDate,
            period, visit_number visitNumber, amount, status, paid_at paidAt, cancelled_at cancelledAt, created_at createdAt
     FROM registration_orders WHERE user_id=?${statusClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, input.pageSize, (input.page - 1) * input.pageSize],
  );
  res.json({ success: true, data: rows, pagination: paginationMeta(input.page, input.pageSize, counts[0]?.total ?? 0) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_no orderNo, person_name personName, person_phone personPhone, hospital_name hospitalName,
            department_name departmentName, doctor_name doctorName, doctor_title doctorTitle, visit_date visitDate,
            period, visit_number visitNumber, amount, status, paid_at paidAt, cancelled_at cancelledAt, created_at createdAt
     FROM registration_orders WHERE id=? AND user_id=?`, [id, req.auth!.userId],
  );
  if (!rows[0]) throw new AppError(404, "ORDER_NOT_FOUND", "挂号订单不存在");
  res.json({ success: true, data: rows[0] });
}));

export default router;
