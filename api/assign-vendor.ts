import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const host = req.headers["host"] || "";
  const brandSlug = (req.query.brand as string) || null;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")?.[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    "unknown";

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
    const { data } = await supabase
      .from("brands").select("*").limit(1).single();
    brand = data;
  }

  if (!brand) {
    return res.status(404).json({ error: "brand_not_found" });
  }

  if (brand.active === false) {
    return res.status(503).json({ error: "brand_suspended" });
  }

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("events").select("*").eq("ip", ip).eq("brand_id", brand.id).gte("created_at", fiveMinAgo);

  if (recent && recent.length > 0) {
    return res.status(429).json({
      cooldown: true,
      message: "Esperá unos minutos antes de volver a intentar"
    });
  }

  const { data: vendors } = await supabase
    .from("vendors").select("*").eq("brand_id", brand.id).eq("active", true).order("id", { ascending: true });

  if (!vendors || vendors.length === 0) {
    return res.status(500).json({ error: "no_vendors" });
  }

  const { data: rotation } = await supabase
    .from("rotation_state").select("*").eq("brand_id", brand.id).single();

  let nextIndex = 0;
  if (rotation) {
    nextIndex = (rotation.last_vendor_index + 1) % vendors.length;
    await supabase.from("rotation_state").update({ last_vendor_index: nextIndex }).eq("brand_id", brand.id);
  } else {
    await supabase.from("rotation_state").insert({ brand_id: brand.id, last_vendor_index: 0 });
  }

  const vendor = vendors[nextIndex];
  const messages = ["Hola! Vengo de la web", "Buenas, quiero info", "Hola, me interesa un producto"];
  const message = messages[Math.floor(Math.random() * messages.length)];
  const whatsappUrl = `https://wa.me/${vendor.phone}?text=${encodeURIComponent(message)}`;

  await supabase.from("events").insert({
    brand_id: brand.id,
    vendor_id: vendor.id,
    ip,
    user_agent: req.headers["user-agent"] || null
  });

  return res.status(200).json({ vendor: { name: vendor.name }, whatsappUrl });
};
