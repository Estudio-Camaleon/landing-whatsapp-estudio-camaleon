import { assignVendor } from "./services/api.js";

// ─── Brand Detection ──────────────────────────────────────────
function detectBrand() {
  var brands = window.__brands || {};
  var hostname = window.location.hostname;
  var params = new URLSearchParams(window.location.search);
  var brandOverride = params.get("brand");

  if (brandOverride) {
    for (var key in brands) {
      if (brands[key].id === brandOverride) {
        return brands[key];
      }
    }
  }

  var cleanHost = hostname.replace(/^www\./, "").toLowerCase();
  if (brands[cleanHost]) {
    return brands[cleanHost];
  }

  return brands["default"] || null;
}

var CONFIG = detectBrand();
var SELECTED_SUCURSAL = null;

if (!CONFIG) {
  console.error("[Brand] No hay configuración disponible");
  document.body.innerHTML = "<p style='color:white;text-align:center;padding:40px;font-family:sans-serif;'>Error: No hay configuración de marca</p>";
}

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

// ─── Themes ──────────────────────────────────────────────────
const THEMES = {
  perfumes: {
    accent: "#7c3aed",
    background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #4a1942 70%, #8b5a2b 100%)",
    cardBg: "rgba(20, 5, 40, 0.5)",
    cardBorder: "rgba(255, 215, 0, 0.12)",
    cardShadow: "0 25px 60px -12px rgba(80, 40, 120, 0.6)",
    orb1: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
    orb3: "radial-gradient(circle, #ec4899 0%, transparent 70%)"
  },
  libreria: {
    accent: "#d97706",
    background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 30%, #3d2b1f 70%, #5c4033 100%)",
    cardBg: "rgba(25, 20, 15, 0.5)",
    cardBorder: "rgba(255, 255, 255, 0.07)",
    cardShadow: "0 25px 60px -12px rgba(60, 40, 20, 0.6)",
    orb1: "radial-gradient(circle, #d97706 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #92400e 0%, transparent 70%)",
    orb3: "radial-gradient(circle, #fbbf24 0%, transparent 70%)"
  },
  indumentaria: {
    accent: "#00c9fd",
    background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #302b63 60%, #24243e 100%)",
    cardBg: "rgba(10, 10, 30, 0.5)",
    cardBorder: "rgba(0, 201, 253, 0.12)",
    cardShadow: "0 25px 60px -12px rgba(0, 100, 200, 0.5)",
    orb1: "radial-gradient(circle, #00c9fd 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #fd08a7 0%, transparent 70%)",
    orb3: "radial-gradient(circle, #667eea 0%, transparent 70%)"
  }
};

const ICONS = {};

