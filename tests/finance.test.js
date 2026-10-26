import { test } from "node:test";
import assert from "node:assert/strict";
import {
  payroll,
  installment,
  summary,
  referenceTax,
  periodIndex,
  periodDate,
} from "../src/finance.js";
test("zero salary and exempt salary", () => {
  assert.equal(payroll(0).net, 0);
  assert.equal(payroll(8000).ir, 0);
  assert.equal(payroll(8000).inss, 560);
});
test("progressive income tax after INSS", () => {
  assert.deepEqual(payroll(20000), {
    gross: 20000,
    inss: 1400,
    ir: 1636.67,
    net: 16963.33,
  });
});
test("all tax boundaries and marginal rates", () => {
  for (const annual of [
    100000, 100001, 200000, 200001, 350000, 350001, 500000, 500001, 1000000,
  ]) {
    const tax = { ...referenceTax, inssRate: 0 };
    const b = tax.brackets.find((b) => b.to === null || annual <= b.to);
    assert.equal(
      payroll(annual / 12, tax).ir,
      Math.round(((b.base + (annual - b.from) * b.rate) / 12) * 100) / 100,
    );
  }
});
test("invalid salary rejected", () => {
  assert.throws(() => payroll(-1));
  assert.throws(() => payroll(NaN));
});
test("installments cover exact total and stop at end", () => {
  const d = { amount: 100, periods: 3, start: "2026-12-16" };
  assert.equal(installment(d, "2026-12-01"), 0);
  assert.equal(installment(d, "2026-12-16"), 33.33);
  assert.equal(installment(d, "2027-01-01"), 33.33);
  assert.equal(installment(d, "2027-01-16"), 33.34);
  assert.equal(installment(d, "2027-02-01"), 0);
});
test("single period deduction and negative available", () => {
  const d = {
    salary: 0,
    tax: referenceTax,
    debts: [{ amount: 1000, periods: 1, start: "2026-10-15" }],
    expenses: [
      { amount: 300, date: "2026-10-01" },
      { amount: 800, date: "2026-10-16" },
    ],
  };
  const s = summary(d, "2026-10-01");
  assert.equal(s.available, -1300);
  assert.equal(s.expenses, 300);
  assert.equal(summary(d, "2026-10-16").deductions, 0);
});
test("period roundtrip across years", () => {
  for (const date of ["2025-12-16", "2026-01-01", "2026-10-16"])
    assert.equal(periodDate(periodIndex(date)), date);
});
test("two quincenas reconcile every monthly cent", () => {
  for (const salary of [15000.01, 20000, 30000.77]) {
    const d = { salary, tax: referenceTax, debts: [], expenses: [] };
    const a = summary(d, "2026-10-01"),
      b = summary(d, "2026-10-16");
    assert.equal(
      Math.round((a.periodNet + b.periodNet) * 100),
      Math.round(payroll(salary).net * 100),
    );
    assert.equal(
      Math.round((a.periodWithheld + b.periodWithheld) * 100),
      Math.round((payroll(salary).inss + payroll(salary).ir) * 100),
    );
  }
});
