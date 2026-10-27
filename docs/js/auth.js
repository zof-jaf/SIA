

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
  loginForm.addEventListener("submit", async (e) => { // <-- Agregado 'async' aquí
    e.preventDefault();
    const usernameInput = document.getElementById("username").value.trim();
    const passwordInput = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("loginError");

    if (!usernameInput || !passwordInput) {
      if (errorBox) {
        errorBox.textContent = "Por favor ingresa usuario y contraseña.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    if (errorBox) errorBox.classList.add("d-none");

    let nombreFinal = USUARIO_PRUEBA.nombre;
    if (usernameInput !== USUARIO_PRUEBA.usuario) {
      nombreFinal = isNaN(usernameInput) ? usernameInput : `Estudiante (${usernameInput})`;
    }

    try {
      // Ahora sí se permite el uso de 'await'
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput
        })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("sia_user_code", usernameInput);
        sessionStorage.setItem("sia_user_name", nombreFinal);
        window.location.href = "dashboard.html";
      } else {
        if (errorBox) {
          errorBox.textContent = data.message || "Usuario o contraseña incorrectos.";
          errorBox.classList.remove("d-none");
        }
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      if (errorBox) {
        errorBox.textContent = "Error al conectar con el servidor.";
        errorBox.classList.remove("d-none");
      }
    }
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