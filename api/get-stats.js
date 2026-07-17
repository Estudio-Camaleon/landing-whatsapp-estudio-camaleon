import { verifyToken } from "./_lib/auth.js";
import { getAllEvents, getAllVendors } from "./_lib/store.js";
import { getBrandBySlug, getBrandEmployees } from "./_lib/brands-data.js";

export default async (req, res) => {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const brandSlug = req.query.brand;
  const allEvents = await getAllEvents();

  let filteredEvents = allEvents;
  let vendors = [];

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

  const counts = {};
  filteredEvents.forEach(e => {
    counts[e.vendor_id] = (counts[e.vendor_id] || 0) + 1;
  });

  const stats = {};
  vendors.forEach(v => {
    stats[v.name] = counts[v.id] || 0;
  });

  return res.status(200).json(stats);
};
