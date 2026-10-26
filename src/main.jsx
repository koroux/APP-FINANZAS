import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Wallet,
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  LogOut,
  ShieldCheck,
  Cloud,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  Target,
  PiggyBank,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  summary,
  money,
  installment,
  periodIndex,
  periodDate,
} from "./finance";
import {
  configured,
  supabase,
  readLocal,
  saveLocal,
  fetchCloud,
  saveCloud,
} from "./storage";
import Planning, { Insights } from "./Planning";
import "./style.css";
const today = new Date();
const initialPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getDate() > 15 ? "16" : "01"}`;
const categories = [
  "Alimentación",
  "Transporte",
  "Hogar",
  "Salud",
  "Ocio",
  "Otros",
];
const nav = [
  ["overview", "Resumen", LayoutDashboard],
  ["expenses", "Gastos", ReceiptText],
  ["debts", "Deudas", CreditCard],
  ["plan", "Mi plan", Target],
  ["settings", "Configuración", Settings],
];
function App() {
  const [search, setSearch] = useState(""),
    [categoryFilter, setCategoryFilter] = useState("Todas"),
    [planningTab, setPlanningTab] = useState("budgets");
  const [data, setData] = useState(readLocal),
    [page, setPage] = useState("overview"),
    [period, setPeriod] = useState(initialPeriod),
    [modal, setModal] = useState(null),
    [session, setSession] = useState(null),
    [ready, setReady] = useState(!configured),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!modal) return;
    const openedDialog = document.querySelector("[role=dialog]");
    (
      openedDialog?.querySelector("input, select") ||
      openedDialog?.querySelector("button")
    )?.focus();
    const handler = (e) => {
      const dialog = document.querySelector("[role=dialog]");
      if (!dialog) return;
      if (e.key === "Escape") {
        setModal(null);
        return;
      }
      if (e.key === "Tab") {
        const items = [
          ...dialog.querySelectorAll(
            "button:not(:disabled), input, select, a[href]",
          ),
        ];
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modal]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setNotice(error.message);
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setReady(!s);
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchCloud(session.user.id)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setReady(true);
        }
      })
      .catch((e) => setNotice(`No se pudieron cargar tus datos: ${e.message}`));
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);
  async function commit(next) {
    setBusy(true);
    try {
      if (session) await saveCloud(session.user.id, next);
      else saveLocal(next);
      setData(next);
      setModal(null);
      setNotice("Cambios guardados");
      return true;
    } catch (e) {
      setNotice(`No se guardaron los cambios: ${e.message}`);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const s = summary(data, period),
    active = data.debts.filter((d) => installment(d, period) > 0);
  const label = new Date(`${period}T12:00:00`).toLocaleDateString("es-NI", {
    month: "long",
    year: "numeric",
  });
  function periodControl() {
    return (
      <div className="period">
        <button
          aria-label="Quincena anterior"
          onClick={() => setPeriod(periodDate(periodIndex(period) - 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <CalendarDays size={15} />
        <span>
          {period.endsWith("01") ? "1.ª" : "2.ª"} quincena · {label}
        </span>
        <button
          aria-label="Quincena siguiente"
          onClick={() => setPeriod(periodDate(periodIndex(period) + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }
  const remove = (type, id) => {
    if (window.confirm("¿Eliminar este registro?"))
      commit({ ...data, [type]: data[type].filter((x) => x.id !== id) });
  };
  const periodExpenses = data.expenses.filter(
    (e) => periodIndex(e.date) === periodIndex(period),
  );
  const filteredExpenses = periodExpenses.filter(
    (e) =>
      (categoryFilter === "Todas" || e.category === categoryFilter) &&
      `${e.name} ${e.category}`
        .toLocaleLowerCase("es")
        .includes(search.trim().toLocaleLowerCase("es")),
  );
  function openPlan(tab = "budgets") {
    setPlanningTab(tab);
    setPage("plan");
  }
  const expenseRows = (filtered = false) =>
    (filtered ? filteredExpenses : periodExpenses)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => (
        <div className="record" key={e.id}>
          <span className={`record-icon c${categories.indexOf(e.category)}`}>
            <ReceiptText size={19} />
          </span>
          <div>
            <strong>{e.name}</strong>
            <small>
              {e.category} ·{" "}
              {new Date(e.date + "T12:00:00").toLocaleDateString("es-NI", {
                day: "numeric",
                month: "short",
              })}
            </small>
          </div>
          <b>−{money(e.amount)}</b>
          <button
            className="icon muted"
            aria-label={"Eliminar " + e.name}
            disabled={busy}
            onClick={() => remove("expenses", e.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ));
  return (
    <div className="app">
      <aside>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("overview");
          }}
        >
          <span className="brand-icon">
            q<span />
          </span>
          quincena<span className="brand-dot">.</span>
        </a>
        <p className="nav-label">TU ESPACIO PERSONAL</p>
        <nav>
          {nav.map(([id, name, Icon]) => (
            <button
              key={id}
              className={page === id ? "selected" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={20} />
              {name}
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip">
            <ShieldCheck size={24} />
            <strong>Tu tranquilidad cuenta</strong>
            <p>
              Un plan para cada quincena.
              <br />
              Más claridad para tu futuro.
            </p>
          </div>
          <button className="profile" onClick={() => setModal("account")}>
            <span className="avatar">{session ? "YO" : "Q"}</span>
            <span>
              <strong>Mi espacio</strong>
              <small>
                {session
                  ? "Cuenta sincronizada"
                  : "Modo local · sin sincronizar"}
              </small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <main>
        <header>
          <span className="breadcrumb">
            Mi espacio <span>/</span> {nav.find((n) => n[0] === page)[1]}
          </span>
          <button className="sync" onClick={() => setModal("account")}>
            <Cloud size={16} />
            {session ? "En la nube" : "Conectar cuenta"}
            <span className={session ? "dot online" : "dot"} />
          </button>
        </header>
        {!ready ? (
          <div className="empty">Cargando tus datos de forma segura…</div>
        ) : (
          <div className="content">
            <div className="heading">
              <div>
                <div className="eyebrow">
                  UN POCO DE ORDEN, MUCHA TRANQUILIDAD
                </div>
                <h1>
                  {page === "overview"
                    ? "Tu dinero, claro."
                    : page === "expenses"
                      ? "Cada gasto cuenta."
                      : page === "debts"
                        ? "Un paso más cerca."
                        : page === "plan"
                          ? "Hoy lo planeas. Mañana lo logras."
                          : "A tu medida."}
                </h1>
                <p>
                  {page === "overview"
                    ? "Esto es lo que tienes y lo que viene en tu quincena."
                    : page === "expenses"
                      ? "Registra tus movimientos y entiende a dónde va tu dinero."
                      : page === "debts"
                        ? "Organiza tus compromisos, una quincena a la vez."
                        : page === "plan"
                          ? "Pon límites a tus gastos y haz espacio para lo que quieres."
                          : "Personaliza tu salario y las reglas de tus estimaciones."}
                </p>
              </div>
              <button
                className="primary"
                onClick={() => setModal(page === "debts" ? "debt" : "expense")}
              >
                <Plus size={18} />
                {page === "debts" ? "Nueva deuda" : "Registrar gasto"}
              </button>
            </div>
            <div className="toolbar">
              {periodControl()}
              <span className="pill">
                <span />
                NIO · Córdoba nicaragüense
              </span>
            </div>
            {page === "overview" && (
              <>
                {!data.salary && (
                  <div className="welcome-strip">
                    <div>
                      <span className="step-number">01</span>
                      <span>
                        <strong>Empecemos por lo que recibes.</strong>
                        <small>
                          Configura tu salario para ver tu disponible estimado.
                        </small>
                      </span>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage("settings")}
                    >
                      Configurar <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <section className="hero-grid">
                  <div className="balance">
                    <div className="balance-top">
                      <span>
                        <Wallet size={18} /> DISPONIBLE ESTA QUINCENA
                      </span>
                      <span className="mini-tag">Tu panorama</span>
                    </div>
                    <div className="balance-amount">{money(s.available)}</div>
                    <p>Después de nómina, cuotas, gastos y ahorro apartado.</p>
                    <div className="balance-bottom">
                      <span>
                        <span className="light-dot" />
                        {s.available < 0
                          ? "Tus compromisos superan tu ingreso"
                          : data.salary
                            ? "Vas construyendo tu tranquilidad"
                            : "Comienza configurando tu salario"}
                      </span>
                      <button
                        aria-label="Ver configuración de salario"
                        onClick={() => setPage("settings")}
                      >
                        <ArrowUpRight size={19} />
                      </button>
                    </div>
                  </div>
                  <div className="income-card">
                    <div className="card-icon">
                      <TrendingUp size={22} />
                    </div>
                    <span>Ingreso neto quincenal</span>
                    <strong>{money(s.periodNet)}</strong>
                    <small>Salario bruto mensual: {money(data.salary)}</small>
                    <button
                      className="text-button"
                      onClick={() => setPage("settings")}
                    >
                      Ver cálculo de salario <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <div className="quick-actions" aria-label="Acciones rápidas">
                  <button onClick={() => setModal("expense")}>
                    <span>
                      <Plus size={20} />
                    </span>
                    Nuevo gasto
                  </button>
                  <button onClick={() => setModal("debt")}>
                    <span>
                      <CreditCard size={20} />
                    </span>
                    Programar cuota
                  </button>
                  <button onClick={() => openPlan("goals")}>
                    <span>
                      <PiggyBank size={20} />
                    </span>
                    Apartar ahorro
                  </button>
                  <button onClick={() => openPlan("budgets")}>
                    <span>
                      <Target size={20} />
                    </span>
                    Mi presupuesto
                  </button>
                </div>
                <section className="stat-grid">
                  <article>
                    <span className="stat-icon pink">
                      <ReceiptText size={20} />
                    </span>
                    <div>
                      <small>Gastos de la quincena</small>
                      <strong>{money(s.expenses)}</strong>
                      <span>
                        {
                          data.expenses.filter(
                            (e) => periodIndex(e.date) === periodIndex(period),
                          ).length
                        }{" "}
                        movimientos registrados
                      </span>
                    </div>
                  </article>
                  <article>
                    <span className="stat-icon sand">
                      <CreditCard size={20} />
                    </span>
                    <div>
                      <small>Cuotas y deducciones</small>
                      <strong>{money(s.deductions)}</strong>
                      <span>{active.length} compromisos esta quincena</span>
                    </div>
                  </article>
                  <article>
                    <span className="stat-icon blue">
                      <ShieldCheck size={20} />
                    </span>
                    <div>
                      <small>INSS + IR estimado</small>
                      <strong>{money(s.periodWithheld)}</strong>
                      <span>Descuento quincenal de nómina</span>
                    </div>
                  </article>
                </section>
                <Insights data={data} period={period} onPlan={openPlan} />
                <section className="two-cols">
                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Últimos movimientos</h2>
                        <p>Los pequeños gastos también cuentan.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setPage("expenses")}
                      >
                        Ver todos <ArrowUpRight size={16} />
                      </button>
                    </div>
                    {expenseRows().slice(0, 4)}
                    {!expenseRows().length && (
                      <Empty
                        icon={ReceiptText}
                        title="Tu historia empieza aquí"
                        text="Registra tu primer gasto y lleva el control de tu quincena."
                        action={() => setModal("expense")}
                        label="Registrar un gasto"
                      />
                    )}
                  </article>
                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Próximos compromisos</h2>
                        <p>Sin sorpresas al llegar la quincena.</p>
                      </div>
                      <CalendarDays size={20} />
                    </div>
                    {active.slice(0, 3).map((d) => (
                      <div className="debt-mini" key={d.id}>
                        <div>
                          <span className="record-icon sand">
                            <CreditCard size={18} />
                          </span>
                          <strong>{d.name}</strong>
                          <b>{money(installment(d, period))}</b>
                        </div>
                        <div className="progress">
                          <span
                            style={{
                              width: `${((periodIndex(period) - periodIndex(d.start) + 1) / d.periods) * 100}%`,
                            }}
                          />
                        </div>
                        <small>
                          Cuota {periodIndex(period) - periodIndex(d.start) + 1}{" "}
                          de {d.periods} ·{" "}
                          {d.periods === 1
                            ? "Pago único"
                            : "Descuento quincenal"}
                        </small>
                      </div>
                    ))}
                    {!active.length && (
                      <Empty
                        icon={CalendarDays}
                        title="Una quincena sin cuotas"
                        text="Agrega tus deudas para anticipar cada compromiso."
                        action={() => setModal("debt")}
                        label="Programar una deuda"
                      />
                    )}
                  </article>
                </section>
                <section className="forecast panel">
                  <div>
                    <span className="eyebrow">MIRA UN POCO MÁS ALLÁ</span>
                    <h2>Tus próximas quincenas</h2>
                    <p>
                      Ingreso estimado menos cuotas programadas. No incluye
                      gastos futuros.
                    </p>
                  </div>
                  <div className="forecast-items">
                    {[1, 2, 3].map((offset) => {
                      const p = periodDate(periodIndex(period) + offset),
                        f = summary(data, p);
                      return (
                        <div key={p}>
                          <small>
                            {new Date(p + "T12:00:00").toLocaleDateString(
                              "es-NI",
                              { month: "short" },
                            )}{" "}
                            · {p.endsWith("01") ? "1.ª" : "2.ª"} quincena
                          </small>
                          <strong
                            className={
                              f.periodNet - f.deductions < 0 ? "negative" : ""
                            }
                          >
                            {money(f.periodNet - f.deductions)}
                          </strong>
                          <span>Cuotas: {money(f.deductions)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
            {page === "expenses" && (
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Movimientos de esta quincena</h2>
                    <p>
                      {filteredExpenses.length} movimientos ·{" "}
                      {money(
                        filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
                      )}
                    </p>
                  </div>
                </div>
                <div className="expense-filters">
                  <label className="search-box">
                    <Search size={17} />
                    <input
                      aria-label="Buscar movimientos"
                      placeholder="Buscar un movimiento…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <label className="category-filter">
                    <SlidersHorizontal size={16} />
                    <select
                      aria-label="Filtrar por categoría"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option>Todas</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                {expenseRows(true)}
                {!filteredExpenses.length &&
                  (periodExpenses.length ? (
                    <div className="empty">
                      <h3>No encontramos ese movimiento</h3>
                      <p>Prueba otro nombre o cambia la categoría.</p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSearch("");
                          setCategoryFilter("Todas");
                        }}
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  ) : (
                    <Empty
                      icon={ReceiptText}
                      title="Aún no hay movimientos"
                      text="Tu registro de gastos aparecerá aquí."
                      action={() => setModal("expense")}
                      label="Agregar gasto"
                    />
                  ))}
              </section>
            )}
            {page === "plan" && (
              <Planning
                key={period}
                data={data}
                period={period}
                onChange={commit}
                busy={busy}
                available={s.available}
                initialTab={planningTab}
              />
            )}
            {page === "debts" && (
              <section className="debt-grid">
                {data.debts.map((d) => {
                  const elapsed = Math.max(
                    0,
                    Math.min(
                      d.periods,
                      periodIndex(period) - periodIndex(d.start),
                    ),
                  );
                  return (
                    <article className="panel debt-card" key={d.id}>
                      <div className="panel-heading">
                        <span className="record-icon sand">
                          <CreditCard />
                        </span>
                        <button
                          className="icon"
                          aria-label={"Eliminar " + d.name}
                          disabled={busy}
                          onClick={() => remove("debts", d.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <h2>{d.name}</h2>
                      <small>Monto total programado</small>
                      <h3>{money(d.amount)}</h3>
                      <div className="progress">
                        <span
                          style={{ width: `${(elapsed / d.periods) * 100}%` }}
                        />
                      </div>
                      <p>
                        {d.periods} {d.periods === 1 ? "quincena" : "quincenas"}{" "}
                        · Inicio {d.start}
                      </p>
                      <div className="debt-footer">
                        <span>En esta quincena</span>
                        <strong>{money(installment(d, period))}</strong>
                      </div>
                      <small>
                        Calendario programado; no confirma pagos realizados.
                      </small>
                    </article>
                  );
                })}
                {!data.debts.length && (
                  <div className="panel">
                    <Empty
                      icon={CreditCard}
                      title="Cada deuda, con un plan"
                      text="Programa un pago único o divídelo en varias quincenas."
                      action={() => setModal("debt")}
                      label="Crear un plan"
                    />
                  </div>
                )}
              </section>
            )}
            {page === "settings" && (
              <div className="settings-grid">
                <section className="panel">
                  <h2>Tu salario</h2>
                  <p>Salario mensual fijo, dividido en dos quincenas.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      commit({
                        ...data,
                        salary: Number(f.get("salary")),
                        tax: { ...data.tax, inssRate: Number(f.get("inss")) },
                      });
                    }}
                  >
                    <label>
                      Salario bruto mensual (C$)
                      <input
                        name="salary"
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        defaultValue={data.salary}
                        required
                      />
                    </label>
                    <label>
                      Aporte laboral INSS (%)
                      <input
                        name="inss"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={data.tax.inssRate}
                        required
                      />
                    </label>
                    <button className="primary" disabled={busy}>
                      Guardar salario
                    </button>
                  </form>
                  <div className="breakdown">
                    <div>
                      <span>INSS mensual estimado</span>
                      <strong>{money(s.inss)}</strong>
                    </div>
                    <div>
                      <span>IR mensual estimado</span>
                      <strong>{money(s.ir)}</strong>
                    </div>
                    <div>
                      <span>Neto mensual estimado</span>
                      <strong>{money(s.net)}</strong>
                    </div>
                    <div>
                      <span>Neto por quincena</span>
                      <strong>{money(s.periodNet)}</strong>
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <h2>Reglas de referencia · Nicaragua</h2>
                  <p className="warning">
                    Pendientes de verificación de vigencia. Estimación para
                    salario fijo bajo régimen general; no sustituye tu
                    comprobante de nómina.
                  </p>
                  <p>
                    INSS laboral de referencia: 7 %. IR: se anualiza el salario
                    después del INSS, se aplica la tabla progresiva y se divide
                    entre 12. La retención mensual se reparte entre dos
                    quincenas.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Desde C$/año</th>
                          <th>Hasta</th>
                          <th>Base C$</th>
                          <th>Exceso %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.tax.brackets.map((b) => (
                          <tr key={b.from}>
                            <td>{b.from.toLocaleString()}</td>
                            <td>{b.to?.toLocaleString() || "En adelante"}</td>
                            <td>{b.base.toLocaleString()}</td>
                            <td>{b.rate * 100}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="fine">
                    Referencias por confirmar: Ley 822 de Concertación
                    Tributaria, art. 23; reforma al Reglamento de la Ley de
                    Seguridad Social (Decreto 06-2019). No incluye bonos,
                    ingresos variables, ajustes anuales ni regímenes especiales.
                    Las deudas reducen tu disponible, no la base imponible.
                  </p>
                  <button className="secondary" onClick={() => setModal("tax")}>
                    Editar tabla de referencia
                  </button>
                </section>
                <section className="panel">
                  <h2>Tus datos, contigo</h2>
                  <p>
                    {session
                      ? "Tus cambios se guardan en tu cuenta de Supabase."
                      : "Modo local: los datos permanecen en este navegador. Conecta tu cuenta para usarlos en otros dispositivos."}
                  </p>
                  <div className="actions">
                    <button
                      className="secondary"
                      onClick={() => setModal("account")}
                    >
                      <Cloud size={17} /> Mi cuenta
                    </button>
                  </div>
                </section>
              </div>
            )}
            <div className="estimate-note">
              <ShieldCheck size={15} />
              <span>
                INSS e IR son estimaciones con parámetros de referencia.
                Vigencia legal pendiente de verificar.{" "}
                <button onClick={() => setPage("settings")}>
                  Revisar cálculo
                </button>
              </span>
            </div>
            <footer>
              <span className="footer-brand">quincena.</span>
              <span>Hecho para tu tranquilidad · Nicaragua</span>
              <span>Estimaciones en córdobas · C$</span>
            </footer>
          </div>
        )}
      </main>
      <nav className="mobile-nav">
        {nav.map(([id, name, Icon]) => (
          <button
            key={id}
            className={page === id ? "selected" : ""}
            onClick={() => setPage(id)}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setModal(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="close icon"
              aria-label="Cerrar"
              onClick={() => setModal(null)}
            >
              <X />
            </button>
            <h2 id="modal-title">
              {modal === "expense"
                ? "Un gasto, bajo control"
                : modal === "debt"
                  ? "Dale un plan a tu deuda"
                  : modal === "account"
                    ? "Tu espacio, donde estés"
                    : "Tabla de IR de referencia"}
            </h2>
            {modal === "expense" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  commit({
                    ...data,
                    expenses: [
                      ...data.expenses,
                      {
                        id: crypto.randomUUID(),
                        name: f.get("name").trim(),
                        amount: Number(f.get("amount")),
                        date: f.get("date"),
                        category: f.get("category"),
                      },
                    ],
                  });
                }}
              >
                <label>
                  ¿En qué gastaste?
                  <input
                    name="name"
                    placeholder="Ej. Compras del supermercado"
                    required
                    maxLength="100"
                    autoFocus
                  />
                </label>
                <label>
                  Monto (C$)
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    max="100000000"
                    step="0.01"
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Fecha
                    <input
                      name="date"
                      type="date"
                      defaultValue={period}
                      required
                    />
                  </label>
                  <label>
                    Categoría
                    <select name="category">
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <button className="primary full" disabled={busy}>
                  {busy ? "Guardando…" : "Guardar gasto"}
                </button>
              </form>
            )}
            {modal === "debt" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  commit({
                    ...data,
                    debts: [
                      ...data.debts,
                      {
                        id: crypto.randomUUID(),
                        name: f.get("name").trim(),
                        amount: Number(f.get("amount")),
                        start: f.get("start"),
                        periods: Number(f.get("periods")),
                      },
                    ],
                  });
                }}
              >
                <label>
                  Nombre de la deuda o deducción
                  <input
                    name="name"
                    placeholder="Ej. Préstamo personal"
                    required
                    maxLength="100"
                    autoFocus
                  />
                </label>
                <label>
                  Total pendiente a repartir (C$)
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    max="100000000"
                    step="0.01"
                    required
                  />
                </label>
                <div className="form-row">
                  <label>
                    Primera quincena
                    <input
                      name="start"
                      type="date"
                      defaultValue={period}
                      required
                    />
                  </label>
                  <label>
                    Número de quincenas
                    <input
                      name="periods"
                      type="number"
                      min="1"
                      max="600"
                      defaultValue="1"
                      required
                    />
                  </label>
                </div>
                <p className="fine">
                  1 quincena = un solo descuento. El monto se divide en cuotas
                  iguales; la última ajusta centavos. Incluye en el total los
                  intereses ya pactados. Fechas del 1 al 15 corresponden a la
                  primera quincena.
                </p>
                <button className="primary full" disabled={busy}>
                  {busy ? "Guardando…" : "Programar deducción"}
                </button>
              </form>
            )}
            {modal === "account" && (
              <>
                <p>
                  Accede a tu información desde tu celular, tablet o
                  computadora.
                </p>
                {!configured ? (
                  <div className="warning">
                    Sincronización pendiente de conectar Supabase. Puedes usar
                    el modo local mientras se configura la base de datos. No hay
                    datos enviados a un servidor.
                  </div>
                ) : session ? (
                  <>
                    <p>Sesión: {session.user.email}</p>
                    <button
                      className="secondary"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setData(readLocal());
                        setModal(null);
                      }}
                    >
                      <LogOut size={17} /> Cerrar sesión
                    </button>
                  </>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      const email = new FormData(e.currentTarget).get("email");
                      const { error } = await supabase.auth.signInWithOtp({
                        email,
                        options: { emailRedirectTo: window.location.origin },
                      });
                      setBusy(false);
                      setNotice(
                        error
                          ? error.message
                          : "Revisa tu correo para entrar con un enlace seguro.",
                      );
                    }}
                  >
                    <label>
                      Tu correo electrónico
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="tu@correo.com"
                        required
                      />
                    </label>
                    <button className="primary full" disabled={busy}>
                      Enviar enlace de acceso
                    </button>
                    <p className="fine">
                      Tu cuenta inicia con datos independientes. Los registros
                      del modo local no se suben automáticamente.
                    </p>
                  </form>
                )}
              </>
            )}
            {modal === "tax" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const brackets = data.tax.brackets.map((b, i) => ({
                    ...b,
                    base: Number(f.get("base" + i)),
                    rate: Number(f.get("rate" + i)) / 100,
                  }));
                  commit({ ...data, tax: { ...data.tax, brackets } });
                }}
              >
                <p className="warning">
                  Edita solo con normativa vigente contrastada. Los límites de
                  los tramos se mantienen.
                </p>
                {data.tax.brackets.map((b, i) => (
                  <div key={b.from}>
                    <strong>Desde C$ {b.from.toLocaleString()} al año</strong>
                    <div className="form-row">
                      <label>
                        Impuesto base
                        <input
                          name={"base" + i}
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={b.base}
                          required
                        />
                      </label>
                      <label>
                        Tasa marginal %
                        <input
                          name={"rate" + i}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={b.rate * 100}
                          required
                        />
                      </label>
                    </div>
                  </div>
                ))}
                <button className="primary full" disabled={busy}>
                  Guardar parámetros
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Empty({ icon: Icon, title, text, action, label }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={action}>
        <Plus size={16} />
        {label}
      </button>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
