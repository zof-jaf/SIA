const btnAutoDemo = document.getElementById("btnAutoDemo");
if (btnAutoDemo) {
  btnAutoDemo.addEventListener("click", () => {
    const emailField = document.getElementById("email") || document.getElementById("username");
    if (emailField) emailField.value = "estudiante@ucaldas.edu.co";
    document.getElementById("password").value = "123456";
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => { 
    e.preventDefault();

    const emailField = document.getElementById("email") || document.getElementById("username");
    const emailInput = emailField ? emailField.value.trim() : "";
    const passwordInput = document.getElementById("password").value.trim();
    const errorBox = document.getElementById("loginError");

    if (!emailInput || !passwordInput) {
      if (errorBox) {
        errorBox.textContent = "Por favor ingresa correo y contraseña.";
        errorBox.classList.remove("d-none");
      }
      return;
    }

    if (errorBox) errorBox.classList.add("d-none");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput
        })
      });

      const data = await response.json();

      if (response.ok) {
        sessionStorage.setItem("sia_user_code", data.user?.email || emailInput);
        sessionStorage.setItem("sia_user_name", data.user?.name || "Estudiante");
        window.location.href = "dashboard.html";
      } else {
        if (errorBox) {
          errorBox.textContent = data.message || "Correo o contraseña incorrectos.";
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