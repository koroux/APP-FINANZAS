import { periodIndex, round } from "./finance.js";
export const categories = [
  "Alimentación",
  "Transporte",
  "Hogar",
  "Salud",
  "Ocio",
  "Otros",
];
export const categoryColors = [
  "#73956a",
  "#b4bb79",
  "#c6a57e",
  "#86a7b1",
  "#a697b6",
  "#c8cdc0",
];
export function categoryTotals(data, period) {
  return categories.map((category, i) => ({
    category,
    color: categoryColors[i],
    total: round(
      data.expenses
        .filter(
          (e) =>
            e.category === category &&
            periodIndex(e.date) === periodIndex(period),
        )
        .reduce((sum, e) => sum + e.amount, 0),
    ),
  }));
}
export function budgetStatus(data, period) {
  return categoryTotals(data, period).map((item) => {
    const budget = (data.budgets || []).find(
      (b) =>
        b.category === item.category &&
        periodIndex(b.period) === periodIndex(period),
    );
    const limit = budget?.limit || 0;
    return {
      ...item,
      limit,
      remaining: round(limit - item.total),
      percent: limit ? Math.round((item.total / limit) * 100) : 0,
      configured: Boolean(budget),
    };
  });
}
export function savedForGoal(data, goalId) {
  return round(
    (data.contributions || [])
      .filter((c) => c.goalId === goalId)
      .reduce((sum, c) => sum + c.amount, 0),
  );
}
export function periodSavings(data, period) {
  return round(
    (data.contributions || [])
      .filter((c) => periodIndex(c.date) === periodIndex(period))
      .reduce((sum, c) => sum + c.amount, 0),
  );
}
