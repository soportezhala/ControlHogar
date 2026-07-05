// Pega aquí la URL publicada de tu Web App de Apps Script.
// Ejemplo: "https://script.google.com/macros/s/XXXX/exec"
const apiBaseUrl = "https://script.google.com/macros/s/AKfycbzuLmVvn933jcf_GFdJcGs5PCVcbAt5xjgiLJPkXN-WHi8GmbLnxvj_2zojvs5pwITa/exec";

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
