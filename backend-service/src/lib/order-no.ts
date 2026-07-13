import { randomInt } from "node:crypto";

export function createOrderNo(prefix: "RG" | "PAY" | "FLOW" = "RG"): string {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 17);
  return `${prefix}${timestamp}${randomInt(100000, 999999)}`;
}
