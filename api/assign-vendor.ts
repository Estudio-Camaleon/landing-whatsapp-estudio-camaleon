import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBrandByDomain, getBrandBySlug, getDefaultBrand, getBrandEmployees } from "./_lib/brands-data";
import {
  addEvent, getRecentEvents, getRotationState, setRotationState,
  getVendorsByBrand
} from "./_lib/store";

function getClientIp(req: VercelRequest): string {
  return (
    (req.headers["x-vercel-forwarded-for"] as string) ||
    (req.headers["x-real-ip"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")?.[0]?.trim() ||
    "unknown"
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === maxRetries - 1) throw err;
      if (err?.code === "PGRST204" || err?.message?.includes("conflict")) {
        await new Promise(r => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("max retries exceeded");
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const host = req.headers["host"] || "";
  const brandSlug = (req.query.brand as string) || null;
  const sucursalName = (req.query.sucursal as string) || null;

  const ip = getClientIp(req);

  let brand = brandSlug ? await getBrandBySlug(brandSlug) : null;
  if (!brand) brand = await getBrandByDomain(host);
  if (!brand) brand = getDefaultBrand();

  if ((brand as any).active === false) {
    return res.status(503).json({ error: "brand_suspended" });
  }

  // ─── Cooldown check (con mitigación de race condition) ───────────
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recent = await getRecentEvents(brand.id, ip, fiveMinAgo);

  if (recent.length > 0) {
    return res.status(429).json({
      cooldown: true,
      message: "Esperá unos minutos antes de volver a intentar"
    });
  }

  // ─── Build vendor list ────────────────────────────────────────────
  let vendorList: { id: string | null; name: string; phone: string }[] = [];
  const dynamicVendors = await getVendorsByBrand(brand.id, sucursalName || undefined);
  if (dynamicVendors.length > 0) {
    vendorList = dynamicVendors.map(v => ({ id: v.id, name: v.name, phone: v.phone }));
  } else {
    vendorList = getBrandEmployees(brand as any, sucursalName || undefined).map(e => ({
      id: null,
      name: e.name,
      phone: atob(e.phone),
    }));
  }

  if (vendorList.length === 0) {
    return res.status(500).json({ error: "no_vendors" });
  }

  // ─── Round-robin atómico ─────────────────────────────────────────
  const vendor = await withRetry(async () => {
    const rotation = await getRotationState(brand.id);
    let nextIndex = 0;
    if (rotation) {
      nextIndex = (rotation.last_vendor_index + 1) % vendorList.length;
    }
    await setRotationState({ brand_id: brand.id, last_vendor_index: nextIndex });
    return vendorList[nextIndex];
  });

  const decodedPhone = vendor.phone;

  const brandName = (brand as any).name || "";
  const messages = [
    "Hola! Vengo de la web de " + brandName + ", quería consultar sobre un producto",
    "Buenas! Te contacto desde la página de " + brandName + ", me interesaría recibir informacion",
    "Hola! Estuve viendo la web de " + brandName + " y queria hacer una consulta"
  ];
  const idx = Math.floor(Math.random() * messages.length);
  const message = messages[idx];
  const whatsappUrl = `https://wa.me/${decodedPhone}?text=${encodeURIComponent(message)}`;

  await addEvent({
    brand_id: brand.id,
    vendor_id: vendor.id,
    ip,
    user_agent: req.headers["user-agent"] || null,
    created_at: new Date().toISOString()
  });

  return res.status(200).json({ vendor: { name: vendor.name }, whatsappUrl });
};
