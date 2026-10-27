// Verificar sesión activa
async function checkAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include" 
    });

    if (!response.ok) {
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error al verificar autenticación con el servidor:", error);
    window.location.href = "index.html";
  }
}

checkAuth();

const studentName = sessionStorage.getItem("sia_user_name") || "Estudiante";
const studentCode = sessionStorage.getItem("sia_user_code") || "202214982";

const navUserName = document.getElementById("navUserName");
if (navUserName) navUserName.textContent = studentName;

const dashWelcomeTitle = document.getElementById("dashWelcomeTitle");
if (dashWelcomeTitle) dashWelcomeTitle.textContent = `Bienvenido, ${studentName}`;

const dashCode = document.getElementById("dashCode");
if (dashCode) dashCode.textContent = studentCode;

const profileName = document.getElementById("profileName");
if (profileName) profileName.textContent = studentName;

const profileCode = document.getElementById("profileCode");
if (profileCode) profileCode.textContent = `Código: ${studentCode}`;

// Cerrar sesión
const btnLogout = document.getElementById("btnLogout");
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Error al notificar cierre de sesión:", error);
    } finally {
      sessionStorage.clear();
      window.location.href = "index.html";
    }
  });
}


// Tema Oscuro
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("sia_theme", theme);
  if (themeIcon) {
    themeIcon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill";
  }
}
applyTheme(localStorage.getItem("sia_theme") || "light");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });
}

// Simulación de Deuda
let hasDebt = false;
const financialBalance = document.getElementById("financialBalance");
const financialStatusBadge = document.getElementById("financialStatusBadge");
const debtBtnLabel = document.getElementById("debtBtnLabel");
const modalDebtMessage = document.getElementById("modalDebtMessage");

function renderFinance() {
  if (hasDebt) {
    financialBalance.textContent = "$185.000 COP";
    financialBalance.className = "fs-2 fw-black text-warning";
    financialStatusBadge.className = "mt-2 text-warning small fw-semibold";
    financialStatusBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Cuota 4 pendiente por cancelar';
    debtBtnLabel.textContent = "Al Día ($0)";
    modalDebtMessage.textContent = "Tienes un saldo pendiente de $185.000 COP.";
  } else {
    financialBalance.textContent = "$0.00 COP";
    financialBalance.className = "fs-2 fw-black text-success";
    financialStatusBadge.className = "mt-2 text-success small fw-semibold";
    financialStatusBadge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Al día · Sin saldo pendiente';
    debtBtnLabel.textContent = "Con Deuda ($185k)";
    modalDebtMessage.textContent = "Estás al día con todos tus pagos.";
  }
}

document.getElementById("btnToggleDebt").addEventListener("click", () => {
  hasDebt = !hasDebt;
  renderFinance();
});
renderFinance();

// Simulación de Trámites
let hasActiveProcedures = true;
const proceduresAlert = document.getElementById("proceduresAlert");
const procBtnLabel = document.getElementById("procBtnLabel");
const proceduresListModal = document.getElementById("proceduresListModal");

function renderProcedures() {
  if (hasActiveProcedures) {
    proceduresAlert.className = "my-3 p-2 rounded-3 small bg-warning-subtle text-warning-emphasis border border-warning-subtle";
    proceduresAlert.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Tienes <strong>1 trámite en curso</strong> (Certificado Oficial)';
    procBtnLabel.textContent = "Sin Trámites";
    proceduresListModal.innerHTML = `
      <div class="list-group-item d-flex justify-content-between align-items-center">
        <div>
          <strong>Certificado de Calificaciones Oficial</strong>
          <small class="d-block text-muted">Radicado: 2026-TR-0492</small>
        </div>
        <span class="badge bg-warning text-dark">En Curso</span>
      </div>`;
  } else {
    proceduresAlert.className = "my-3 p-2 rounded-3 small bg-success-subtle text-success-emphasis border border-success-subtle";
    proceduresAlert.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> <strong>No tienes trámites pendientes</strong>';
    procBtnLabel.textContent = "1 Trámite";
    proceduresListModal.innerHTML = `<div class="list-group-item text-muted text-center py-3">No hay trámites pendientes.</div>`;
  }
}

document.getElementById("btnToggleProcedures").addEventListener("click", () => {
  hasActiveProcedures = !hasActiveProcedures;
  renderProcedures();
});
renderProcedures();

// Materias y Horario
const courses = [
  { name: "Arquitectura de Software", time: "10:00 AM - 12:00 PM", room: "C-302", day: "Lunes" },
  { name: "Seguridad Informática", time: "02:00 PM - 04:00 PM", room: "Lab 405", day: "Martes" },
  { name: "Inteligencia Artificial", time: "08:00 AM - 10:00 AM", room: "B-201", day: "Miércoles" },
  { name: "Gestión de Proyectos TI", time: "10:00 AM - 12:00 PM", room: "D-104", day: "Jueves" },
  { name: "Computación en la Nube", time: "07:00 AM - 09:00 AM", room: "Lab Redes", day: "Viernes" }
];

const scheduleList = document.getElementById("scheduleList");
courses.forEach(c => {
  scheduleList.innerHTML += `
    <div class="list-group-item py-2 d-flex justify-content-between align-items-center">
      <div>
        <strong class="d-block">${c.name}</strong>
        <span class="text-muted">${c.day} · ${c.room}</span>
      </div>
      <span class="badge bg-primary-custom text-white">${c.time}</span>
    </div>`;
});

const approvedList = ["Algoritmos y Programación (4.6)", "Cálculo Diferencial (4.1)", "Estructuras de Datos (4.5)", "Bases de Datos I (4.8)"];
const pendingList = ["Trabajo de Grado I", "Sistemas Distribuidos", "Práctica Empresarial", "Trabajo de Grado II"];

const appUl = document.getElementById("approvedCoursesList");
approvedList.forEach(m => appUl.innerHTML += `<li class="list-group-item py-1 text-muted">• ${m}</li>`);

const pendUl = document.getElementById("pendingCoursesList");
pendingList.forEach(m => pendUl.innerHTML += `<li class="list-group-item py-1 text-muted">• ${m}</li>`);