import { verifyToken } from "./_lib/auth.js";
import { getSupabaseService } from "./_lib/supabase.js";
import { updateBrand } from "./_lib/store.js";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { brand_id, asset_type, file_base64, mime_type } = req.body || {};

  if (!brand_id || !asset_type || !file_base64) {
    return res.status(400).json({ error: "brand_id_asset_type_file_base64_required" });
  }

  const allowedTypes = ["logo", "background", "background_mobile", "favicon", "og_image"];
  if (!allowedTypes.includes(asset_type)) {
    return res.status(400).json({ error: "asset_type must be logo, background, background_mobile, favicon, or og_image" });
  }

  const buffer = Buffer.from(file_base64, "base64");
  const mimeExt = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/gif": "gif",
  };
  const ext = (mime_type && mimeExt[mime_type]) || mime_type?.split("/")[1] || "png";
  const fileName = `${brand_id}/${asset_type}.${ext}`;

  const supabase = getSupabaseService();
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

  const urlMap = {
    logo: "logo_url",
    background: "background_url",
    background_mobile: "background_mobile_url",
    favicon: "favicon_url",
    og_image: "og_image",
  };
  const dbField = urlMap[asset_type];

  await updateBrand(brand_id, { [dbField]: publicUrl.publicUrl });

  return res.status(200).json({ url: publicUrl.publicUrl });
};
