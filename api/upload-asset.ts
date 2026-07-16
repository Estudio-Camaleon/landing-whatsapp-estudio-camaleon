import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getSupabase } from "./_lib/supabase";
import { updateBrand } from "./_lib/store";

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

  const { brand_id, asset_type, file_base64, mime_type } = req.body || {};

  if (!brand_id || !asset_type || !file_base64) {
    return res.status(400).json({ error: "brand_id_asset_type_file_base64_required" });
  }

  const allowedTypes = ["logo", "background", "background_mobile"];
  if (!allowedTypes.includes(asset_type)) {
    return res.status(400).json({ error: "asset_type must be logo, background, or background_mobile" });
  }

  const buffer = Buffer.from(file_base64, "base64");
  const ext = mime_type?.split("/")[1] || "png";
  const fileName = `${brand_id}/${asset_type}.${ext}`;

  const supabase = getSupabase();
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(fileName, buffer, {
      contentType: mime_type || "image/png",
      upsert: true,
    });

  if (uploadError) {
    return res.status(500).json({ error: "upload_failed", details: uploadError.message });
  }

  const { data: publicUrl } = supabase.storage
    .from("brand-assets")
    .getPublicUrl(fileName);

  const urlMap: Record<string, string> = {
    logo: "logo_url",
    background: "background_url",
    background_mobile: "background_mobile_url",
  };
  const dbField = urlMap[asset_type];

  await updateBrand(brand_id, { [dbField]: publicUrl.publicUrl });

  return res.status(200).json({ url: publicUrl.publicUrl });
};
