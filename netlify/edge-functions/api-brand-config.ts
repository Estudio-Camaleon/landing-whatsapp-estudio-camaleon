import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async (req: Request) => {
  const url = new URL(req.url)
  const slug = url.searchParams.get("slug")
  const host = req.headers.get("host") || ""

  let brand = null

  if (slug) {
    const { data } = await supabase.from("brands").select("slug, logo_url, background_url, background_mobile_url").eq("slug", slug).single()
    brand = data
  }

  if (!brand) {
    const { data } = await supabase.from("brands").select("slug, logo_url, background_url, background_mobile_url").eq("domain", host).single()
    brand = data
  }

  if (!brand) {
    return new Response(JSON.stringify({ error: "brand_not_found" }), { status: 404 })
  }

  return new Response(JSON.stringify(brand), {
    headers: { "Content-Type": "application/json" }
  })
}
