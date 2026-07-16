import "dotenv/config";
import express from "express";
import { existsSync } from "fs";
import { createServer } from "http";
import path from "path";

// dotenv loads .env by default; also try .env.local
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const __dirname = process.cwd();
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json({ limit: "50mb" }));

// ─── Static files ───
app.use("/media", express.static(path.join(__dirname, "public", "media")));
app.use("/apps", express.static(path.join(__dirname, "apps")));
app.use("/services", express.static(path.join(__dirname, "services")));
app.use(express.static(__dirname, { index: false }));

// ─── Import API handlers dynamically ───
async function loadHandler(modulePath: string) {
  try {
    const fullPath = path.resolve(__dirname, modulePath);
    // Windows needs file:// URLs for dynamic import()
    const fileUrl = fullPath.startsWith("/") ? fullPath : "file:///" + fullPath.replace(/\\/g, "/");
    const mod = await import(fileUrl);
    const handler = mod.default || mod;
    if (typeof handler === "function") return handler;
    console.warn(`  ⚠ ${modulePath}: export is not a function`);
    return null;
  } catch (err: any) {
    console.warn(`  ⚠ ${modulePath}: ${err.message}`);
    return null;
  }
}

function wrapHandler(fn: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    try {
      const vercelReq = {
        ...req,
        query: Object.fromEntries(
          Object.entries(req.query).map(([k, v]: [string, any]) => [k, String(v)])
        ),
        cookies: req.cookies || {},
        headers: req.headers,
        method: req.method,
        url: req.url,
        path: req.path,
      };
      // Express 5 uses async error handling - wrap in try/catch
      await Promise.resolve(fn(vercelReq, res));
    } catch (err: any) {
      console.error(`[${req.method} ${req.path}]`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "internal_error", message: err.message });
      }
    }
  };
}

interface RouteEntry {
  route: string;
  modulePath: string;
}

const API_ROUTES: RouteEntry[] = [
  { route: "/assign-vendor", modulePath: "./api/assign-vendor.ts" },
  { route: "/auth/login", modulePath: "./api/auth/login.ts" },
  { route: "/get-stats", modulePath: "./api/get-stats.ts" },
  { route: "/get-vendors", modulePath: "./api/get-vendors.ts" },
  { route: "/api/brand-config", modulePath: "./api/brand-config.ts" },
  { route: "/api/public-brands", modulePath: "./api/public-brands.ts" },
  { route: "/api/brands", modulePath: "./api/brands.ts" },
  { route: "/api/vendors", modulePath: "./api/vendors.ts" },
  { route: "/api/sucursales", modulePath: "./api/sucursales.ts" },
  { route: "/api/events", modulePath: "./api/events.ts" },
  { route: "/api/upload-asset", modulePath: "./api/upload-asset.ts" },
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
      app.all(route, wrapHandler(handler));
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
  app.get("/brands.js", (_req, res) => {
    res.sendFile(path.join(__dirname, "brands.js"));
  });
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
