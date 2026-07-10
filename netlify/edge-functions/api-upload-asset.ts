import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyToken } from "./_shared/auth.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BUCKET = "brand-assets"

const MAX_LOGO = 5 * 1024 * 1024      // 5 MB
const MAX_BG   = 10 * 1024 * 1024     // 10 MB

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 })
  }

  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  try {
    const { brand_id, asset_type, file_base64, mime_type } = await req.json()

    if (!brand_id || !asset_type || !file_base64) {
      return new Response(JSON.stringify({ error: "brand_id_asset_type_file_base64_required" }), { status: 400 })
    }

    const validTypes = ["logo", "background", "background_mobile"]
    if (!validTypes.includes(asset_type)) {
      return new Response(JSON.stringify({ error: "asset_type_invalid" }), { status: 400 })
    }

    const ext = (mime_type || "image/png").split("/")[1] || "png"
    const fileName = asset_type === "logo" ? `logo.${ext}` : asset_type === "background" ? `bg.${ext}` : `bg-mobile.${ext}`
    const filePath = `${brand_id}/${fileName}`

    const raw = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0))
    const limit = asset_type === "logo" ? MAX_LOGO : MAX_BG

    if (raw.length > limit) {
      return new Response(JSON.stringify({ error: "file_too_large" }), { status: 413 })
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, raw, {
        contentType: mime_type || "image/png",
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    const column = asset_type === "logo" ? "logo_url" : asset_type === "background" ? "background_url" : "background_mobile_url"

    const { error: updateError } = await supabase
      .from("brands")
      .update({ [column]: publicUrl })
      .eq("id", brand_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "server_error" }), { status: 500 })
  }
}
