import assert from "node:assert/strict";
import test from "node:test";
import { createOrderNo } from "../src/lib/order-no.js";

test("registration and payment numbers have expected prefixes", () => {
  assert.match(createOrderNo("RG"), /^RG\d{23}$/);
  assert.match(createOrderNo("PAY"), /^PAY\d{23}$/);
});

test("generated order numbers are unique in a practical batch", () => {
  const values = new Set(Array.from({ length: 500 }, () => createOrderNo()));
  assert.equal(values.size, 500);
});
