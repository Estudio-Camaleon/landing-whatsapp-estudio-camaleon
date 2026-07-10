import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyToken } from "../_shared/auth.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async (req: Request) => {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }
  const url = new URL(req.url)
  const host = req.headers.get("host") || ""
  const brandSlug = url.searchParams.get("brand")

  let brand = null

  if (brandSlug) {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", brandSlug)
      .single()
    brand = data
  }

  if (!brand) {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("domain", host)
      .single()
    brand = data
  }

  if (!brand) {
    return new Response(JSON.stringify({ error: "brand_not_found" }), {
      status: 404
    })
  }

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("brand_id", brand.id)

  return new Response(JSON.stringify(vendors || []), {
    headers: { "Content-Type": "application/json" }
  })
}
