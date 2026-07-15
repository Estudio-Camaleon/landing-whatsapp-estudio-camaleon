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

  const host = req.headers["host"] || "";
  const brandSlug = req.query.brand as string;

  let brand = null;

  if (brandSlug) {
    const { data } = await supabase
      .from("brands").select("*").eq("slug", brandSlug).single();
    brand = data;
  }

  if (!brand) {
    const { data } = await supabase
      .from("brands").select("*").eq("domain", host).single();
    brand = data;
  }

  if (!brand) {
    return res.status(404).json({ error: "brand_not_found" });
  }

  const { data: vendors } = await supabase
    .from("vendors").select("*").eq("brand_id", brand.id);

  return res.status(200).json(vendors || []);
};
