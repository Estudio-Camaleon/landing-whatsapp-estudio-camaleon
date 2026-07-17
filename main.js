import { CONFIG } from "./services/config.js";
import "./services/logger.js";
import { applyTheme, watchBackground, showLoading, hideLoading } from "./services/themes.js";
import { SELECTED_SUCURSAL, renderSucursalSelector, getCooldownEnd, showCooldown, hideCooldown, showAssignConfirm, showVendorError } from "./services/ui.js";
import { loadBrandAssets, renderBrandSelector } from "./services/brand-loader.js";
import { assignVendor } from "./services/api.js";

// ─── Click Handler ──────────────────────────────────────────────

async function handleClick(e) {
  e.preventDefault();

  var hasSucursales = CONFIG.sucursales && CONFIG.sucursales.length > 0;
  if (hasSucursales && !SELECTED_SUCURSAL) {
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

// ─── Init ──────────────────────────────────────────────────────

async function init() {
  hideLoading();

  var params = new URLSearchParams(window.location.search);
  var brandParam = params.get("brand");

  if (!brandParam && CONFIG && CONFIG.id === "default") {
    document.title = CONFIG.title || "WhatsApp Landing";
    var metaDesc = document.getElementById("meta-description");
    if (metaDesc) metaDesc.content = CONFIG.meta_description || "";
    renderBrandSelector();
    return;
  }

  var isDynamicBrand = false;
  if (brandParam && CONFIG && CONFIG.id !== brandParam) {
    try {
      var res = await fetch("/api/brand-config?slug=" + encodeURIComponent(brandParam) + "&full=true");
      if (res.ok) {
        var data = await res.json();
        Object.assign(CONFIG, data);
        isDynamicBrand = true;
      }
    } catch (e) {
      console.error("[brand-config] error al cargar assets (dynamic)", e);
    }
  }

  var brandName = brandParam || window.location.hostname.replace(/^www\./, "").toLowerCase();
  await loadBrandAssets();

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

  var cooldownEnd = getCooldownEnd();
  if (cooldownEnd > Date.now()) {
    showCooldown();
  }
}

init();
