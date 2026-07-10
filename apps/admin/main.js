import {
  getStats,
  listBrands, createBrand, updateBrand, deleteBrand,
  listVendors, createVendor, updateVendor, deleteVendor,
  listEvents
} from "./services/api.js"

const TOKEN_KEY = "wa-admin-token"
if (!localStorage.getItem(TOKEN_KEY)) {
  window.location.replace("/login")
}

// ─── State ───
let brands = []
let vendors = []
let currentBrandId = ""

// ─── Navigation ───
function navigate(hash) {
  document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.remove("active"))
  const link = document.querySelector(`.sidebar nav a[href="${hash}"]`)
  if (link) link.classList.add("active")
  renderSection(hash.replace("#", ""))
}

window.addEventListener("hashchange", () => navigate(window.location.hash || "#dashboard"))
navigate(window.location.hash || "#dashboard")

// ─── Section Router ───
function renderSection(section) {
  const container = document.getElementById("section-content")
  container.innerHTML = ""
  if (section === "dashboard") renderDashboard(container)
  else if (section === "brands") renderBrands(container)
  else if (section === "vendors") renderVendors(container)
  else if (section === "events") renderEvents(container)
}

// ─── Shared helpers ───
function emptyMsg(container, msg) {
  container.innerHTML = `<div class="empty">${msg}</div>`
}

function showModal(html) {
  const overlay = document.createElement("div")
  overlay.className = "modal-overlay"
  overlay.innerHTML = `<div class="modal">${html}</div>`
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove() })
  document.body.appendChild(overlay)
  return overlay.querySelector(".modal")
}

// ─── DASHBOARD ───
async function renderDashboard(container) {
  container.innerHTML = "<div class='empty'>Cargando...</div>"

  const [stats, allBrands, allVendors, recentEvents] = await Promise.all([
    getStats().catch(() => ({})),
    listBrands().catch(() => []),
    listVendors().catch(() => []),
    listEvents({ days: 1 }).catch(() => ({ data: [], total: 0 }))
  ])

  const totalEvents = Object.values(stats).reduce((a, b) => a + b, 0)
  const totalChats = Array.isArray(allVendors) ? allVendors.filter(v => v.active).length : 0

  container.innerHTML = `
    <div class="dashboard-cards">
      <div class="dash-card">
        <h3>Marcas</h3>
        <div class="value purple">${allBrands.length}</div>
      </div>
      <div class="dash-card">
        <h3>Vendedores activos</h3>
        <div class="value blue">${totalChats}</div>
      </div>
      <div class="dash-card">
        <h3>Chats totales</h3>
        <div class="value green">${totalEvents}</div>
      </div>
      <div class="dash-card">
        <h3>Hoy</h3>
        <div class="value yellow">${recentEvents.total || 0}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Vendedor</th><th>Chats</th></tr></thead>
        <tbody>
          ${Object.entries(stats).length
            ? Object.entries(stats).map(([name, count]) =>
                `<tr><td>${name}</td><td><strong>${count}</strong></td></tr>`
              ).join("")
            : "<tr><td colspan='2' class='empty'>Sin datos</td></tr>"
          }
        </tbody>
      </table>
    </div>
  `
}

// ─── BRANDS ───
async function renderBrands(container) {
  container.innerHTML = `
    <div class="section-header">
      <h2>Marcas</h2>
      <button class="btn btn-primary" id="btn-add-brand">+ Nueva marca</button>
    </div>
    <div class="table-wrap"><div class="empty">Cargando...</div></div>
  `

  brands = await listBrands()
  const tbody = buildBrandsTable(container)

  document.getElementById("btn-add-brand").onclick = () => brandForm()

  if (brands.length === 0) {
    tbody.parentElement.innerHTML = "<div class='empty'>No hay marcas registradas</div>"
  }
}

