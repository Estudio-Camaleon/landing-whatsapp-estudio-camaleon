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

if (!CONFIG) {
  console.error("[Brand] No hay configuración disponible");
  document.body.innerHTML = "<p style='color:white;text-align:center;padding:40px;font-family:sans-serif;'>Error: No hay configuración de marca</p>";
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

async function handleClick(e) {
  e.preventDefault();

  try {
    showLoading();

    var data = await assignVendor();

    __secLog("INFO", "Vendedor asignado vía API", {
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
    alert("Error al conectar con un asesor");
  }
}

function init() {
  var brandName = window.location.hostname.replace(/^www\./, "").toLowerCase();
  var params = new URLSearchParams(window.location.search);
  if (params.get("brand")) brandName = params.get("brand");

  __secLog("INFO", "P\u00E1gina cargada", {
    brand: brandName,
    theme: CONFIG.theme,
    userAgent: navigator.userAgent,
    referrer: document.referrer || "(directo)"
  });

  var heading = CONFIG.heading || "";
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

  btn.addEventListener("click", handleClick);

  setTimeout(hideLoading, 800);
}

init();
