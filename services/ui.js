import { CONFIG } from "./config.js";
import { showLoading, hideLoading } from "./themes.js";

var SELECTED_SUCURSAL = null;

export { SELECTED_SUCURSAL };

// ─── Sucursal Selector ──────────────────────────────────────────

function renderSucursalSelector() {
  var sucursales = CONFIG.sucursales || [];
  var container = document.getElementById("sucursal-selector");
  if (!container || sucursales.length === 0) return;

  container.innerHTML = "";

  if (sucursales.length === 1) {
    SELECTED_SUCURSAL = sucursales[0].name;
    updateSucursalState();
    return;
  }

  sucursales.forEach(function(s, i) {
    var btn = document.createElement("button");
    btn.className = "sucursal-btn";
    btn.textContent = s.name;
    btn.title = s.address;

    btn.addEventListener("click", function() {
      if (SELECTED_SUCURSAL === s.name) {
        SELECTED_SUCURSAL = null;
        btn.classList.remove("active");
      } else {
        SELECTED_SUCURSAL = s.name;
        container.querySelectorAll(".sucursal-btn").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
      }
      updateSucursalState();
    });

    container.appendChild(btn);
  });
}

function updateSucursalState() {
  var sellerEl = document.getElementById("assigned-seller");
  if (SELECTED_SUCURSAL) {
    sellerEl.textContent = "Sucursal: " + SELECTED_SUCURSAL;
    sellerEl.style.display = "";
  } else {
    sellerEl.textContent = "Sin sucursal seleccionada — se asignar\u00E1 un vendedor al azar";
    sellerEl.style.display = "";
  }
}

// ─── Cooldown ──────────────────────────────────────────────────

var COOLDOWN_INTERVAL = null;

function cooldownKey() {
  var slug = CONFIG && CONFIG.slug ? CONFIG.slug : "default";
  return "wa-cooldown-" + slug;
}

function getCooldownEnd() {
  var val = localStorage.getItem(cooldownKey());
  return val ? parseInt(val, 10) : 0;
}

function setCooldownEnd(ms) {
  localStorage.setItem(cooldownKey(), String(ms));
}

function clearCooldownStorage() {
  localStorage.removeItem(cooldownKey());
}

function formatCountdown(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function renderCooldown(wrapper, remaining) {
  wrapper.innerHTML =
    '<div class="cooldown-icon">' +
      '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
    '</div>' +
    '<p class="cooldown-text">Ya te pusiste en contacto con un vendedor</p>' +
    '<p class="cooldown-timer">' + formatCountdown(remaining) + '</p>' +
    '<p class="cooldown-hint">Esper\u00E1 este tiempo antes de volver a intentar</p>';
}

function hideCooldown() {
  if (COOLDOWN_INTERVAL) {
    clearInterval(COOLDOWN_INTERVAL);
    COOLDOWN_INTERVAL = null;
  }
  var existing = document.getElementById("cooldown-message");
  if (existing) existing.remove();
  var btn = document.getElementById("cta-button");
  if (btn) btn.style.display = "";
  var sellerEl = document.getElementById("assigned-seller");
  if (sellerEl) sellerEl.style.display = "";
  clearCooldownStorage();
}

function showCooldown() {
  var btn = document.getElementById("cta-button");
  var sellerEl = document.getElementById("assigned-seller");

  btn.style.display = "none";
  if (sellerEl) sellerEl.style.display = "none";

  var existing = document.getElementById("cooldown-message");
  if (existing) existing.remove();

  var end = getCooldownEnd();
  if (!end) {
    end = Date.now() + 300000;
    setCooldownEnd(end);
  }

  var wrapper = document.createElement("div");
  wrapper.id = "cooldown-message";
  wrapper.className = "cooldown-message";
  btn.parentNode.insertBefore(wrapper, btn.nextSibling);

  function tick() {
    var remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
    if (remaining <= 0) {
      hideCooldown();
      return;
    }
    renderCooldown(wrapper, remaining);
  }

  tick();
  if (COOLDOWN_INTERVAL) clearInterval(COOLDOWN_INTERVAL);
  COOLDOWN_INTERVAL = setInterval(tick, 1000);
}

// ─── Assign Confirm ────────────────────────────────────────────

function showAssignConfirm(data) {
  var btn = document.getElementById("cta-button");
  var sellerEl = document.getElementById("assigned-seller");

  btn.style.display = "none";
  if (sellerEl) sellerEl.style.display = "none";

  var existing = document.getElementById("assign-confirm");
  if (existing) existing.remove();

  var wrapper = document.createElement("div");
  wrapper.id = "assign-confirm";
  wrapper.className = "assign-confirm";

  wrapper.innerHTML =
    '<div class="confirm-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>' +
    '<p class="confirm-text">Te asignamos a <strong>' + data.vendor.name + '</strong></p>' +
    '<p class="confirm-hint">Hac\u00E9 clic en el bot\u00F3n para ir a WhatsApp</p>' +
    '<a class="confirm-btn" href="' + data.whatsappUrl + '" target="_blank" rel="noopener">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>' +
      'Ir a WhatsApp' +
    '</a>';

  btn.parentNode.insertBefore(wrapper, btn.nextSibling);

  var waBtn = wrapper.querySelector(".confirm-btn");
  if (waBtn) {
    waBtn.addEventListener("click", function() {
      setCooldownEnd(Date.now() + 300000);
      showCooldown();
    });
  }
}

// ─── Vendor Error ──────────────────────────────────────────────

function showVendorError() {
  var btn = document.getElementById("cta-button");
  var sellerEl = document.getElementById("assigned-seller");

  btn.style.display = "none";
  if (sellerEl) sellerEl.style.display = "none";

  var existing = document.getElementById("vendor-error");
  if (existing) return;

  var wrapper = document.createElement("div");
  wrapper.id = "vendor-error";
  wrapper.className = "vendor-error";

  var icon = document.createElement("div");
  icon.className = "vendor-error-icon";
  icon.innerHTML =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  wrapper.appendChild(icon);

  var text = document.createElement("p");
  text.className = "vendor-error-text";
  text.textContent = "Servicio temporalmente no disponible";
  wrapper.appendChild(text);

  var hint = document.createElement("p");
  hint.className = "vendor-error-hint";
  hint.textContent = "Estamos trabajando para atenderte mejor. Por favor, intent\u00E1 m\u00E1s tarde.";
  wrapper.appendChild(hint);

  btn.parentNode.insertBefore(wrapper, btn.nextSibling);
}

export {
  renderSucursalSelector,
  updateSucursalState,
  getCooldownEnd,
  showCooldown,
  hideCooldown,
  showAssignConfirm,
  showVendorError
};
