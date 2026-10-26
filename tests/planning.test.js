import { test } from "node:test";
import assert from "node:assert/strict";
import {
  categoryTotals,
  budgetStatus,
  savedForGoal,
  periodSavings,
} from "../src/planning.js";
import { summary, referenceTax } from "../src/finance.js";
const example = {
  salary: 20000,
  tax: referenceTax,
  debts: [],
  expenses: [
    {
      id: "e1",
      name: "Compras",
      amount: 350,
      date: "2026-10-02",
      category: "Alimentación",
    },
    {
      id: "e2",
      name: "Bus",
      amount: 50,
      date: "2026-10-12",
      category: "Transporte",
    },
    {
      id: "e3",
      name: "Compras",
      amount: 500,
      date: "2026-10-16",
      category: "Alimentación",
    },
  ],
  budgets: [
    { category: "Alimentación", limit: 300, period: "2026-10-01" },
    { category: "Alimentación", limit: 600, period: "2026-10-16" },
  ],
  goals: [{ id: "g1", target: 1000 }],
  contributions: [
    { id: "c1", goalId: "g1", date: "2026-10-01", amount: 200 },
    { id: "c2", goalId: "g1", date: "2026-10-16", amount: 100 },
  ],
};
test("category chart excludes other quincenas", () => {
  const totals = categoryTotals(example, "2026-10-01");
  assert.equal(totals.find((c) => c.category === "Alimentación").total, 350);
  assert.equal(totals.find((c) => c.category === "Transporte").total, 50);
  assert.equal(
    totals.reduce((s, c) => s + c.total, 0),
    400,
  );
});
test("budget status distinguishes overspending, remaining, and no budget", () => {
  const a = budgetStatus(example, "2026-10-01");
  const food = a.find((c) => c.category === "Alimentación");
  assert.equal(food.remaining, -50);
  assert.equal(food.percent, 117);
  assert.equal(a.find((c) => c.category === "Salud").configured, false);
  assert.equal(
    budgetStatus(example, "2026-10-16").find(
      (c) => c.category === "Alimentación",
    ).remaining,
    100,
  );
});
test("budget limits never reduce available; contributions do", () => {
  const base = summary(
    { ...example, budgets: [], contributions: [] },
    "2026-10-01",
  ).available;
  assert.equal(
    summary({ ...example, contributions: [] }, "2026-10-01").available,
    base,
  );
  assert.equal(summary(example, "2026-10-01").available, base - 200);
  assert.equal(periodSavings(example, "2026-10-16"), 100);
  assert.equal(savedForGoal(example, "g1"), 300);
});
test("removing contribution restores exactly its source period", () => {
  const reverted = {
    ...example,
    contributions: example.contributions.filter((c) => c.id !== "c1"),
  };
  assert.equal(
    summary(reverted, "2026-10-01").available -
      summary(example, "2026-10-01").available,
    200,
  );
  assert.equal(
    summary(reverted, "2026-10-16").available,
    summary(example, "2026-10-16").available,
  );
});
test("old profiles without planning arrays remain compatible", () => {
  const old = { salary: 20000, tax: referenceTax, debts: [], expenses: [] };
  assert.equal(periodSavings(old, "2026-10-01"), 0);
  assert.equal(savedForGoal(old, "none"), 0);
  assert.equal(
    budgetStatus(old, "2026-10-01").some((c) => c.configured),
    false,
  );
  assert.equal(summary(old, "2026-10-01").savings, 0);
});
