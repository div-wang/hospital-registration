import { randomInt } from "node:crypto";

let sequence = randomInt(0, 1_000_000);

export function createOrderNo(prefix: "RG" | "PAY" | "FLOW" = "RG"): string {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 17);
  sequence = (sequence + 1) % 1_000_000;
  return `${prefix}${timestamp}${String(sequence).padStart(6, "0")}`;
}