function buildBrandsTable(container) {
  const wrap = container.querySelector(".table-wrap")
  wrap.innerHTML = `
    <table>
      <thead><tr><th>Nombre</th><th>Dominio</th><th>Slug</th><th>Vendedores</th><th></th></tr></thead>
      <tbody>
        ${brands.map(b => {
          const vCount = vendors.filter(v => v.brand_id === b.id).length
          return `<tr>
            <td><strong>${b.name}</strong></td>
            <td style="color:rgba(255,255,255,0.4)">${b.domain || "—"}</td>
            <td style="color:rgba(255,255,255,0.4)">${b.slug || "—"}</td>
            <td>${vCount}</td>
            <td class="actions">
              <button class="btn btn-sm btn-ghost" data-edit="${b.id}">Editar</button>
              <button class="btn btn-sm btn-danger" data-del="${b.id}">Eliminar</button>
            </td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
  `

  wrap.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => brandForm(btn.dataset.edit)
  })
  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("¿Eliminar esta marca? También se eliminarán sus vendedores.")) return
      await deleteBrand(btn.dataset.edit)
      vendors = vendors.filter(v => v.brand_id !== btn.dataset.edit)
      renderBrands(container)
    }
  })

  return wrap.querySelector("tbody")
}

async function brandForm(brandId) {
  const isEdit = !!brandId
  const brand = isEdit ? brands.find(b => b.id === brandId) : null

  const modal = showModal(`
    <h3>${isEdit ? "Editar marca" : "Nueva marca"}</h3>
    <label>Nombre</label>
    <input type="text" id="f-brand-name" value="${brand?.name || ""}" required>
    <label>Dominio (opcional)</label>
    <input type="text" id="f-brand-domain" value="${brand?.domain || ""}" placeholder="ej: mistore.com">
    <label>Slug (opcional)</label>
    <input type="text" id="f-brand-slug" value="${brand?.slug || ""}" placeholder="auto si se deja vacío">
    <div class="form-actions">
      <button class="btn btn-ghost" id="btn-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="btn-modal-save">${isEdit ? "Guardar" : "Crear"}</button>
    </div>
  `)

  modal.querySelector("#btn-modal-cancel").onclick = () => modal.closest(".modal-overlay").remove()
  modal.querySelector("#btn-modal-save").onclick = async () => {
    const name = modal.querySelector("#f-brand-name").value.trim()
    if (!name) return
    const data = {
      name,
      domain: modal.querySelector("#f-brand-domain").value.trim() || null,
      slug: modal.querySelector("#f-brand-slug").value.trim() || undefined
    }
    if (isEdit) data.id = brandId
    isEdit ? await updateBrand(data) : await createBrand(data)
    modal.closest(".modal-overlay").remove()
    renderBrands(document.getElementById("section-content"))
  }
}

// ─── VENDORS ───
async function renderVendors(container) {
  vendors = await listVendors()
  brands = await listBrands()

  const brandOpts = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("")

  container.innerHTML = `
    <div class="section-header">
      <h2>Vendedores</h2>
      <div style="display:flex;gap:10px;align-items:center">
        <select id="filter-brand" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px 12px;color:#fff;outline:none;font-size:0.85rem;">
          <option value="">Todas las marcas</option>
          ${brandOpts}
        </select>
        <button class="btn btn-primary" id="btn-add-vendor">+ Añadir vendedor</button>
      </div>
    </div>
    <div class="table-wrap"><div class="empty">Cargando...</div></div>
  `

  const filterSelect = container.querySelector("#filter-brand")
  filterSelect.value = currentBrandId
  filterSelect.onchange = () => {
    currentBrandId = filterSelect.value
    renderVendorsTable(container)
  }
  document.getElementById("btn-add-vendor").onclick = () => vendorForm()

  renderVendorsTable(container)
}

function renderVendorsTable(container) {
  const filtered = currentBrandId ? vendors.filter(v => v.brand_id === currentBrandId) : vendors
  const wrap = container.querySelector(".table-wrap")

  if (filtered.length === 0) {
    wrap.innerHTML = "<div class='empty'>No hay vendedores</div>"
    return
  }

  const brandMap = {}
  brands.forEach(b => brandMap[b.id] = b.name)

  wrap.innerHTML = `
    <table>
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Marca</th><th>Estado</th><th>Horario</th><th></th></tr></thead>
      <tbody>
        ${filtered.map(v => {
          const schedule = v.schedule || {}
          const hasSchedule = Object.values(schedule).some(d => d?.active)
          return `<tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.phone}</td>
            <td style="color:rgba(255,255,255,0.4)">${brandMap[v.brand_id] || "—"}</td>
            <td><span class="badge ${v.active ? "badge-green" : "badge-warning"}">${v.active ? "Activo" : "Suspendido"}</span></td>
            <td style="font-size:0.8rem;color:rgba(255,255,255,0.4)">${hasSchedule ? "Configurado" : "Sin horario"}</td>
            <td class="actions">
              <button class="btn btn-sm btn-ghost" data-edit="${v.id}">Editar</button>
              <button class="btn btn-sm ${v.active ? 'btn-warning' : 'btn-ghost'}" data-suspend="${v.id}">${v.active ? "Suspender" : "Reactivar"}</button>
              <button class="btn btn-sm btn-danger" data-del="${v.id}">Eliminar</button>
            </td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
  `

  wrap.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => vendorForm(btn.dataset.edit)
  })
  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("¿Eliminar este vendedor?")) return
      await deleteVendor(btn.dataset.del)
      vendors = vendors.filter(v => v.id !== btn.dataset.del)
      renderVendorsTable(container)
    }
  })
  wrap.querySelectorAll("[data-suspend]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.suspend
      const v = vendors.find(x => x.id === id)
      if (!v) return
      await updateVendor({ id, active: !v.active })
      v.active = !v.active
      renderVendorsTable(container)
    }
  })
}
  })
}