// ─── Security Logger ──────────────────────────────────────────────
(function() {
  var LOG_KEY = "wa-security-log";
  var MAX_LOGS = 200;
  var stored;

  try {
    stored = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch (e) {
    stored = [];
  }

  window.__secLog = function(level, message, data) {
    var entry = {
      ts: new Date().toISOString(),
      level: level,
      msg: message,
      data: data || null
    };

    stored.push(entry);
    if (stored.length > MAX_LOGS) {
      stored = stored.slice(-MAX_LOGS);
    }
    try { localStorage.setItem(LOG_KEY, JSON.stringify(stored)); } catch (e) {}

    return entry;
  };

  window.__secLogs = function() { return stored.slice(); };
  window.__secLogsClear = function() {
    stored = [];
    localStorage.removeItem(LOG_KEY);
  };
})();

function setBackground(bgFile, fallback) {
  if (bgFile) {
    document.body.style.background = "url('" + bgFile.replace(/'/g, "\\'") + "')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  } else if (fallback) {
    document.body.style.background = fallback;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  }
}

function applyTheme(themeId) {
  var theme = THEMES[themeId];
  if (!theme) return;

  CONFIG._themeGradient = theme.background;
  updateBackground();

  var root = document.documentElement;
  if (theme.cardBg) root.style.setProperty("--card-bg", theme.cardBg);
  if (theme.cardBorder) root.style.setProperty("--card-border", theme.cardBorder);
  if (theme.cardShadow) root.style.setProperty("--card-shadow", theme.cardShadow);

  var orbs = [".orb-1", ".orb-2", ".orb-3"];
  var orbGradients = [theme.orb1, theme.orb2, theme.orb3];
  orbs.forEach(function(sel, i) {
    var el = document.querySelector(sel);
    if (el && orbGradients[i]) el.style.background = orbGradients[i];
  });
}

var _mqListener = null;

function updateBackground() {
  var mobile = window.matchMedia("(max-width: 768px)").matches;
  var bgFile = mobile && CONFIG.backgroundMobile
    ? CONFIG.backgroundMobile
    : CONFIG.background;
  setBackground(bgFile, CONFIG._themeGradient);
}

function watchBackground() {
  if (_mqListener) return;
  var mq = window.matchMedia("(max-width: 768px)");
  _mqListener = function() { updateBackground(); };
  mq.addListener(_mqListener);
}

function showLoading() {
  var overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.style.display = "";
}

function hideLoading() {
  var overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  setTimeout(function() {
    overlay.style.display = "none";
  }, 500);
}

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

async function handleClick(e) {
  e.preventDefault();

  var hasSucursales = CONFIG.sucursales && CONFIG.sucursales.length > 0;
  if (hasSucursales && !SELECTED_SUCURSAL) {
    // Sin sucursal seleccionada → asigna vendedor aleatorio de la marca
    // (se pasa SELECTED_SUCURSAL = null, la API elige entre todos los vendedores)
  }

  try {
    showLoading();

    var params = new URLSearchParams(window.location.search);
    var brandParam = params.get("brand") || CONFIG.slug || "";
    var data = await assignVendor(SELECTED_SUCURSAL || "", brandParam);

    __secLog("INFO", "Vendedor asignado vía API", {
      sucursal: SELECTED_SUCURSAL,
      name: data.vendor.name,
      whatsappUrl: data.whatsappUrl
    });

    hideLoading();

    showAssignConfirm(data);
  } catch (err) {
    hideLoading();

    if (err.cooldown) {
      __secLog("INFO", "Cooldown activo (servidor)");
      showCooldown();
      return;
    }

    __secLog("ERROR", "Error al asignar vendedor", err);
    showVendorError();
  }
}

async function loadBrandAssets() {
  var slug = null;
  if (window.__brands) {
    for (var key in window.__brands) {
      if (window.__brands[key] === CONFIG) { slug = window.__brands[key].id; break; }
    }
  }
  if (!slug) slug = CONFIG.slug || null;
  var q = slug ? "?slug=" + slug : "";
  try {
    var res = await fetch("/api/brand-config" + q);
    if (!res.ok) return;
    var data = await res.json();
    if (data.logo_url) CONFIG.logo = data.logo_url;
    if (data.background_url) CONFIG.background = data.background_url;
    if (data.background_mobile_url) CONFIG.background_mobile = data.background_mobile_url;
  } catch (e) {}
}

async function renderBrandSelector() {
  document.getElementById("card-brand").style.display = "none";

  var body = document.body;
  body.style.background = "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 30%, #302b63 60%, #24243e 100%)";
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.backgroundAttachment = "fixed";

  var container = document.getElementById("store-selector");
  if (!container) {
    container = document.createElement("div");
    container.id = "store-selector";
    container.className = "store-selector";
    document.querySelector(".main-content").appendChild(container);
  }
  container.style.display = "block";
  container.innerHTML =
    '<h1 class="selector-heading">Elegí tu tienda</h1>' +
    '<p class="selector-sub">Seleccioná una marca para hablar con un vendedor</p>' +
    '<div class="stores-grid" id="stores-grid"></div>';

  var grid = document.getElementById("stores-grid");
  grid.innerHTML =
    '<div class="selector-loader"><div class="spinner" style="width:32px;height:32px;border-width:3px"></div></div>';

  function transitionTo(url) {
    var transition = document.createElement("div");
    transition.className = "page-transition";
    document.body.appendChild(transition);
    requestAnimationFrame(function() {
      transition.classList.add("active");
    });
    setTimeout(function() {
      window.location.href = url;
    }, 500);
  }

  try {
    var res = await fetch("/api/public-brands");
    if (!res.ok) throw new Error("fetch failed");
    var brands = await res.json();
    grid.innerHTML = "";
    brands.forEach(function(b, i) {
      var card = document.createElement("a");
      card.className = "store-card";
      card.href = "?brand=" + encodeURIComponent(b.slug || b.id);
      var accent = b.accent || "#667eea";
      card.style.setProperty("--store-accent", accent);
      card.style.animationDelay = (0.1 + i * 0.12) + "s";

      var iconHtml = b.logo
        ? '<img class="store-card-logo" src="' + escapeHtml(b.logo) + '" alt="' + escapeHtml(b.name) + '" loading="lazy" style="' +
          (b.logoWidth ? 'max-width:' + b.logoWidth + ';' : '') +
          (b.logoHeight ? 'max-height:' + b.logoHeight + ';' : '') + '">'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';

      var themeLabel = (b.theme || "").charAt(0).toUpperCase() + (b.theme || "").slice(1);

      card.innerHTML =
        '<div class="store-card-accent-bar"></div>' +
        '<div class="store-card-shine"></div>' +
        '<div class="store-card-icon">' + iconHtml + '</div>' +
        '<div class="store-card-info"><span class="store-card-name">' + escapeHtml(b.name || b.id) + '</span></div>' +
        '<span class="store-card-badge">' + themeLabel + '</span>' +
        '<span class="store-card-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>';

      card.addEventListener("click", function(e) {
        e.preventDefault();
        transitionTo(card.href);
      });

      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:20px">No hay tiendas disponibles</p>';
  }

  setTimeout(hideLoading, 800);
}

function escapeHtml(str) {
  var d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

async function init() {
  hideLoading();

  var params = new URLSearchParams(window.location.search);
  var brandParam = params.get("brand");

  // ─── Brand Selector Mode (root URL) ──────────────────
  if (!brandParam && CONFIG && CONFIG.id === "default") {
    var cleanHost = window.location.hostname.replace(/^www\./, "").toLowerCase();
    var hasSpecificHost = false;
    for (var k in window.__brands) {
      if (k !== "default" && k === cleanHost) { hasSpecificHost = true; break; }
    }
    if (!hasSpecificHost) {
      document.title = CONFIG.title || "WhatsApp Landing";
      var metaDesc = document.getElementById("meta-description");
      if (metaDesc) metaDesc.content = CONFIG.meta_description || "";
      renderBrandSelector();
      return;
    }
  }

  // ─── Dynamic brand via API (not in brands.js) ────────
  var isDynamicBrand = false;
  if (brandParam && CONFIG && CONFIG.id !== brandParam) {
    try {
      var res = await fetch("/api/brand-config?slug=" + encodeURIComponent(brandParam) + "&full=true");
      if (res.ok) {
        var data = await res.json();
        CONFIG = { ...CONFIG, ...data };
        isDynamicBrand = true;
      }
    } catch (e) {}
  }

  // ─── Normal Brand Mode ────────────────────────────────
  var brandName = brandParam || window.location.hostname.replace(/^www\./, "").toLowerCase();
  await loadBrandAssets();

  // Convert DB fields to display fields
  if (CONFIG.logo_url) CONFIG.logo = CONFIG.logo_url;
  if (CONFIG.background_url) CONFIG.background = CONFIG.background_url;
  if (CONFIG.background_mobile_url) CONFIG.background_mobile = CONFIG.background_mobile_url;
  if (isDynamicBrand) {
    if (CONFIG.meta_title) CONFIG.title = CONFIG.meta_title;
    else if (CONFIG.name) CONFIG.title = CONFIG.name;
    if (CONFIG.name) CONFIG.heading = "Habla con " + CONFIG.name;
  }

  __secLog("INFO", "P\u00E1gina cargada", {
    brand: brandName,
    theme: CONFIG.theme,
    userAgent: navigator.userAgent,
    referrer: document.referrer || "(directo)"
  });

  var hasSucursales = CONFIG.sucursales && CONFIG.sucursales.length > 0;
  var heading = hasSucursales ? (CONFIG.heading || "Elegí tu sucursal") : (CONFIG.heading || "");
  var buttonText = CONFIG.buttonText || "";
  var logo = CONFIG.logo || null;
  var logoWidth = CONFIG.logoWidth || null;
  var logoHeight = CONFIG.logoHeight || null;
  var theme = CONFIG.theme || "indumentaria";

  applyTheme(theme);
  watchBackground();

  var logoImg = document.getElementById("logo-img");
  var logoPlaceholder = document.getElementById("logo-placeholder");

  if (logo && typeof logo === "string") {
    logoImg.src = logo;
    logoImg.classList.add("visible");
    logoPlaceholder.style.display = "none";
    if (logoWidth) {
      logoImg.style.width = logoWidth;
      logoImg.style.maxWidth = logoWidth;
    }
    if (logoHeight && logoHeight !== "auto") logoImg.style.maxHeight = logoHeight;
  }

  document.getElementById("heading").textContent = heading;

  if (CONFIG.title) {
    document.title = CONFIG.title;
  }
  var metaDesc = document.getElementById("meta-description");
  if (metaDesc && CONFIG.meta_description) {
    metaDesc.content = CONFIG.meta_description;
  }
  var metaOgImage = document.getElementById("meta-og-image");
  if (metaOgImage && CONFIG.og_image) {
    metaOgImage.content = CONFIG.og_image;
  }
  var favicon = document.getElementById("favicon");
  if (favicon && CONFIG.favicon_url) {
    favicon.href = CONFIG.favicon_url;
  } else if (favicon && logo && typeof logo === "string") {
    favicon.href = logo;
  }

  var btn = document.getElementById("cta-button");

  var card = document.querySelector(".card");
  var logoContainer = document.querySelector(".card-logo");
  var headingEl = document.getElementById("heading");

  if (CONFIG.cardPadding) card.style.padding = CONFIG.cardPadding;
  if (CONFIG.logoMarginBottom) logoContainer.style.marginBottom = CONFIG.logoMarginBottom;
  if (CONFIG.logoOverflow) logoContainer.style.overflow = CONFIG.logoOverflow;
  if (CONFIG.headingMarginBottom) headingEl.style.marginBottom = CONFIG.headingMarginBottom;
  if (CONFIG.ctaPadding) btn.style.padding = CONFIG.ctaPadding;

  var ctaText = document.getElementById("cta-text");
  ctaText.textContent = buttonText;

  // ─── Sucursal Selector ──────────────────────────────
  if (hasSucursales) {
    if (!document.getElementById("sucursal-selector")) {
      var sel = document.createElement("div");
      sel.id = "sucursal-selector";
      sel.className = "sucursal-selector";
      logoContainer.parentNode.insertBefore(sel, logoContainer);
    }
    renderSucursalSelector();
  }

  btn.addEventListener("click", handleClick);

  // ─── Check persisted cooldown ──────────────────────
  var cooldownEnd = getCooldownEnd();
  if (cooldownEnd > Date.now()) {
    showCooldown();
  }

}

init();
