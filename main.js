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
    background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #4a1942 70%, #8b5a2b 100%)",
    cardBg: "rgba(20, 5, 40, 0.5)",
    cardBorder: "rgba(255, 215, 0, 0.12)",
    cardShadow: "0 25px 60px -12px rgba(80, 40, 120, 0.6)",
    orb1: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
    orb3: "radial-gradient(circle, #ec4899 0%, transparent 70%)"
  },
  libreria: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d44 30%, #3d2b1f 70%, #5c4033 100%)",
    cardBg: "rgba(25, 20, 15, 0.5)",
    cardBorder: "rgba(255, 255, 255, 0.07)",
    cardShadow: "0 25px 60px -12px rgba(60, 40, 20, 0.6)",
    orb1: "radial-gradient(circle, #d97706 0%, transparent 70%)",
    orb2: "radial-gradient(circle, #92400e 0%, transparent 70%)",
    orb3: "radial-gradient(circle, #fbbf24 0%, transparent 70%)"
  },
  indumentaria: {
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

// ─── Mouse Glow ──────────────────────────────────────────────
function initMouseGlow() {
  var glow = document.createElement("div");
  glow.className = "mouse-glow";
  document.body.appendChild(glow);
  var raf = null;
  var mx = -999, my = -999;

  document.addEventListener("mousemove", function(e) {
    mx = e.clientX;
    my = e.clientY;
    if (!raf) {
      raf = requestAnimationFrame(function() {
        glow.style.transform = "translate(" + mx + "px, " + my + "px) translate(-50%, -50%)";
        raf = null;
      });
    }
  });

  document.addEventListener("mouseleave", function() {
    glow.style.opacity = "0";
  });

  document.addEventListener("mouseenter", function() {
    glow.style.opacity = "1";
  });
}

// ─── Particles ───────────────────────────────────────────────
function initParticles() {
  var container = document.createElement("div");
  container.className = "particles-container";
  for (var i = 0; i < 10; i++) {
    var p = document.createElement("div");
    p.className = "particle";
    container.appendChild(p);
  }
  document.body.appendChild(container);
}

// ─── Tilt Effect ─────────────────────────────────────────────
function attachTilt(card) {
  var bounds, cx, cy;

  function onEnter() {
    bounds = card.getBoundingClientRect();
    cx = bounds.left + bounds.width / 2;
    cy = bounds.top + bounds.height / 2;
  }

  function onMove(e) {
    var x = e.clientX - cx;
    var y = e.clientY - cy;
    var rotY = (x / (bounds.width / 2)) * 6;
    var rotX = -(y / (bounds.height / 2)) * 6;
    card.style.transform =
      "perspective(800px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateY(-4px) scale(1.02)";
  }

  function onLeave() {
    card.style.transform = "";
  }

  card.addEventListener("mouseenter", onEnter, { passive: true });
  card.addEventListener("mousemove", onMove, { passive: true });
  card.addEventListener("mouseleave", onLeave, { passive: true });
}

// ─── Ripple ──────────────────────────────────────────────────
function attachRipple(card) {
  card.addEventListener("click", function(e) {
    var rect = card.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var size = Math.max(rect.width, rect.height) * 2;
    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x - size / 2 + "px";
    ripple.style.top = y - size / 2 + "px";
    card.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 700);
  });
}

// ─── Page Transition ─────────────────────────────────────────
function attachPageTransition(card) {
  var href = card.getAttribute("href");
  card.addEventListener("click", function(e) {
    e.preventDefault();
    var accent = getComputedStyle(card).getPropertyValue("--store-accent").trim() || "#667eea";
    var overlay = document.createElement("div");
    overlay.className = "page-transition";
    overlay.style.setProperty("--store-accent", accent);
    document.body.appendChild(overlay);
    requestAnimationFrame(function() {
      overlay.classList.add("active");
    });
    setTimeout(function() {
      window.location.href = href;
    }, 500);
  });
}

var STORE_ICONS = {
  maggiestore: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  aventus: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  tuslibrosya: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
};

var STORE_DESCS = {
  maggiestore: "Indumentaria y accesorios",
  aventus: "Perfumería de diseño",
  tuslibrosya: "Librería y papelería"
};

var STORE_BADGE = {
  maggiestore: "Ropa",
  aventus: "Perfumes",
  tuslibrosya: "Libros"
};

function renderStoreSelector() {
  var stores = CONFIG.stores || [];
  var grid = document.getElementById("stores-grid");
  grid.innerHTML = "";

  var brandMap = window.__brands || {};
  var brandById = {};
  for (var key in brandMap) {
    var b = brandMap[key];
    if (b.id) brandById[b.id] = b;
  }

  stores.forEach(function(store) {
    var info = brandById[store.slug] || {};
    var theme = THEMES[info.theme] || THEMES.indumentaria;
    var mainColor = theme.orb1.match(/#[a-f0-9]{6}/i);
    mainColor = mainColor ? mainColor[0] : "#667eea";
    var slug = store.slug;

    var card = document.createElement("a");
    card.className = "store-card";
    card.href = "?brand=" + slug;
    card.style.setProperty("--store-accent", mainColor);

    var accentBar = document.createElement("div");
    accentBar.className = "store-card-accent-bar";
    card.appendChild(accentBar);

    var shine = document.createElement("div");
    shine.className = "store-card-shine";
    card.appendChild(shine);

    var icon = document.createElement("div");
    icon.className = "store-card-icon";
    icon.innerHTML = STORE_ICONS[slug] || STORE_ICONS.tuslibrosya;
    card.appendChild(icon);

    var infoWrap = document.createElement("div");
    infoWrap.className = "store-card-info";

    var nameEl = document.createElement("span");
    nameEl.className = "store-card-name";
    nameEl.textContent = store.name;
    infoWrap.appendChild(nameEl);

    var desc = document.createElement("span");
    desc.className = "store-card-desc";
    desc.textContent = STORE_DESCS[slug] || "";
    infoWrap.appendChild(desc);

    card.appendChild(infoWrap);

    var badge = document.createElement("span");
    badge.className = "store-card-badge";
    badge.textContent = STORE_BADGE[slug] || store.theme;
    card.appendChild(badge);

    var arrow = document.createElement("span");
    arrow.className = "store-card-arrow";
    arrow.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
    card.appendChild(arrow);

    attachRipple(card);
    attachTilt(card);
    attachPageTransition(card);

    grid.appendChild(card);
  });
}

async function init() {
  // ─── Store Selector Mode ──────────────────────────────
  if (CONFIG.id === "selector") {
    document.getElementById("card-brand").style.display = "none";
    document.getElementById("store-selector").style.display = "block";
    document.title = CONFIG.title || "WhatsApp Landing";
    initParticles();
    initMouseGlow();
    renderStoreSelector();
    setTimeout(hideLoading, 800);
    return;
  }

  // ─── Normal Brand Mode ────────────────────────────────
  var brandName = window.location.hostname.replace(/^www\./, "").toLowerCase();
  var params = new URLSearchParams(window.location.search);
  if (params.get("brand")) brandName = params.get("brand");
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
