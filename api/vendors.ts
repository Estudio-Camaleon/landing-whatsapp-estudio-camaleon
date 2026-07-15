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
      const brandId = req.query.brand_id as string;
      const vendorId = req.query.id as string;

      if (vendorId) {
        const { data, error } = await supabase
          .from("vendors").select("*").eq("id", vendorId).single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      let query = supabase.from("vendors").select("*").order("name");
      if (brandId) query = query.eq("brand_id", brandId);

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { brand_id, name, phone, schedule } = req.body;
      if (!brand_id || !name || !phone) {
        return res.status(400).json({ error: "brand_id_name_phone_required" });
      }

      const { data, error } = await supabase
        .from("vendors").insert({ brand_id, name, phone, schedule: schedule || {} }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === "PUT") {
      const { id, name, phone, active, schedule, brand_id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "id_required" });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (active !== undefined) updates.active = active;
      if (schedule !== undefined) updates.schedule = schedule;
      if (brand_id !== undefined) updates.brand_id = brand_id;

      const { data, error } = await supabase
        .from("vendors").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: "id_required" });
      }

      const { error } = await supabase
        .from("vendors").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "method_not_allowed" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server_error" });
  }
};
