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
    departmentId: z.number().int().positive(), doctorId: z.number().int().positive(),
    visitDate: z.iso.date().optional(), timePeriod: z.string().trim().max(32).optional(),
  }).parse(req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [people] = await connection.query<RowDataPacket[]>(
      "SELECT id, name, mobile, id_card_ciphertext FROM registration_people WHERE id=? AND user_id=? AND deleted_at IS NULL",
      [input.registrationPersonId, req.auth!.userId],
    );
    const person = people[0];
    if (!person) throw new AppError(404, "PERSON_NOT_FOUND", "挂号人不存在或不属于当前用户");
    const [resources] = await connection.query<RowDataPacket[]>(
      `SELECT h.id hospitalId, h.name hospitalName, dep.id departmentId, dep.name departmentName,
              d.id doctorId, d.name doctorName, d.title doctorTitle, d.registration_fee amount
       FROM doctors d JOIN hospitals h ON h.id=d.hospital_id JOIN departments dep ON dep.id=d.department_id
       WHERE d.id=? AND h.id=? AND dep.id=? AND d.status=1 AND h.status=1 AND dep.status=1`,
      [input.doctorId, input.hospitalId, input.departmentId],
    );
    const resource = resources[0];
    if (!resource) throw new AppError(400, "INVALID_MEDICAL_RESOURCE", "医院、科室与医生的关联关系不正确");
    const orderNo = createOrderNo();
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO registration_orders
       (order_no, user_id, registration_person_id, hospital_id, department_id, doctor_id, person_name, person_mobile,
        person_id_card_ciphertext, hospital_name, department_name, doctor_name, doctor_title, visit_date, time_period, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNo, req.auth!.userId, person.id, resource.hospitalId, resource.departmentId, resource.doctorId,
       person.name, person.mobile, person.id_card_ciphertext, resource.hospitalName, resource.departmentName,
       resource.doctorName, resource.doctorTitle, input.visitDate ?? null, input.timePeriod ?? null, resource.amount],
    );
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
    `SELECT id, order_no orderNo, person_name personName, person_mobile personMobile, hospital_name hospitalName,
            department_name departmentName, doctor_name doctorName, doctor_title doctorTitle, visit_date visitDate,
            time_period timePeriod, amount, status, paid_at paidAt, cancelled_at cancelledAt, created_at createdAt
     FROM registration_orders WHERE user_id=?${statusClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, input.pageSize, (input.page - 1) * input.pageSize],
  );
  res.json({ success: true, data: rows, pagination: paginationMeta(input.page, input.pageSize, counts[0]?.total ?? 0) });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_no orderNo, person_name personName, person_mobile personMobile, hospital_name hospitalName,
            department_name departmentName, doctor_name doctorName, doctor_title doctorTitle, visit_date visitDate,
            time_period timePeriod, amount, status, paid_at paidAt, cancelled_at cancelledAt, created_at createdAt
     FROM registration_orders WHERE id=? AND user_id=?`, [id, req.auth!.userId],
  );
  if (!rows[0]) throw new AppError(404, "ORDER_NOT_FOUND", "挂号订单不存在");
  res.json({ success: true, data: rows[0] });
}));

export default router;
