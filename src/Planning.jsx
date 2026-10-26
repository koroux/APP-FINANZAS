import React, { useState } from "react";
import {
  Target,
  Plus,
  ArrowUpRight,
  PiggyBank,
  Pencil,
  Trash2,
  Check,
  CircleAlert,
  X,
} from "lucide-react";
import { money, periodIndex, round } from "./finance";
import {
  categories,
  categoryTotals,
  budgetStatus,
  savedForGoal,
  periodSavings,
} from "./planning";

export function Insights({ data, period, onPlan }) {
  const totals = categoryTotals(data, period).filter((c) => c.total > 0);
  const total = round(totals.reduce((sum, c) => sum + c.total, 0));
  let angle = 0;
  const stops = totals.map((c) => {
    const start = angle;
    angle += (c.total / total) * 360;
    return `${c.color} ${start}deg ${angle}deg`;
  });
  const warnings = budgetStatus(data, period).filter(
    (b) => b.configured && b.total > b.limit,
  );
  const saved = periodSavings(data, period);
  return (
    <section className="insights-grid">
      <article className="panel spending-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EL MAPA DE TU DINERO</span>
            <h2>¿A dónde se va?</h2>
          </div>
          <span className="subtle-tag">Esta quincena</span>
        </div>
        <div className="spending-body">
          <div
            className="donut"
            role="img"
            aria-label={
              total
                ? `Gastos por categoría, total ${money(total)}`
                : "Sin gastos registrados"
            }
            style={{
              background: total
                ? `conic-gradient(${stops.join(",")})`
                : "#edf1e7",
            }}
          >
            <div>
              <small>Gastos totales</small>
              <strong>{money(total)}</strong>
            </div>
          </div>
          <div className="chart-legend">
            {totals.length ? (
              totals.map((c) => (
                <div key={c.category}>
                  <i style={{ background: c.color }} />
                  <span>{c.category}</span>
                  <b>{Math.round((c.total / total) * 100)}%</b>
                </div>
              ))
            ) : (
              <p>Tus categorías aparecerán cuando registres un gasto.</p>
            )}
          </div>
        </div>
        <button className="text-button" onClick={() => onPlan("budgets")}>
          Organizar mi presupuesto <ArrowUpRight size={16} />
        </button>
      </article>
      <article className="panel savings-preview">
        <div className="panel-heading">
          <span className="record-icon">
            <PiggyBank size={22} />
          </span>
          <span className="subtle-tag">Construye tu futuro</span>
        </div>
        <h2>
          Un poquito hoy.
          <br />
          Más tranquilidad mañana.
        </h2>
        <p>Separa tu ahorro del dinero que puedes gastar.</p>
        <div className="saved-amount">
          <span>Apartado esta quincena</span>
          <strong>{money(saved)}</strong>
        </div>
        {warnings.length > 0 && (
          <div className="budget-alert">
            <CircleAlert size={16} />
            <span>
              {warnings.length}{" "}
              {warnings.length === 1
                ? "categoría superó su límite"
                : "categorías superaron su límite"}
              .
            </span>
          </div>
        )}
        <button className="secondary" onClick={() => onPlan("goals")}>
          Ver mi plan <ArrowUpRight size={16} />
        </button>
      </article>
    </section>
  );
}

