// Pega aquí la URL publicada de tu Web App de Apps Script.
// Ejemplo: "https://script.google.com/macros/s/XXXX/exec"
const apiBaseUrl = "";

async function loadDashboard() {
  const fallback = {
    availableBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    currentSavings: 0,
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
      const response = await fetch(`${apiBaseUrl}?route=ingresos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "No se pudo guardar el ingreso");
      }

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
}

function setFeedback(element, message, variant) {
  element.textContent = message;
  element.classList.remove("success", "error");

  if (variant) {
    element.classList.add(variant);
  }
}

initIncomeForm();
loadDashboard();
