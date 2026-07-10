import { getStats, getVendors, toggleVendor } from "./services/api.js"

const params = new URLSearchParams(window.location.search)
const brand = params.get("brand")

async function loadStats() {
  const stats = await getStats(brand)
  const container = document.getElementById("stats")
  container.innerHTML = ""

  const entries = Object.entries(stats)
  if (entries.length === 0) {
    container.innerHTML = "<p style='color:#6b7280;'>Sin datos a\u00FAn</p>"
    return
  }

  entries.forEach(([name, count]) => {
    const div = document.createElement("div")
    div.textContent = `${name}: ${count} chats`
    container.appendChild(div)
  })
}

async function loadVendors() {
  const vendors = await getVendors(brand)
  const tbody = document.querySelector("#vendors tbody")
  tbody.innerHTML = ""

  vendors.forEach(v => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${v.name}</td>
      <td>${v.phone}</td>
      <td><button data-id="${v.id}">${v.active ? "Activo" : "Inactivo"}</button></td>
    `

    const btn = tr.querySelector("button")
    if (!v.active) btn.classList.add("inactive")

    btn.onclick = async () => {
      await toggleVendor(v.id, !v.active)
      loadVendors()
    }

    tbody.appendChild(tr)
  })
}

loadStats()
loadVendors()