export default function Planning({
  data,
  period,
  onChange,
  busy,
  available,
  initialTab = "budgets",
}) {
  const [tab, setTab] = useState(initialTab);
  const [editor, setEditor] = useState(null);
  const budgets = budgetStatus(data, period);
  const goals = data.goals || [];
  const totalLimit = round(budgets.reduce((sum, b) => sum + b.limit, 0));
  const spent = round(budgets.reduce((sum, b) => sum + b.total, 0));
  async function save(next) {
    if (await onChange(next)) setEditor(null);
  }
  function deleteGoal(goal) {
    if (
      !window.confirm(
        "¿Eliminar la meta y devolver todos sus aportes al disponible de las quincenas correspondientes?",
      )
    )
      return;
    save({
      ...data,
      goals: goals.filter((g) => g.id !== goal.id),
      contributions: (data.contributions || []).filter(
        (c) => c.goalId !== goal.id,
      ),
    });
  }
  return (
    <div className="planning">
      <div className="plan-tabs" role="tablist" aria-label="Tu planificación">
        <button
          role="tab"
          aria-selected={tab === "budgets"}
          onClick={() => {
            setTab("budgets");
            setEditor(null);
          }}
        >
          <Target size={17} /> Presupuesto
        </button>
        <button
          role="tab"
          aria-selected={tab === "goals"}
          onClick={() => {
            setTab("goals");
            setEditor(null);
          }}
        >
          <PiggyBank size={17} /> Metas de ahorro
        </button>
      </div>
      <div
        role="tabpanel"
        aria-label={tab === "budgets" ? "Presupuesto" : "Metas de ahorro"}
      >
        {tab === "budgets" ? (
          <>
            <section className="plan-intro">
              <div>
                <span className="eyebrow">TÚ PONES LOS LÍMITES</span>
                <h2>Dale un destino a tu dinero.</h2>
                <p>
                  Define cuánto quieres gastar en cada categoría esta quincena.
                </p>
              </div>
              <div className="plan-summary">
                <small>Presupuesto asignado</small>
                <strong>{money(totalLimit)}</strong>
                <span>Gastado: {money(spent)}</span>
              </div>
            </section>
            <div className="budget-grid">
              {budgets.map((b) => (
                <article
                  key={b.category}
                  className={`panel budget-card ${b.configured && b.remaining < 0 ? "over-budget" : ""}`}
                >
                  <div className="panel-heading">
                    <span
                      className="category-badge"
                      style={{ background: b.color + "22", color: b.color }}
                    >
                      <span style={{ background: b.color }} />
                      {b.category}
                    </span>
                    <button
                      className="icon"
                      aria-label={"Ajustar presupuesto de " + b.category}
                      onClick={() => setEditor({ type: "budget", ...b })}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <div className="budget-value">
                    <strong>{money(b.total)}</strong>
                    <small>
                      {b.configured
                        ? `de ${money(b.limit)}`
                        : "Sin límite definido"}
                    </small>
                  </div>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.min(100, b.percent)}%`,
                        background:
                          b.remaining < 0 && b.configured ? "#c47c67" : b.color,
                      }}
                    />
                  </div>
                  <div className="budget-caption">
                    <span>
                      {!b.configured
                        ? "Tú decides tu presupuesto"
                        : b.remaining < 0
                          ? `Excedido por ${money(-b.remaining)}`
                          : `Te quedan ${money(b.remaining)}`}
                    </span>
                    {b.configured && <b>{b.percent}%</b>}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <>
            <section className="plan-intro">
              <div>
                <span className="eyebrow">LO QUE QUIERES, PASO A PASO</span>
                <h2>Haz espacio para tus metas.</h2>
                <p>
                  Tus aportes se apartan del disponible de la quincena elegida.
                </p>
              </div>
              <button
                className="primary"
                onClick={() => setEditor({ type: "goal" })}
              >
                <Plus size={17} /> Nueva meta
              </button>
            </section>
            <div className="goals-grid">
              {goals.map((g) => {
                const saved = savedForGoal(data, g.id),
                  percent = Math.min(100, Math.round((saved / g.target) * 100));
                return (
                  <article className="panel goal-card" key={g.id}>
                    <div className="panel-heading">
                      <span className="goal-symbol">
                        <Target size={23} />
                      </span>
                      <button
                        className="icon muted"
                        aria-label={"Eliminar meta " + g.name}
                        onClick={() => deleteGoal(g)}
                        disabled={busy}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h2>{g.name}</h2>
                    <div className="goal-value">
                      <strong>{money(saved)}</strong>
                      <span>de {money(g.target)}</span>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <div className="budget-caption">
                      <span>
                        {saved >= g.target
                          ? "¡Meta alcanzada!"
                          : `Faltan ${money(round(g.target - saved))}`}
                      </span>
                      <b>{percent}%</b>
                    </div>
                    <button
                      className="secondary full"
                      disabled={saved >= g.target}
                      onClick={() =>
                        setEditor({ type: "contribution", goal: g })
                      }
                    >
                      {saved >= g.target ? (
                        <Check size={16} />
                      ) : (
                        <Plus size={16} />
                      )}{" "}
                      {saved >= g.target ? "Lo lograste" : "Apartar dinero"}
                    </button>
                  </article>
                );
              })}
              <button
                className="new-goal"
                onClick={() => setEditor({ type: "goal" })}
              >
                <span className="empty-icon">
                  <Plus size={24} />
                </span>
                <strong>
                  {goals.length ? "Tu próxima meta" : "¿Qué quieres lograr?"}
                </strong>
                <span>
                  Un fondo de emergencia, un viaje,
                  <br />o algo que llevas tiempo imaginando.
                </span>
              </button>
            </div>
            {(data.contributions || []).length > 0 && (
              <section className="panel contribution-history">
                <div className="panel-heading">
                  <div>
                    <h2>Tu ahorro, paso a paso</h2>
                    <p>Aportes registrados en esta quincena.</p>
                  </div>
                </div>
                {data.contributions
                  .filter((c) => periodIndex(c.date) === periodIndex(period))
                  .map((c) => (
                    <div className="record" key={c.id}>
                      <span className="record-icon">
                        <PiggyBank size={18} />
                      </span>
                      <div>
                        <strong>
                          {goals.find((g) => g.id === c.goalId)?.name || "Meta"}
                        </strong>
                        <small>{c.date}</small>
                      </div>
                      <b>{money(c.amount)}</b>
                      <button
                        className="icon muted"
                        disabled={busy}
                        aria-label={"Revertir aporte " + c.id}
                        onClick={() => {
                          if (
                            window.confirm(
                              "¿Revertir este aporte y devolverlo a tu disponible?",
                            )
                          )
                            save({
                              ...data,
                              contributions: data.contributions.filter(
                                (x) => x.id !== c.id,
                              ),
                            });
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                {!data.contributions.some(
                  (c) => periodIndex(c.date) === periodIndex(period),
                ) && <p>No hay aportes en esta quincena.</p>}
              </section>
            )}
          </>
        )}
      </div>
      {editor && (
        <section
          className="panel plan-editor"
          key={editor.type + (editor.category || editor.goal?.id || "")}
        >
          <div className="panel-heading">
            <h2>
              {editor.type === "budget"
                ? `Presupuesto · ${editor.category}`
                : editor.type === "goal"
                  ? "Tu próxima meta"
                  : `Aportar a ${editor.goal.name}`}
            </h2>
            <button
              className="icon"
              aria-label="Cerrar formulario de planificación"
              onClick={() => setEditor(null)}
            >
              <X size={18} />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (editor.type === "budget") {
                const rest = (data.budgets || []).filter(
                  (b) =>
                    !(
                      b.category === editor.category &&
                      periodIndex(b.period) === periodIndex(period)
                    ),
                );
                const limit = Number(f.get("amount"));
                save({
                  ...data,
                  budgets:
                    limit > 0
                      ? [
                          ...rest,
                          {
                            id: crypto.randomUUID(),
                            category: editor.category,
                            period,
                            limit,
                          },
                        ]
                      : rest,
                });
              }
              if (editor.type === "goal")
                save({
                  ...data,
                  goals: [
                    ...goals,
                    {
                      id: crypto.randomUUID(),
                      name: f.get("name").trim(),
                      target: Number(f.get("amount")),
                    },
                  ],
                });
              if (editor.type === "contribution")
                save({
                  ...data,
                  contributions: [
                    ...(data.contributions || []),
                    {
                      id: crypto.randomUUID(),
                      goalId: editor.goal.id,
                      amount: Number(f.get("amount")),
                      date: period,
                    },
                  ],
                });
            }}
          >
            {editor.type === "goal" && (
              <label>
                Nombre de tu meta
                <input
                  name="name"
                  placeholder="Ej. Fondo de emergencia"
                  maxLength="80"
                  required
                  autoFocus
                />
              </label>
            )}
            <label>
              {editor.type === "budget"
                ? "Límite de gasto para esta quincena (C$)"
                : editor.type === "goal"
                  ? "¿Cuánto quieres reunir? (C$)"
                  : "Monto a apartar esta quincena (C$)"}
              <input
                name="amount"
                type="number"
                step="0.01"
                min={editor.type === "budget" ? "0" : "0.01"}
                max={
                  editor.type === "contribution"
                    ? round(
                        editor.goal.target - savedForGoal(data, editor.goal.id),
                      )
                    : 100000000
                }
                defaultValue={
                  editor.type === "budget" ? editor.limit : undefined
                }
                required
                autoFocus={editor.type !== "goal"}
              />
            </label>
            <p className="fine">
              {editor.type === "budget"
                ? "El presupuesto es un límite orientativo: no descuenta dinero de tu disponible. Pon 0 para eliminar el límite."
                : editor.type === "contribution"
                  ? `Disponible antes de este aporte: ${money(available)}. Se registra en la quincena seleccionada. Apartar más de lo disponible dará un saldo negativo. No registres este mismo aporte como gasto.`
                  : "La meta no descuenta dinero hasta que registres un aporte."}
            </p>
            <button className="primary" disabled={busy}>
              {busy
                ? "Guardando…"
                : editor.type === "contribution"
                  ? "Confirmar aporte"
                  : "Guardar"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
