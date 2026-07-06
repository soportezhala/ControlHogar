// Pega aquí la URL publicada de tu Web App de Apps Script.
// Ejemplo: "https://script.google.com/macros/s/XXXX/exec"
const apiBaseUrl = "https://script.google.com/macros/s/AKfycbzuLmVvn933jcf_GFdJcGs5PCVcbAt5xjgiLJPkXN-WHi8GmbLnxvj_2zojvs5pwITa/exec";

const defaultCategories = [
  { value: "Nomina", label: "Nómina" },
  { value: "Horas extra", label: "Horas extra" },
  { value: "Venta", label: "Venta" },
  { value: "Reembolso", label: "Reembolso" },
  { value: "Plataformas", label: "Plataformas / Clickworker" },
  { value: "Otro", label: "Otro" },
];

const defaultAccounts = [
  { value: "Efectivo", label: "Efectivo" },
  { value: "BBVA", label: "BBVA" },
  { value: "Banamex", label: "Banamex" },
  { value: "Mercado Pago", label: "Mercado Pago" },
  { value: "Caja de ahorro", label: "Caja de ahorro" },
];

async function loadDashboard() {
  const fallback = {
    availableBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    currentSavings: 0,
    recentMovements: [],
    cards: [],
    loans: [],
    reminders: [],
    remindersTodayCount: 0,
  };

  try {
    if (!apiBaseUrl) {
      renderDashboard(fallback);
      return;
    }

    const response = await fetch(`${apiBaseUrl}?route=dashboard`);
    if (!response.ok) throw new Error("No se pudo cargar el dashboard");
    const data = await response.json();
    renderDashboard(data);
  } catch {
    renderDashboard(fallback);
  }
}

async function loadBootstrapData() {
  if (!apiBaseUrl) {
    populateSelect("categoria", defaultCategories, "Selecciona una categoría");
    populateSelect("cuenta", defaultAccounts, "Selecciona una cuenta");
    populateSelect("expense_categoria", defaultCategories, "Selecciona una categoría");
    populateSelect("expense_cuenta", defaultAccounts, "Selecciona una cuenta");
    return;
  }

  try {
    const response = await fetch(`${apiBaseUrl}?route=bootstrap`);
    if (!response.ok) throw new Error("No se pudo cargar la configuración inicial");
    const data = await response.json();

    populateSelect("categoria", mapItems(data.categories, defaultCategories), "Selecciona una categoría");
    populateSelect("cuenta", mapItems(data.accounts, defaultAccounts), "Selecciona una cuenta");
    populateSelect("expense_categoria", mapItems(data.expenseCategories, defaultCategories), "Selecciona una categoría");
    populateSelect("expense_cuenta", mapItems(data.accounts, defaultAccounts), "Selecciona una cuenta");
  } catch {
    populateSelect("categoria", defaultCategories, "Selecciona una categoría");
    populateSelect("cuenta", defaultAccounts, "Selecciona una cuenta");
    populateSelect("expense_categoria", defaultCategories, "Selecciona una categoría");
    populateSelect("expense_cuenta", defaultAccounts, "Selecciona una cuenta");
  }
}

