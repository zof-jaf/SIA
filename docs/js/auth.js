// ==========================================
// 📌 USUARIO DE PRUEBA
// ==========================================
const USUARIO_PRUEBA = {
  usuario: "202214982",
  clave: "123",
  nombre: "Julián Andrés Flórez"
};

// Botón para autocompletar credenciales de prueba
const btnAutoDemo = document.getElementById("btnAutoDemo");
if (btnAutoDemo) {
  btnAutoDemo.addEventListener("click", () => {
    document.getElementById("username").value = USUARIO_PRUEBA.usuario;
    document.getElementById("password").value = USUARIO_PRUEBA.clave;
  });
}

// Envío del formulario de Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("loginError");

    if (!usernameInput || !passwordInput) {
      errorBox.textContent = "Por favor ingresa usuario y contraseña.";
      errorBox.classList.remove("d-none");
      return;
    }

    // Permite cualquier usuario: si es el de prueba usa su nombre, si es otro usa el escrito
    let nombreFinal = USUARIO_PRUEBA.nombre;
    if (usernameInput !== USUARIO_PRUEBA.usuario) {
      nombreFinal = isNaN(usernameInput) ? usernameInput : `Estudiante (${usernameInput})`;
    }

    // Guardar en la sesión del navegador
    sessionStorage.setItem("sia_user_code", usernameInput);
    sessionStorage.setItem("sia_user_name", nombreFinal);
    sessionStorage.setItem("sia_is_logged", "true");

    // Redirigir al Dashboard
    window.location.href = "dashboard.html";
  });
}

// Control del tema Claro / Oscuro
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("sia_theme", theme);
  if (themeIcon) {
    themeIcon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill";
  }
  if (themeText) {
    themeText.textContent = theme === "dark" ? "Modo Claro" : "Modo Oscuro";
  }
}

const currentTheme = localStorage.getItem("sia_theme") || "light";
applyTheme(currentTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
    applyTheme(isDark ? "light" : "dark");
  });
}