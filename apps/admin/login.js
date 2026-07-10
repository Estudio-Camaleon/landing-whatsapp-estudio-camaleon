const TOKEN_KEY = "wa-admin-token"

const form = document.getElementById("login-form")
const userInput = document.getElementById("user")
const passInput = document.getElementById("password")
const errorEl = document.getElementById("login-error")

// Si ya tiene token, redirigir al panel
if (localStorage.getItem(TOKEN_KEY)) {
  window.location.replace("/apps/admin/")
}

form.addEventListener("submit", async (e) => {
  e.preventDefault()
  errorEl.textContent = ""

  const submitBtn = form.querySelector("button")
  submitBtn.disabled = true
  submitBtn.textContent = "Ingresando..."

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userInput.value,
        password: passInput.value
      })
    })

    if (!res.ok) {
      const err = await res.json()
      errorEl.textContent = err.error === "invalid_credentials"
        ? "Usuario o contraseña incorrectos"
        : "Error del servidor"
      return
    }

    const { token } = await res.json()
    localStorage.setItem(TOKEN_KEY, token)

    window.location.href = "/apps/admin/"
  } catch {
    errorEl.textContent = "Error de conexión"
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = "Ingresar"
  }
})
