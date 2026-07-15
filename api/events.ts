import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("events")
      .select("*, vendor:vendor_id(name)", { count: "exact" });

    if (brandId) query = query.eq("brand_id", brandId);
    if (vendorId) query = query.eq("vendor_id", vendorId);

    if (days) {
      const since = new Date(Date.now() - parseInt(days, 10) * 86400000).toISOString();
      query = query.gte("created_at", since);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({ data, total: count || 0, page, limit });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server_error" });
  }
};
