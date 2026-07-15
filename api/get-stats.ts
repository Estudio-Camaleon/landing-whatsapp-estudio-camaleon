import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: VercelRequest, res: VercelResponse) => {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const brandSlug = req.query.brand as string;

  let vendors: any[] | null = null;
  let events: any[] | null = null;

  if (brandSlug) {
    const { data: brand } = await supabase
      .from("brands").select("*").eq("slug", brandSlug).single();
    if (!brand) {
      return res.status(404).json({ error: "brand_not_found" });
    }
    const v = await supabase.from("vendors").select("id, name").eq("brand_id", brand.id);
    vendors = v.data;
    const e = await supabase.from("events").select("vendor_id").eq("brand_id", brand.id);
    events = e.data;
  } else {
    const v = await supabase.from("vendors").select("id, name");
    vendors = v.data;
    const e = await supabase.from("events").select("vendor_id");
    events = e.data;
  }

  const counts: Record<string, number> = {};
  if (events) {
    events.forEach(e => {
      counts[e.vendor_id] = (counts[e.vendor_id] || 0) + 1;
    });
  }

  const stats: Record<string, number> = {};
  if (vendors) {
    vendors.forEach(v => {
      stats[v.name] = counts[v.id] || 0;
    });
  }

  return res.status(200).json(stats);
};
