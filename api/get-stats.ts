import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getAllEvents, getAllVendors } from "./_lib/store";
import { getBrandBySlug, getBrandEmployees } from "./_lib/brands-data";

export default async (req: VercelRequest, res: VercelResponse) => {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const brandSlug = req.query.brand as string;
  const allEvents = await getAllEvents();

  let filteredEvents = allEvents;
  let vendors: { id: string; name: string }[] = [];

  if (brandSlug) {
    const brand = await getBrandBySlug(brandSlug);
    if (!brand) return res.status(404).json({ error: "brand_not_found" });
    const staticVendors = getBrandEmployees(brand).map(e => ({ id: e.name, name: e.name }));
    const storeVendors = (await getAllVendors()).filter(v => v.brand_id === brand.id).map(v => ({ id: v.id, name: v.name }));
    vendors = [...new Map([...storeVendors, ...staticVendors].map(v => [v.id, v])).values()];
    filteredEvents = allEvents.filter(e => e.brand_id === brand.id);
  } else {
    const storeVendors = (await getAllVendors()).map(v => ({ id: v.id, name: v.name }));
    vendors = [...new Map(storeVendors.map(v => [v.id, v])).values()];
  }

  const counts: Record<string, number> = {};
  filteredEvents.forEach(e => {
    counts[e.vendor_id] = (counts[e.vendor_id] || 0) + 1;
  });

  const stats: Record<string, number> = {};
  vendors.forEach(v => {
    stats[v.name] = counts[v.id] || 0;
  });

  return res.status(200).json(stats);
};
