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

    const response = await fetch(`${apiBaseUrl}/dashboard`);
    if (!response.ok) throw new Error("No se pudo cargar el dashboard");
    const data = await response.json();
    renderDashboard(data);
  } catch {
    renderDashboard(fallback);
  }
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

loadDashboard();

