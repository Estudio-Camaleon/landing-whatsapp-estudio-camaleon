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
      SELECTED_SUCURSAL = s.name;
      container.querySelectorAll(".sucursal-btn").forEach(function(b) { b.classList.remove("active"); });
      btn.classList.add("active");
      updateSucursalState();
    });

    container.appendChild(btn);
  });
}

function updateSucursalState() {
  var btn = document.getElementById("cta-button");
  var sellerEl = document.getElementById("assigned-seller");

  if (SELECTED_SUCURSAL) {
    btn.classList.remove("disabled");
    btn.removeAttribute("aria-disabled");
    sellerEl.textContent = "Sucursal: " + SELECTED_SUCURSAL;
    sellerEl.style.display = "";
  } else {
    btn.classList.add("disabled");
    btn.setAttribute("aria-disabled", "true");
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

function showCooldown() {
  var btn = document.getElementById("cta-button");
  var sellerEl = document.getElementById("assigned-seller");

  btn.style.display = "none";
  if (sellerEl) sellerEl.style.display = "none";

  var wrapper = document.createElement("div");
  wrapper.id = "cooldown-message";
  wrapper.className = "cooldown-message";

  var icon = document.createElement("div");
  icon.className = "cooldown-icon";
  icon.innerHTML =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  wrapper.appendChild(icon);

  var text = document.createElement("p");
  text.className = "cooldown-text";
  text.textContent = "Ya te pusiste en contacto con un vendedor";
  wrapper.appendChild(text);

  var hint = document.createElement("p");
  hint.className = "cooldown-hint";
  hint.textContent = "Esper\u00E1 unos minutos antes de volver a intentar";
  wrapper.appendChild(hint);

  btn.parentNode.insertBefore(wrapper, btn.nextSibling);
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

  if (!SELECTED_SUCURSAL) return;

  try {
    showLoading();

    var data = await assignVendor(SELECTED_SUCURSAL);

    __secLog("INFO", "Vendedor asignado vía API", {
      sucursal: SELECTED_SUCURSAL,
      name: data.vendor.name,
      whatsappUrl: data.whatsappUrl
    });

    setTimeout(function() {
      window.location.href = data.whatsappUrl;
    }, 1200);
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
      renderBrandSelector();
      return;
    }
  }

  // ─── Dynamic brand via API (not in brands.js) ────────
  if (brandParam && CONFIG && CONFIG.id !== brandParam) {
    try {
      var res = await fetch("/api/brand-config?slug=" + encodeURIComponent(brandParam) + "&full=true");
      if (res.ok) {
        var data = await res.json();
        CONFIG = { ...CONFIG, ...data };
      }
    } catch (e) {}
  }

  // ─── Normal Brand Mode ────────────────────────────────
  var brandName = brandParam || window.location.hostname.replace(/^www\./, "").toLowerCase();
  await loadBrandAssets();

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
  var favicon = document.getElementById("favicon");
  if (favicon && logo && typeof logo === "string") {
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
    btn.classList.add("disabled");
    btn.setAttribute("aria-disabled", "true");
    renderSucursalSelector();
  }

  btn.addEventListener("click", handleClick);

  setTimeout(hideLoading, 800);
}

init();