async function vendorForm(vendorId) {
  const isEdit = !!vendorId
  const vendor = isEdit ? vendors.find(v => v.id === vendorId) : null
  const schedule = vendor?.schedule || {}
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const dayKeys = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

  const scheduleRows = days.map((d, i) => {
    const day = schedule[dayKeys[i]] || {}
    const checked = day.active ? "checked" : ""
    const start = day.start || "09:00"
    const end = day.end || "18:00"
    return `
      <div class="schedule-row">
        <span class="day">${d}</span>
        <label class="toggle">
          <input type="checkbox" class="sched-active" data-day="${dayKeys[i]}" ${checked}>
          <span class="slider"></span>
        </label>
        <input type="time" class="sched-start" data-day="${dayKeys[i]}" value="${start}" ${checked ? "" : "disabled"}>
        <span style="color:rgba(255,255,255,0.3)">a</span>
        <input type="time" class="sched-end" data-day="${dayKeys[i]}" value="${end}" ${checked ? "" : "disabled"}>
      </div>
    `
  }).join("")

  const brandOpts = brands.map(b =>
    `<option value="${b.id}" ${vendor && vendor.brand_id === b.id ? "selected" : ""}>${b.name}</option>`
  ).join("")

  const modal = showModal(`
    <h3>${isEdit ? "Editar vendedor" : "Nuevo vendedor"}</h3>
    <label>Nombre</label>
    <input type="text" id="f-v-name" value="${vendor?.name || ""}" required>
    <label>Teléfono</label>
    <input type="text" id="f-v-phone" value="${vendor?.phone || ""}" placeholder="5493815272820" required>
    <label>Marca</label>
    <select id="f-v-brand">${brandOpts}</select>
    <label>Activo</label>
    <select id="f-v-active">
      <option value="true" ${vendor && vendor.active ? "selected" : ""}>Sí</option>
      <option value="false" ${vendor && !vendor.active ? "selected" : ""}>No</option>
    </select>
    <label style="margin-top:18px">Horario semanal</label>
    <div class="schedule-grid">${scheduleRows}</div>
    <div class="form-actions">
      <button class="btn btn-ghost" id="btn-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="btn-modal-save">${isEdit ? "Guardar" : "Crear"}</button>
    </div>
  `)

  // Toggle time inputs on checkbox change
  modal.querySelectorAll(".sched-active").forEach(cb => {
    cb.onchange = () => {
      const day = cb.dataset.day
      modal.querySelector(`.sched-start[data-day="${day}"]`).disabled = !cb.checked
      modal.querySelector(`.sched-end[data-day="${day}"]`).disabled = !cb.checked
    }
  })

  modal.querySelector("#btn-modal-cancel").onclick = () => modal.closest(".modal-overlay").remove()
  modal.querySelector("#btn-modal-save").onclick = async () => {
    const name = modal.querySelector("#f-v-name").value.trim()
    const phone = modal.querySelector("#f-v-phone").value.trim()
    const brand_id = modal.querySelector("#f-v-brand").value
    if (!name || !phone || !brand_id) return

    const scheduleData = {}
    dayKeys.forEach(k => {
      const active = modal.querySelector(`.sched-active[data-day="${k}"]`).checked
      if (active) {
        scheduleData[k] = {
          active: true,
          start: modal.querySelector(`.sched-start[data-day="${k}"]`).value,
          end: modal.querySelector(`.sched-end[data-day="${k}"]`).value
        }
      } else {
        scheduleData[k] = { active: false }
      }
    })

    const data = {
      brand_id,
      name,
      phone,
      active: modal.querySelector("#f-v-active").value === "true",
      schedule: scheduleData
    }
    if (isEdit) data.id = vendorId
    isEdit ? await updateVendor(data) : await createVendor(data)
    modal.closest(".modal-overlay").remove()
    renderVendors(document.getElementById("section-content"))
  }
}

