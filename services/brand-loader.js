import { CONFIG } from "./config.js";
import { hideLoading } from "./themes.js";

function escapeHtml(str) {
  var d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

async function loadBrandAssets() {
  var slug = CONFIG.slug || null;
  var q = slug ? "?slug=" + slug : "";
  try {
    var res = await fetch("/api/brand-config" + q);
    if (!res.ok) return;
    var data = await res.json();
    if (data.logo_url) CONFIG.logo = data.logo_url;
    if (data.background_url) CONFIG.background = data.background_url;
    if (data.background_mobile_url) CONFIG.background_mobile = data.background_mobile_url;
  } catch (e) {
    console.error("[brand-config] error al cargar assets", e);
  }
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
    '<div class="selector-loader"><div class="spinner"></div></div>';

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
        '<span class="store-card-badge">' + escapeHtml(themeLabel) + '</span>' +
        '<span class="store-card-arrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>';

      card.addEventListener("click", function(e) {
        e.preventDefault();
        transitionTo(card.href);
      });

      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = '<p class="error-message">No hay tiendas disponibles</p>';
  }

  setTimeout(hideLoading, 800);
}

export { loadBrandAssets, renderBrandSelector, escapeHtml };
