import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getAllEvents } from "./_lib/store";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const brandId = req.query.brand_id as string;
  const vendorId = req.query.vendor_id as string;
  const days = req.query.days as string;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 200);

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
