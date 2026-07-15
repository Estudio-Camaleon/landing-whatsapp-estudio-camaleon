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

  try {
    if (req.method === "GET") {
      const brandId = req.query.id as string;
      if (brandId) {
        const { data, error } = await supabase
          .from("brands").select("*").eq("id", brandId).single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      const { data, error } = await supabase
        .from("brands").select("*").order("name");
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { name, domain, slug } = req.body;
      if (!name) {
        return res.status(400).json({ error: "name_required" });
      }

      const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const { data, error } = await supabase
        .from("brands").insert({ name, domain: domain || null, slug: autoSlug }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PUT") {
      const { id, name, domain, slug, active } = req.body;
      if (!id) {
        return res.status(400).json({ error: "id_required" });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (domain !== undefined) updates.domain = domain;
      if (slug !== undefined) updates.slug = slug;
      if (active !== undefined) updates.active = active;

      const { data, error } = await supabase
        .from("brands").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "id_required" });
      }

      const { error } = await supabase
        .from("brands").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server_error" });
  }
};
