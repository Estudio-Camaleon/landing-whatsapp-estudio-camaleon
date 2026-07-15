import {
  getStats,
  listBrands, createBrand, updateBrand, deleteBrand,
  listVendors, createVendor, updateVendor, deleteVendor,
  listSucursales, createSucursal, updateSucursal, deleteSucursal,
  listEvents,
  uploadAsset
} from "./services/api.js"

const TOKEN_KEY = "wa-admin-token"
if (!localStorage.getItem(TOKEN_KEY)) {
  window.location.replace("/login")
}

// ─── State ───
let brands = []
let vendors = []
let sucursales = []
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
  else if (section === "sucursales") renderSucursales(container)
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
  vendors = await listVendors()
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
      <thead><tr><th>Nombre</th><th>Dominio</th><th>Slug</th><th>Estado</th><th>Vendedores</th><th></th></tr></thead>
      <tbody>
        ${brands.map(b => {
          const vCount = vendors.filter(v => v.brand_id === b.id).length
          const isActive = b.active !== false
          return `<tr>
            <td><strong>${b.name}</strong></td>
            <td style="color:rgba(255,255,255,0.4)">${b.domain || "—"}</td>
            <td style="color:rgba(255,255,255,0.4)">${b.slug || "—"}</td>
            <td><span class="badge ${isActive ? "badge-green" : "badge-warning"}">${isActive ? "Activa" : "Suspendida"}</span></td>
            <td>${vCount}</td>
            <td class="actions">
              <button class="btn btn-sm btn-ghost" data-edit="${b.id}">Editar</button>
              <button class="btn btn-sm ${isActive ? 'btn-warning' : 'btn-ghost'}" data-suspend="${b.id}">${isActive ? "Suspender" : "Reactivar"}</button>
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
      await deleteBrand(btn.dataset.del)
      vendors = vendors.filter(v => v.brand_id !== btn.dataset.del)
      renderBrands(container)
    }
  })
  wrap.querySelectorAll("[data-suspend]").forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.suspend
      const b = brands.find(x => x.id === id)
      if (!b) return
      await updateBrand({ id, active: !b.active })
      b.active = !b.active
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
    ${isEdit ? `
    <label>Logo (máx 5 MB)</label>
    <input type="file" id="f-brand-logo" accept="image/*">
    ${brand?.logo_url ? `<div class="upload-preview"><img src="${brand.logo_url}" height="40"><span class="upload-ok">Subido</span></div>` : ""}
    <label>Fondo (máx 10 MB)</label>
    <input type="file" id="f-brand-bg" accept="image/*">
    ${brand?.background_url ? `<div class="upload-preview"><span class="upload-ok">Subido</span></div>` : ""}
    <label>Fondo mobile (máx 10 MB)</label>
    <input type="file" id="f-brand-bg-mobile" accept="image/*">
    ${brand?.background_mobile_url ? `<div class="upload-preview"><span class="upload-ok">Subido</span></div>` : ""}
    ` : ""}
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
    const result = isEdit ? await updateBrand(data) : await createBrand(data)
    const newId = result?.id || brandId

    const fileInputs = [
      { el: modal.querySelector("#f-brand-logo"), type: "logo" },
      { el: modal.querySelector("#f-brand-bg"), type: "background" },
      { el: modal.querySelector("#f-brand-bg-mobile"), type: "background_mobile" }
    ]
    await Promise.all(fileInputs.map(async ({ el, type }) => {
      if (!el || !el.files || !el.files[0]) return
      const file = el.files[0]
      const reader = new FileReader()
      reader.readAsDataURL(file)
      await new Promise(resolve => { reader.onload = resolve })
      const base64 = reader.result.split(",")[1]
      await uploadAsset(newId, type, base64, file.type)
    }))

    modal.closest(".modal-overlay").remove()
    renderBrands(document.getElementById("section-content"))
  }
}

// ─── SUCURSALES ───
async function renderSucursales(container) {
  sucursales = await listSucursales()
  brands = await listBrands()

  const brandOpts = brands.map(b => `<option value="${b.id}">${b.name}</option>`).join("")

  container.innerHTML = `
    <div class="section-header">
      <h2>Sucursales</h2>
      <button class="btn btn-primary" id="btn-add-sucursal">+ Nueva sucursal</button>
    </div>
    <div class="table-wrap"><div class="empty">Cargando...</div></div>
  `

  const wrap = container.querySelector(".table-wrap")

  if (sucursales.length === 0) {
    wrap.innerHTML = "<div class='empty'>No hay sucursales registradas</div>"
  } else {
    const brandMap = {}
    brands.forEach(b => brandMap[b.id] = b.name)

    wrap.innerHTML = `
      <table>
        <thead><tr><th>Nombre</th><th>Dirección</th><th>Marca</th><th></th></tr></thead>
        <tbody>
          ${sucursales.map(s => `<tr>
            <td><strong>${s.name}</strong></td>
            <td style="color:rgba(255,255,255,0.4)">${s.address || "—"}</td>
            <td style="color:rgba(255,255,255,0.4)">${brandMap[s.brand_id] || "—"}</td>
            <td class="actions">
              <button class="btn btn-sm btn-ghost" data-edit="${s.brand_id}::${s.name}">Editar</button>
              <button class="btn btn-sm btn-danger" data-del="${s.brand_id}::${s.name}">Eliminar</button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>
    `
  }

  document.getElementById("btn-add-sucursal").onclick = () => sucursalForm()

  wrap.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const [bid, name] = btn.dataset.edit.split("::")
      sucursalForm(bid, name)
    }
  })
  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      const [bid, name] = btn.dataset.del.split("::")
      if (!confirm(`¿Eliminar sucursal "${name}"?`)) return
      await deleteSucursal(bid, name)
      renderSucursales(container)
    }
  })
}

