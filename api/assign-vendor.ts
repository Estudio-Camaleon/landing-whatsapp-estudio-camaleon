import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBrandByDomain, getBrandBySlug, getDefaultBrand, getBrandEmployees } from "./_lib/brands-data";
import { addEvent, getRecentEvents, getRotationState, setRotationState } from "./_lib/store";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const host = req.headers["host"] || "";
  const brandSlug = (req.query.brand as string) || null;
  const sucursalName = (req.query.sucursal as string) || null;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")?.[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    "unknown";

  let brand = brandSlug ? getBrandBySlug(brandSlug) : null;
  if (!brand) brand = getBrandByDomain(host);
  if (!brand) brand = getDefaultBrand();

  if (brand.active === false) {
    return res.status(503).json({ error: "brand_suspended" });
  }

  if (brand.sucursales && !sucursalName) {
    return res.status(400).json({ error: "sucursal_required" });
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const recent = getRecentEvents(brand.id, ip, fiveMinAgo);

  if (recent.length > 0) {
    return res.status(429).json({
      cooldown: true,
      message: "Esperá unos minutos antes de volver a intentar"
    });
  }

  const vendors = getBrandEmployees(brand, sucursalName || undefined);
  if (vendors.length === 0) {
    return res.status(500).json({ error: "no_vendors" });
  }

  const rotation = getRotationState(brand.id);
  let nextIndex = 0;
  if (rotation) {
    nextIndex = (rotation.last_vendor_index + 1) % vendors.length;
    setRotationState({ brand_id: brand.id, last_vendor_index: nextIndex });
  } else {
    setRotationState({ brand_id: brand.id, last_vendor_index: 0 });
  }

  const vendor = vendors[nextIndex];
  const decodedPhone = atob(vendor.phone);

  const messages = ["Hola! Vengo de la web", "Buenas, quiero info", "Hola, me interesa un producto"];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const whatsappUrl = `https://wa.me/${decodedPhone}?text=${encodeURIComponent(message)}`;

  addEvent({
    brand_id: brand.id,
    vendor_id: vendor.name,
    ip,
    user_agent: req.headers["user-agent"] || null,
    created_at: new Date().toISOString()
  });

  return res.status(200).json({ vendor: { name: vendor.name }, whatsappUrl });
};
