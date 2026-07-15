import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = "brand-assets";
const MAX_LOGO = 5 * 1024 * 1024;
const MAX_BG = 10 * 1024 * 1024;

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const { brand_id, asset_type, file_base64, mime_type } = req.body;

    if (!brand_id || !asset_type || !file_base64) {
      return res.status(400).json({ error: "brand_id_asset_type_file_base64_required" });
    }

    const validTypes = ["logo", "background", "background_mobile"];
    if (!validTypes.includes(asset_type)) {
      return res.status(400).json({ error: "asset_type_invalid" });
    }

    const ext = (mime_type || "image/png").split("/")[1] || "png";
    const fileName = asset_type === "logo" ? `logo.${ext}` : asset_type === "background" ? `bg.${ext}` : `bg-mobile.${ext}`;
    const filePath = `${brand_id}/${fileName}`;

    const raw = Buffer.from(file_base64, "base64");
    const limit = asset_type === "logo" ? MAX_LOGO : MAX_BG;

    if (raw.length > limit) {
      return res.status(413).json({ error: "file_too_large" });
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, raw, { contentType: mime_type || "image/png", upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const column = asset_type === "logo" ? "logo_url" : asset_type === "background" ? "background_url" : "background_mobile_url";

    const { error: updateError } = await supabase
      .from("brands")
      .update({ [column]: publicUrl })
      .eq("id", brand_id);

    if (updateError) throw updateError;

    return res.status(200).json({ url: publicUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server_error" });
  }
};