// ─── EVENTS ───
let eventsPage = 1
let eventsTotal = 0
let eventsFilters = { days: "7", brand_id: "", vendor_id: "" }

async function renderEvents(container) {
  brands = await listBrands()
  const brandOpts = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("")

  let vendorOpts = "<option value=''>Todos</option>"
  if (eventsFilters.brand_id) {
    const filteredVendors = vendors.filter(v => v.brand_id === eventsFilters.brand_id)
    vendorOpts += filteredVendors.map(v => `<option value="${v.id}">${v.name}</option>`).join("")
  }

  container.innerHTML = `
    <div class="section-header"><h2>Historial de eventos</h2></div>
    <div class="filters">
      <div class="field">
        <label>Marca</label>
        <select id="ev-filter-brand">${brandOpts}</select>
      </div>
      <div class="field">
        <label>Vendedor</label>
        <select id="ev-filter-vendor">${vendorOpts}</select>
      </div>
      <div class="field">
        <label>Últimos</label>
        <select id="ev-filter-days">
          <option value="1">1 día</option>
          <option value="7" ${eventsFilters.days === "7" ? "selected" : ""}>7 días</option>
          <option value="30">30 días</option>
          <option value="90">90 días</option>
        </select>
      </div>
      <button class="btn btn-primary" id="ev-filter-btn">Filtrar</button>
    </div>
    <div class="table-wrap"><div class="empty">Cargando...</div></div>
    <div id="ev-pagination"></div>
  `

  container.querySelector("#ev-filter-brand").value = eventsFilters.brand_id
  container.querySelector("#ev-filter-vendor").value = eventsFilters.vendor_id
  container.querySelector("#ev-filter-days").value = eventsFilters.days

  container.querySelector("#ev-filter-brand").onchange = () => {
    const brandId = container.querySelector("#ev-filter-brand").value
    eventsFilters.brand_id = brandId
    eventsFilters.vendor_id = ""
    renderEvents(container)
  }

  container.querySelector("#ev-filter-btn").onclick = () => {
    eventsFilters.days = container.querySelector("#ev-filter-days").value
    eventsFilters.vendor_id = container.querySelector("#ev-filter-vendor").value
    eventsPage = 1
    loadEventsTable(container)
  }

  loadEventsTable(container)
}

async function loadEventsTable(container) {
  const result = await listEvents({ ...eventsFilters, page: eventsPage, limit: 50 })
  eventsTotal = result.total
  const events = result.data || []
  const wrap = container.querySelector(".table-wrap")

  if (events.length === 0) {
    wrap.innerHTML = "<div class='empty'>No hay eventos con esos filtros</div>"
    container.querySelector("#ev-pagination").innerHTML = ""
    return
  }

  wrap.innerHTML = `
    <table>
      <thead><tr><th>Vendedor</th><th>Marca</th><th>IP</th><th>Fecha</th></tr></thead>
      <tbody>
        ${events.map(e => {
          const brand = brands.find(b => b.id === e.brand_id)
          const date = new Date(e.created_at).toLocaleString("es-AR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })
          return `<tr>
            <td><strong>${e.vendors?.name || "—"}</strong></td>
            <td style="color:rgba(255,255,255,0.4)">${brand?.name || "—"}</td>
            <td style="font-family:monospace;font-size:0.8rem;color:rgba(255,255,255,0.4)">${e.ip || "—"}</td>
            <td style="font-size:0.82rem;color:rgba(255,255,255,0.5)">${date}</td>
          </tr>`
        }).join("")}
      </tbody>
    </table>
  `

  const totalPages = Math.ceil(eventsTotal / 50)
  const pag = container.querySelector("#ev-pagination")
  pag.innerHTML = `
    <div class="pagination">
      <button class="btn btn-sm btn-ghost" ${eventsPage <= 1 ? "disabled" : ""} id="ev-prev">← Anterior</button>
      <span>Pág ${eventsPage} de ${totalPages} (${eventsTotal} eventos)</span>
      <button class="btn btn-sm btn-ghost" ${eventsPage >= totalPages ? "disabled" : ""} id="ev-next">Siguiente →</button>
    </div>
  `

  pag.querySelector("#ev-prev").onclick = () => { if (eventsPage > 1) { eventsPage--; loadEventsTable(container) } }
  pag.querySelector("#ev-next").onclick = () => { if (eventsPage < totalPages) { eventsPage++; loadEventsTable(container) } }
}

// ─── Logout ───
document.getElementById("logout-btn").onclick = () => {
  localStorage.removeItem(TOKEN_KEY)
  window.location.href = "/login"
}
