import { Router } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../lib/async-handler.js";
import { encryptSensitive, hashSensitive, maskIdCard } from "../lib/crypto.js";
import { AppError } from "../lib/errors.js";

const router = Router();
router.use(requireAuth);

const mobileSchema = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确");
const idCardSchema = z.string().trim().toUpperCase().regex(/^(\d{15}|\d{17}[0-9X])$/, "身份证号格式不正确");
const bodySchema = z.object({
  name: z.string().trim().min(2).max(64), mobile: mobileSchema, idCard: idCardSchema,
  relationship: z.enum(["self", "parent", "spouse", "child", "other"]).default("other"), isDefault: z.boolean().default(false),
});

const mapPerson = (row: RowDataPacket) => ({
  id: row.id, name: row.name, mobile: row.mobile, idCardMasked: maskIdCard(row.idCardLast4),
  relationship: row.relationship, isDefault: Boolean(row.isDefault), createdAt: row.createdAt, updatedAt: row.updatedAt,
});

router.get("/", asyncHandler(async (req, res) => {
  const query = z.object({ keyword: z.string().trim().max(64).optional(), sort: z.enum(["asc", "desc"]).default("desc") }).parse(req.query);
  const params: unknown[] = [req.auth!.userId];
  let keywordClause = "";
  if (query.keyword) { keywordClause = " AND (name LIKE ? OR mobile LIKE ?)"; params.push(`%${query.keyword}%`, `%${query.keyword}%`); }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, mobile, id_card_last4 idCardLast4, relationship, is_default isDefault,
            created_at createdAt, updated_at updatedAt
     FROM registration_people WHERE user_id=? AND deleted_at IS NULL${keywordClause} ORDER BY created_at ${query.sort.toUpperCase()}`,
    params,
  );
  res.json({ success: true, data: rows.map(mapPerson) });
}));

router.post("/", asyncHandler(async (req, res) => {
  const input = bodySchema.parse(req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("SELECT id FROM users WHERE id=? FOR UPDATE", [req.auth!.userId]);
    const [countRows] = await connection.query<(RowDataPacket & { total: number })[]>("SELECT COUNT(*) total FROM registration_people WHERE user_id=? AND deleted_at IS NULL", [req.auth!.userId]);
    if ((countRows[0]?.total ?? 0) >= 10) throw new AppError(409, "PERSON_LIMIT_REACHED", "每个用户最多添加 10 个挂号人");
    const hash = hashSensitive(input.idCard);
    const [duplicates] = await connection.query<RowDataPacket[]>("SELECT id FROM registration_people WHERE user_id=? AND id_card_hash=? AND deleted_at IS NULL", [req.auth!.userId, hash]);
    if (duplicates[0]) throw new AppError(409, "PERSON_ALREADY_EXISTS", "该挂号人已存在");
    if (input.isDefault) await connection.execute("UPDATE registration_people SET is_default=0 WHERE user_id=? AND deleted_at IS NULL", [req.auth!.userId]);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO registration_people (user_id, name, mobile, id_card_ciphertext, id_card_hash, id_card_last4, relationship, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.auth!.userId, input.name, input.mobile, encryptSensitive(input.idCard), hash, input.idCard.slice(-4), input.relationship, input.isDefault ? 1 : 0],
    );
    await connection.commit();
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const input = bodySchema.partial().refine((value) => Object.keys(value).length > 0, "至少提供一个修改字段").parse(req.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<RowDataPacket[]>("SELECT * FROM registration_people WHERE id=? AND user_id=? AND deleted_at IS NULL FOR UPDATE", [id, req.auth!.userId]);
    const current = rows[0];
    if (!current) throw new AppError(404, "PERSON_NOT_FOUND", "挂号人不存在");
    const idCard = input.idCard;
    if (idCard) {
      const [duplicates] = await connection.query<RowDataPacket[]>("SELECT id FROM registration_people WHERE user_id=? AND id_card_hash=? AND id<>? AND deleted_at IS NULL", [req.auth!.userId, hashSensitive(idCard), id]);
      if (duplicates[0]) throw new AppError(409, "PERSON_ALREADY_EXISTS", "该挂号人已存在");
    }
    if (input.isDefault) await connection.execute("UPDATE registration_people SET is_default=0 WHERE user_id=? AND deleted_at IS NULL", [req.auth!.userId]);
    await connection.execute(
      `UPDATE registration_people SET name=?, mobile=?, id_card_ciphertext=?, id_card_hash=?, id_card_last4=?, relationship=?, is_default=? WHERE id=?`,
      [input.name ?? current.name, input.mobile ?? current.mobile, idCard ? encryptSensitive(idCard) : current.id_card_ciphertext,
       idCard ? hashSensitive(idCard) : current.id_card_hash, idCard ? idCard.slice(-4) : current.id_card_last4,
       input.relationship ?? current.relationship, input.isDefault === undefined ? current.is_default : input.isDefault ? 1 : 0, id],
    );
    await connection.commit();
    res.json({ success: true, data: { id } });
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const [result] = await pool.execute<ResultSetHeader>("UPDATE registration_people SET deleted_at=NOW(3), is_default=0 WHERE id=? AND user_id=? AND deleted_at IS NULL", [id, req.auth!.userId]);
  if (!result.affectedRows) throw new AppError(404, "PERSON_NOT_FOUND", "挂号人不存在");
  res.status(204).send();
}));

export default router;
