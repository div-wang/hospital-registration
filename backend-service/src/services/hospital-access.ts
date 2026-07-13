import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import { pool } from "../db/pool.js";
import { AppError } from "../lib/errors.js";
import type { UserRole } from "./auth.js";

type Executor = Pick<PoolConnection, "query">;

export async function assertHospitalAccess(
  user: { userId: number; role: UserRole },
  hospitalId: number,
  executor: Executor = pool,
): Promise<void> {
  if (user.role === "super_admin") return;
  if (!['merchant_admin', 'merchant_staff'].includes(user.role)) throw new AppError(403, "FORBIDDEN", "仅医院工作人员可执行该操作");
  const [rows] = await executor.query<RowDataPacket[]>(
    "SELECT id FROM hospital_members WHERE hospital_id=? AND user_id=? AND status=1",
    [hospitalId, user.userId],
  );
  if (!rows[0]) throw new AppError(403, "HOSPITAL_ACCESS_DENIED", "无权管理该医院");
}
