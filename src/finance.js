// Reference parameters, pending confirmation against current official legislation.
export const referenceTax = {
  inssRate: 7,
  brackets: [
    { from: 0, to: 100000, base: 0, rate: 0 },
    { from: 100000, to: 200000, base: 0, rate: 0.15 },
    { from: 200000, to: 350000, base: 15000, rate: 0.2 },
    { from: 350000, to: 500000, base: 45000, rate: 0.25 },
    { from: 500000, to: null, base: 82500, rate: 0.3 },
  ],
};
export const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export function payroll(salary, tax = referenceTax) {
  const gross = Number(salary);
  if (!Number.isFinite(gross) || gross < 0) throw new Error("Salario inválido");
  const inss = round((gross * tax.inssRate) / 100),
    annual = Math.max(0, (gross - inss) * 12);
  const bracket = tax.brackets.find((b) => b.to === null || annual <= b.to);
  const ir = round(
    (bracket.base + Math.max(0, annual - bracket.from) * bracket.rate) / 12,
  );
  return { gross, inss, ir, net: round(gross - inss - ir) };
}
export function periodIndex(date) {
  const [y, m, d] = date.split("-").map(Number);
  return y * 24 + (m - 1) * 2 + (d > 15 ? 1 : 0);
}
export function periodDate(index) {
  const y = Math.floor(index / 24),
    rem = index % 24;
  return `${y}-${String(Math.floor(rem / 2) + 1).padStart(2, "0")}-${rem % 2 ? "16" : "01"}`;
}
export function installment(debt, period) {
  const i = periodIndex(period) - periodIndex(debt.start);
  if (i < 0 || i >= debt.periods) return 0;
  const normal = Math.floor((debt.amount / debt.periods) * 100) / 100;
  return i === debt.periods - 1
    ? round(debt.amount - normal * (debt.periods - 1))
    : normal;
}
export function summary(data, period) {
  const pay = payroll(data.salary, data.tax),
    deductions = round(
      data.debts.reduce((s, d) => s + installment(d, period), 0),
    );
  const expenses = round(
    data.expenses
      .filter((e) => periodIndex(e.date) === periodIndex(period))
      .reduce((s, e) => s + e.amount, 0),
  );
  const savings = round(
    (data.contributions || [])
      .filter((c) => periodIndex(c.date) === periodIndex(period))
      .reduce((sum, c) => sum + c.amount, 0),
  );
  const second = periodIndex(period) % 2 === 1;
  const half = (n) => (second ? round(n - round(n / 2)) : round(n / 2));
  const periodWithheld = round(half(pay.inss) + half(pay.ir));
  const net = round(half(pay.gross) - periodWithheld);
  return {
    ...pay,
    periodNet: net,
    periodWithheld,
    deductions,
    expenses,
    savings,
    available: round(net - deductions - expenses - savings),
  };
}
export const money = (n) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    maximumFractionDigits: 2,
  }).format(n);