async function postApiJson(route, payload) {
  const response = await fetch(`${apiBaseUrl}?route=${route}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let result = null;

  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(rawText || "La respuesta del servidor no fue válida.");
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "No se pudo completar la solicitud.");
  }

  return result;
}

function initIncomeForm() {
  const form = document.getElementById("income-form");
  const feedback = document.getElementById("income-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar ingresos.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      fecha: formData.get("fecha"),
      concepto: String(formData.get("concepto") || "").trim(),
      categoria: String(formData.get("categoria") || "").trim(),
      cuenta: String(formData.get("cuenta") || "").trim(),
      monto: Number(formData.get("monto") || 0),
      comentarios: String(formData.get("comentarios") || "").trim(),
    };

    if (!payload.fecha || !payload.concepto || !payload.categoria || !payload.cuenta || !payload.monto) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando ingreso...", "");

    try {
      await postApiJson("ingresos", payload);
      form.reset();
      setFeedback(feedback, "Ingreso guardado correctamente.", "success");
      await loadDashboard();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar el ingreso.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initExpenseForm() {
  const form = document.getElementById("expense-form");
  const feedback = document.getElementById("expense-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar gastos.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      fecha: formData.get("fecha"),
      categoria: String(formData.get("expense_categoria") || "").trim(),
      subcategoria: String(formData.get("subcategoria") || "").trim(),
      metodo_pago: String(formData.get("metodo_pago") || "").trim(),
      cuenta: String(formData.get("expense_cuenta") || "").trim(),
      monto: Number(formData.get("monto") || 0),
      comentarios: String(formData.get("comentarios") || "").trim(),
    };

    if (!payload.fecha || !payload.categoria || !payload.subcategoria || !payload.metodo_pago || !payload.cuenta || !payload.monto) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando gasto...", "");

    try {
      await postApiJson("gastos", payload);
      form.reset();
      setFeedback(feedback, "Gasto guardado correctamente.", "success");
      await loadDashboard();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar el gasto.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initAccountForm() {
  const form = document.getElementById("account-form");
  const feedback = document.getElementById("account-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar cuentas.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      nombre: String(formData.get("nombre") || "").trim(),
      tipo: String(formData.get("tipo") || "").trim(),
      saldo_inicial: Number(formData.get("saldo_inicial") || 0),
      moneda: String(formData.get("moneda") || "").trim(),
      comentarios: String(formData.get("comentarios") || "").trim(),
    };

    if (!payload.nombre || !payload.tipo || !payload.moneda || Number.isNaN(payload.saldo_inicial)) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando cuenta...", "");

    try {
      await postApiJson("cuentas", payload);
      form.reset();
      setFeedback(feedback, "Cuenta guardada correctamente.", "success");
      await loadBootstrapData();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar la cuenta.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initCardForm() {
  const form = document.getElementById("card-form");
  const feedback = document.getElementById("card-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar tarjetas.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      banco: String(formData.get("banco") || "").trim(),
      nombre: String(formData.get("nombre") || "").trim(),
      limite: Number(formData.get("limite") || 0),
      saldo_actual: Number(formData.get("saldo_actual") || 0),
      pago_minimo: Number(formData.get("pago_minimo") || 0),
      pago_no_intereses: Number(formData.get("pago_no_intereses") || 0),
      fecha_corte: String(formData.get("fecha_corte") || "").trim(),
      fecha_limite: String(formData.get("fecha_limite") || "").trim(),
      interes_anual: Number(formData.get("interes_anual") || 0),
      comentarios: String(formData.get("comentarios") || "").trim(),
    };

    if (
      !payload.banco ||
      !payload.nombre ||
      Number.isNaN(payload.limite) ||
      Number.isNaN(payload.saldo_actual) ||
      Number.isNaN(payload.pago_minimo) ||
      Number.isNaN(payload.pago_no_intereses) ||
      !payload.fecha_corte ||
      !payload.fecha_limite ||
      Number.isNaN(payload.interes_anual)
    ) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando tarjeta...", "");

    try {
      await postApiJson("tarjetas", payload);
      form.reset();
      setFeedback(feedback, "Tarjeta guardada correctamente.", "success");
      await loadDashboard();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar la tarjeta.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initLoanForm() {
  const form = document.getElementById("loan-form");
  const feedback = document.getElementById("loan-feedback");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar préstamos.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      prestamista: String(formData.get("prestamista") || "").trim(),
      concepto: String(formData.get("concepto") || "").trim(),
      monto_original: Number(formData.get("monto_original") || 0),
      saldo_actual: Number(formData.get("saldo_actual") || 0),
      pago_mensual: Number(formData.get("pago_mensual") || 0),
      interes_anual: Number(formData.get("interes_anual") || 0),
      fecha_inicio: String(formData.get("fecha_inicio") || "").trim(),
      fecha_limite: String(formData.get("fecha_limite") || "").trim(),
      pagos_restantes: Number(formData.get("pagos_restantes") || 0),
      comentarios: String(formData.get("comentarios") || "").trim(),
    };

    if (
      !payload.prestamista ||
      !payload.concepto ||
      Number.isNaN(payload.monto_original) ||
      Number.isNaN(payload.saldo_actual) ||
      Number.isNaN(payload.pago_mensual) ||
      Number.isNaN(payload.interes_anual) ||
      !payload.fecha_inicio ||
      !payload.fecha_limite ||
      Number.isNaN(payload.pagos_restantes)
    ) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando préstamo...", "");

    try {
      await postApiJson("prestamos", payload);
      form.reset();
      setFeedback(feedback, "Préstamo guardado correctamente.", "success");
      await loadDashboard();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar el préstamo.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function initReminderForm() {
  const form = document.getElementById("reminder-form");
  const feedback = document.getElementById("reminder-feedback");
  if (!form || !feedback) return;

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!apiBaseUrl) {
      setFeedback(feedback, "Configura la URL del Apps Script para guardar recordatorios.", "error");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      titulo: String(formData.get("titulo") || "").trim(),
      tipo: String(formData.get("tipo") || "").trim(),
      fecha_evento: String(formData.get("fecha_evento") || "").trim(),
      dias_antes: Number(formData.get("dias_antes") || 0),
      canal: String(formData.get("canal") || "").trim(),
      estado: String(formData.get("estado") || "").trim(),
      descripcion: String(formData.get("descripcion") || "").trim(),
    };

    if (
      !payload.titulo ||
      !payload.tipo ||
      !payload.fecha_evento ||
      Number.isNaN(payload.dias_antes) ||
      !payload.canal ||
      !payload.estado
    ) {
      setFeedback(feedback, "Completa todos los campos obligatorios.", "error");
      return;
    }

    submitButton.disabled = true;
    setFeedback(feedback, "Guardando recordatorio...", "");

    try {
      await postApiJson("recordatorios", payload);
      form.reset();
      setFeedback(feedback, "Recordatorio guardado correctamente.", "success");
      await loadDashboard();
    } catch (error) {
      setFeedback(feedback, error.message || "Hubo un error al guardar el recordatorio.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

function populateSelect(name, items, placeholder) {
  const select = document.querySelector(`select[name="${name}"]`);
  if (!select) return;

  select.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
}

function mapItems(items, fallback) {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  return items
    .map((item) => {
      if (!item) return null;

      const value = String(item.value || item.nombre || item.id || "").trim();
      const label = String(item.label || item.nombre || item.value || item.id || "").trim();

      if (!value || !label) return null;
      return { value, label };
    })
    .filter(Boolean);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value ?? 0);
}

function renderDashboard(data) {
  document.getElementById("available-balance").textContent = formatCurrency(data.availableBalance);
  document.getElementById("monthly-income").textContent = formatCurrency(data.monthlyIncome);
  document.getElementById("monthly-expenses").textContent = formatCurrency(data.monthlyExpenses);
  document.getElementById("current-savings").textContent = formatCurrency(data.currentSavings);
  renderRecentMovements(data.recentMovements || []);
  renderCards(data.cards || []);
  renderLoans(data.loans || []);
  renderReminders(data.reminders || [], data.remindersTodayCount || 0);
}

function renderRecentMovements(items) {
  const list = document.getElementById("recent-movements");
  if (!list) return;

  if (!Array.isArray(items) || items.length === 0) {
    list.innerHTML = '<li class="activity-empty">Sin actividad todavía.</li>';
    return;
  }

  list.innerHTML = items
    .map((item) => {
      const title = escapeHtml(item.descripcion || item.concepto || "Movimiento");
      const meta = [item.fecha, item.cuenta, item.categoria].filter(Boolean).map(escapeHtml).join(" · ");
      const amount = formatCurrency(Number(item.monto || 0));
      const kind = escapeHtml(item.tipo || "movimiento");

      return `
        <li class="activity-item">
          <strong>${title}</strong>
          <span>${meta}</span>
          <div class="activity-kind">${kind} · ${amount}</div>
        </li>
      `;
    })
    .join("");
}

function renderCards(items) {
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("cards-count");
  const averageUtilization = document.getElementById("cards-average-utilization");
  if (!grid || !count || !averageUtilization) return;

  if (!Array.isArray(items) || items.length === 0) {
    count.textContent = "0";
    averageUtilization.textContent = "0%";
    grid.innerHTML = `
      <article class="credit-card credit-card--empty">
        <div class="credit-card__top">
          <div>
            <span>Sin tarjetas aún</span>
            <strong>Agrega tu primera tarjeta</strong>
          </div>
        </div>
        <p>Cuando registres una tarjeta, aparecerá aquí con su nivel de uso.</p>
      </article>
    `;
    return;
  }

  count.textContent = String(items.length);

  const utilizationValues = items
    .map((item) => Number(item.utilization || 0))
    .filter((value) => Number.isFinite(value));
  const average = utilizationValues.length
    ? Math.round(utilizationValues.reduce((sum, value) => sum + value, 0) / utilizationValues.length)
    : 0;
  averageUtilization.textContent = `${average}%`;

  grid.innerHTML = items
    .map((item) => {
      const utilization = Math.max(0, Math.min(100, Number(item.utilization || 0)));
      const limit = formatCurrency(Number(item.limite || 0));
      const balance = formatCurrency(Number(item.saldo_actual || 0));
      const available = formatCurrency(Number(item.disponible || 0));
      const minPayment = formatCurrency(Number(item.pago_minimo || 0));
      const bank = escapeHtml(item.banco || "");
      const name = escapeHtml(item.nombre || "");
      const dueDate = escapeHtml(item.fecha_limite || "");
      const corteDate = escapeHtml(item.fecha_corte || "");

      return `
        <article class="credit-card">
          <div class="credit-card__top">
            <div>
              <div class="credit-card__bank">${bank}</div>
              <strong class="credit-card__name">${name}</strong>
            </div>
            <div>${utilization}%</div>
          </div>
          <div class="credit-card__meta">
            <div class="credit-card__row">
              <span>Límite</span>
              <strong>${limit}</strong>
            </div>
            <div class="credit-card__row">
              <span>Saldo</span>
              <strong>${balance}</strong>
            </div>
            <div class="credit-card__row">
              <span>Disponible</span>
              <strong>${available}</strong>
            </div>
            <div class="credit-card__row">
              <span>Pago mínimo</span>
              <strong>${minPayment}</strong>
            </div>
          </div>
          <div class="credit-card__bar" aria-label="Utilización de tarjeta">
            <div style="width:${utilization}%"></div>
          </div>
          <div class="credit-card__foot">
            <span>Corte: ${corteDate}</span>
            <span>Límite: ${dueDate}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderLoans(items) {
  const grid = document.getElementById("loans-grid");
  const count = document.getElementById("loans-count");
  const totalBalance = document.getElementById("loans-total-balance");
  if (!grid || !count || !totalBalance) return;

  if (!Array.isArray(items) || items.length === 0) {
    count.textContent = "0";
    totalBalance.textContent = formatCurrency(0);
    grid.innerHTML = `
      <article class="loan-card loan-card--empty">
        <div class="loan-card__top">
          <div>
            <span>Sin préstamos aún</span>
            <strong>Agrega tu primer préstamo</strong>
          </div>
        </div>
        <p>Cuando registres un préstamo, aparecerá aquí con su avance y saldo.</p>
      </article>
    `;
    return;
  }

  count.textContent = String(items.length);

  const total = items.reduce((sum, item) => sum + Number(item.saldo_actual || 0), 0);
  totalBalance.textContent = formatCurrency(total);

  grid.innerHTML = items
    .map((item) => {
      const original = Number(item.monto_original || 0);
      const saldo = Number(item.saldo_actual || 0);
      const paid = Math.max(original - saldo, 0);
      const progress = original > 0 ? Math.max(0, Math.min(100, Math.round((paid / original) * 100))) : 0;
      const monthly = formatCurrency(Number(item.pago_mensual || 0));
      const interest = Number(item.interes_anual || 0);
      const lender = escapeHtml(item.prestamista || "");
      const concept = escapeHtml(item.concepto || "");
      const startDate = escapeHtml(item.fecha_inicio || "");
      const dueDate = escapeHtml(item.fecha_limite || "");
      const paymentsLeft = Number(item.pagos_restantes || 0);

      return `
        <article class="loan-card">
          <div class="loan-card__top">
            <div>
              <div class="loan-card__bank">${lender}</div>
              <strong class="loan-card__name">${concept}</strong>
            </div>
            <div>${progress}%</div>
          </div>
          <div class="loan-card__meta">
            <div class="loan-card__row">
              <span>Saldo actual</span>
              <strong>${formatCurrency(saldo)}</strong>
            </div>
            <div class="loan-card__row">
              <span>Monto original</span>
              <strong>${formatCurrency(original)}</strong>
            </div>
            <div class="loan-card__row">
              <span>Pago mensual</span>
              <strong>${monthly}</strong>
            </div>
            <div class="loan-card__row">
              <span>Pagos restantes</span>
              <strong>${paymentsLeft}</strong>
            </div>
          </div>
          <div class="loan-card__bar" aria-label="Avance del préstamo">
            <div style="width:${progress}%"></div>
          </div>
          <div class="loan-card__foot">
            <span>Inicio: ${startDate}</span>
            <span>Vence: ${dueDate}</span>
          </div>
          <div class="activity-kind">Interés anual: ${interest}%</div>
        </article>
      `;
    })
    .join("");
}

function renderReminders(items, todayCount) {
  const grid = document.getElementById("reminders-grid");
  const count = document.getElementById("reminders-count");
  const today = document.getElementById("reminders-today-count");
  if (!grid || !count || !today) return;

  if (!Array.isArray(items) || items.length === 0) {
    count.textContent = "0";
    today.textContent = String(Number(todayCount || 0));
    grid.innerHTML = `
      <article class="reminder-card reminder-card--empty">
        <div class="reminder-card__top">
          <div>
            <span>Sin recordatorios aún</span>
            <strong>Agrega uno para empezar</strong>
          </div>
        </div>
        <p>Cuando registres un recordatorio, aparecerá aquí con su fecha y canal.</p>
      </article>
    `;
    return;
  }

  const sorted = items
    .slice()
    .sort((a, b) => Number(a.days_until_alert ?? a.daysUntilAlert ?? 9999) - Number(b.days_until_alert ?? b.daysUntilAlert ?? 9999));

  const alertsToday = sorted.filter((item) => Number(item.days_until_alert ?? item.daysUntilAlert ?? 9999) === 0).length;

  count.textContent = String(sorted.length);
  today.textContent = String(alertsToday || Number(todayCount || 0));

  grid.innerHTML = sorted
    .map((item) => {
      const title = escapeHtml(item.titulo || item.title || "");
      const type = escapeHtml(item.tipo || "");
      const date = escapeHtml(item.fecha_evento || "");
      const channel = escapeHtml(item.canal || "");
      const status = escapeHtml(item.estado || "");
      const description = escapeHtml(item.descripcion || "");
      const daysAlert = Number(item.days_until_alert ?? item.daysUntilAlert ?? 0);
      const daysEvent = Number(item.days_until_event ?? item.daysUntilEvent ?? 0);
      const urgency = item.urgency || (daysAlert < 0 ? "vencido" : daysAlert === 0 ? "hoy" : daysAlert === 1 ? "mañana" : "próximo");

      return `
        <article class="reminder-card">
          <div class="reminder-card__top">
            <div>
              <div class="reminder-card__type">${type}</div>
              <strong class="reminder-card__name">${title}</strong>
            </div>
            <div>${escapeHtml(String(urgency))}</div>
          </div>
          <div class="reminder-card__meta">
            <div class="reminder-card__row">
              <span>Fecha</span>
              <strong>${date}</strong>
            </div>
            <div class="reminder-card__row">
              <span>Estado</span>
              <strong>${status}</strong>
            </div>
            <div class="reminder-card__row">
              <span>Canal</span>
              <strong>${channel}</strong>
            </div>
            <div class="reminder-card__row">
              <span>Avance</span>
              <strong>${daysAlert} días para aviso</strong>
            </div>
          </div>
          <div class="reminder-card__foot">
            <span>${description || "Sin notas adicionales"}</span>
            <span>${daysEvent} días para evento</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setFeedback(element, message, variant) {
  element.textContent = message;
  element.classList.remove("success", "error");

  if (variant) {
    element.classList.add(variant);
  }
}

initIncomeForm();
initExpenseForm();
initAccountForm();
initCardForm();
initLoanForm();
initReminderForm();
loadBootstrapData();
loadDashboard();