async function sucursalForm(brandId, sucursalName) {
  const isEdit = !!sucursalName
  const existing = isEdit ? sucursales.find(s => s.brand_id === brandId && s.name === sucursalName) : null
  const brandOpts = brands.map(b =>
    `<option value="${b.id}" ${existing && existing.brand_id === b.id ? "selected" : ""}>${b.name}</option>`
  ).join("")

  const modal = showModal(`
    <h3>${isEdit ? "Editar sucursal" : "Nueva sucursal"}</h3>
    <label>Nombre</label>
    <input type="text" id="f-s-name" value="${existing?.name || ""}" required>
    <label>Dirección</label>
    <input type="text" id="f-s-address" value="${existing?.address || ""}" placeholder="Dirección / ubicación">
    <label>Marca</label>
    <select id="f-s-brand">${brandOpts}</select>
    <div class="form-actions">
      <button class="btn btn-ghost" id="btn-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="btn-modal-save">${isEdit ? "Guardar" : "Crear"}</button>
    </div>
  `)

  modal.querySelector("#btn-modal-cancel").onclick = () => modal.closest(".modal-overlay").remove()
  modal.querySelector("#btn-modal-save").onclick = async () => {
    const name = modal.querySelector("#f-s-name").value.trim()
    const address = modal.querySelector("#f-s-address").value.trim()
    const brand_id = modal.querySelector("#f-s-brand").value
    if (!name || !brand_id) return

    if (isEdit) {
      await updateSucursal({ brand_id: existing.brand_id, name: sucursalName, name, address })
    } else {
      await createSucursal({ brand_id, name, address })
    }
    modal.closest(".modal-overlay").remove()
    renderSucursales(document.getElementById("section-content"))
  }
}

// ─── VENDORS ───
async function renderVendors(container) {
  vendors = await listVendors()
  brands = await listBrands()
  sucursales = await listSucursales()

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
      <thead><tr><th>Nombre</th><th>Teléfono</th><th>Marca</th><th>Sucursal</th><th>Estado</th><th>Horario</th><th></th></tr></thead>
      <tbody>
        ${filtered.map(v => {
          const schedule = v.schedule || {}
          const hasSchedule = Object.values(schedule).some(d => d?.active)
          return `<tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.phone}</td>
            <td style="color:rgba(255,255,255,0.4)">${brandMap[v.brand_id] || "—"}</td>
            <td style="color:rgba(255,255,255,0.4)">${v.sucursal_name || "—"}</td>
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

  const filteredSucursales = vendor
    ? sucursales.filter(s => s.brand_id === vendor.brand_id)
    : sucursales
  const sucursalOpts = filteredSucursales.map(s =>
    `<option value="${s.name}" ${vendor && vendor.sucursal_name === s.name ? "selected" : ""}>${s.name}</option>`
  ).join("")

  const modal = showModal(`
    <h3>${isEdit ? "Editar vendedor" : "Nuevo vendedor"}</h3>
    <label>Nombre</label>
    <input type="text" id="f-v-name" value="${vendor?.name || ""}" required>
    <label>Teléfono</label>
    <input type="text" id="f-v-phone" value="${vendor?.phone || ""}" placeholder="5493815272820" required>
    <label>Marca</label>
    <select id="f-v-brand">${brandOpts}</select>
    <label>Sucursal</label>
    <select id="f-v-sucursal">
      <option value="">Sin sucursal</option>
      ${sucursalOpts}
    </select>
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

  modal.querySelector("#f-v-brand").onchange = () => {
    const bid = modal.querySelector("#f-v-brand").value
    const filtered = sucursales.filter(s => s.brand_id === bid)
    const sel = modal.querySelector("#f-v-sucursal")
    sel.innerHTML = "<option value=''>Sin sucursal</option>" + filtered.map(s =>
      `<option value="${s.name}">${s.name}</option>`
    ).join("")
  }

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
      sucursal_name: modal.querySelector("#f-v-sucursal").value,
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
  vendors = await listVendors()
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
    const filtered = brandId ? vendors.filter(v => v.brand_id === brandId) : vendors
    const vendorSelect = container.querySelector("#ev-filter-vendor")
    vendorSelect.innerHTML = "<option value=''>Todos</option>" + filtered.map(v => `<option value="${v.id}">${v.name}</option>`).join("")
  }

  container.querySelector("#ev-filter-btn").onclick = () => {
    eventsFilters.brand_id = container.querySelector("#ev-filter-brand").value
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

  const brandMap = {}
  brands.forEach(b => brandMap[b.id] = b.name)

  wrap.innerHTML = `
    <table>
      <thead><tr><th>Vendedor</th><th>Marca</th><th>IP</th><th>Fecha</th></tr></thead>
      <tbody>
        ${events.map(e => {
          const date = new Date(e.created_at).toLocaleString("es-AR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })
          return `<tr>
            <td><strong>${e.vendor?.name || "—"}</strong></td>
            <td style="color:rgba(255,255,255,0.4)">${brandMap[e.brand_id] || "—"}</td>
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
