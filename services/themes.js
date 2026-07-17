import { CONFIG } from "./config.js";

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

export { THEMES, ICONS, applyTheme, updateBackground, watchBackground, showLoading, hideLoading };
