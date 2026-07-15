import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: VercelRequest, res: VercelResponse) => {
  const slug = req.query.slug as string;
  const host = req.headers["host"] || "";

  let brand = null;

  if (slug) {
    const { data } = await supabase
      .from("brands").select("slug, logo_url, background_url, background_mobile_url").eq("slug", slug).single();
    brand = data;
  }

  if (!brand) {
    const { data } = await supabase
      .from("brands").select("slug, logo_url, background_url, background_mobile_url").eq("domain", host).single();
    brand = data;
  }

  if (!brand) {
    return res.status(404).json({ error: "brand_not_found" });
  }

  return res.status(200).json(brand);
};
