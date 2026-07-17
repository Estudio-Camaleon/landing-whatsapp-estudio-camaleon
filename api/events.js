import { verifyToken } from "./_lib/auth.js";
import { getAllEvents } from "./_lib/store.js";

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const brandId = req.query.brand_id;
  const vendorId = req.query.vendor_id;
  const days = req.query.days;
  const page = parseInt(req.query.page || "1", 10);
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  let filtered = await getAllEvents();

  if (brandId) filtered = filtered.filter(e => e.brand_id === brandId);
  if (vendorId) filtered = filtered.filter(e => e.vendor_id === vendorId);

  if (days) {
    const since = Date.now() - parseInt(days, 10) * 86400000;
    filtered = filtered.filter(e => new Date(e.created_at).getTime() >= since);
  }

  const total = filtered.length;
  const from = (page - 1) * limit;
  const data = filtered.slice(from, from + limit);

  return res.status(200).json({ data, total, page, limit });
};
