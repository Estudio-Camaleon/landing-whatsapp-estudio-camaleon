import "dotenv/config";
import express from "express";
import { existsSync } from "fs";
import { createServer } from "http";
import path from "path";
import rateLimit from "express-rate-limit";

// dotenv loads .env by default; also try .env.local
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const __dirname = process.cwd();
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "too_many_requests", message: "Demasiados intentos. Esperá un minuto." },
});

const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "too_many_requests", message: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
});

// ─── Static files ───
app.use("/apps", express.static(path.join(__dirname, "apps")));
app.use("/services", express.static(path.join(__dirname, "services")));
app.use(express.static(__dirname, { index: false }));

// ─── Import API handlers dynamically ───
async function loadHandler(modulePath) {
  try {
    const fullPath = path.resolve(__dirname, modulePath);
    // Windows needs file:// URLs for dynamic import()
    const fileUrl = fullPath.startsWith("/") ? fullPath : "file:///" + fullPath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    const handler = mod.default || mod;
    if (typeof handler === "function") return handler;
    console.warn(`  ⚠ ${modulePath}: export is not a function`);
    return null;
  } catch (err) {
    console.warn(`  ⚠ ${modulePath}: ${err.message}`);
    return null;
  }
}

function wrapHandler(fn) {
  return async (req, res) => {
    try {
      const vercelReq = {
        ...req,
        query: Object.fromEntries(
          Object.entries(req.query).map(([k, v]) => [k, String(v)])
        ),
        cookies: req.cookies || {},
        headers: req.headers,
        method: req.method,
        url: req.url,
        path: req.path,
      };
      // Express 5 uses async error handling - wrap in try/catch
      await Promise.resolve(fn(vercelReq, res));
    } catch (err) {
      console.error(`[${req.method} ${req.path}]`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "internal_error", message: err.message });
      }
    }
  };
}

const API_ROUTES = [
  { route: "/assign-vendor", modulePath: "./api/assign-vendor.js" },
  { route: "/auth/login", modulePath: "./api/auth/login.js" },
  { route: "/get-stats", modulePath: "./api/get-stats.js" },
  { route: "/get-vendors", modulePath: "./api/get-vendors.js" },
  { route: "/api/brand-config", modulePath: "./api/brand-config.js" },
  { route: "/api/public-brands", modulePath: "./api/public-brands.js" },
  { route: "/api/brands", modulePath: "./api/brands.js" },
  { route: "/api/vendors", modulePath: "./api/vendors.js" },
  { route: "/api/sucursales", modulePath: "./api/sucursales.js" },
  { route: "/api/events", modulePath: "./api/events.js" },
  { route: "/api/upload-asset", modulePath: "./api/upload-asset.js" },
];

async function init() {
  const total = API_ROUTES.length;
  let loaded = 0;

  console.log(`Loading ${total} API routes...\n`);

  for (const { route, modulePath } of API_ROUTES) {
    const fullPath = path.join(__dirname, modulePath);
    if (!existsSync(fullPath)) {
      console.warn(`  ⚠ ${route} -> ${modulePath} (not found)`);
      continue;
    }
    const handler = await loadHandler(modulePath);
    if (handler) {
      const limiter = route === "/auth/login" || route === "/assign-vendor" ? strictLimiter : defaultLimiter;
      app.all(route, limiter, wrapHandler(handler));
      loaded++;
      console.log(`  ✓ ${route}`);
    }
  }

  // ─── Admin app SPA ───
  app.get("/login", (_req, res) => {
    res.sendFile(path.join(__dirname, "apps", "admin", "login.html"));
  });
  app.get("/apps/admin", (_req, res) => {
    res.sendFile(path.join(__dirname, "apps", "admin", "index.html"));
  });
  // Admin static files
  app.get("/apps/admin/:file", (req, res) => {
    const filePath = path.join(__dirname, "apps", "admin", req.params.file);
    if (existsSync(filePath)) return res.sendFile(filePath);
    res.sendFile(path.join(__dirname, "apps", "admin", "index.html"));
  });

  // ─── SPA fallback ───
  app.get("/main.js", (_req, res) => {
    res.sendFile(path.join(__dirname, "main.js"));
  });
  app.get("/styles.css", (_req, res) => {
    res.sendFile(path.join(__dirname, "styles.css"));
  });

  // Catch-all: serve index.html for root
  app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
  });

  createServer(app).listen(PORT, () => {
    console.log(`\n🚀  Dev server running at http://localhost:${PORT}`);
    console.log(`   ${loaded}/${total} API routes loaded\n`);
  });
}

init().catch((err) => {
  console.error("Failed to start dev server:", err);
  process.exit(1);
});
