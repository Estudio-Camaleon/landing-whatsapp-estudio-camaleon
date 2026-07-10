import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async (req: Request) => {
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
    .select("id, name")
    .eq("brand_id", brand.id)

  const { data: events } = await supabase
    .from("events")
    .select("vendor_id")
    .eq("brand_id", brand.id)

  const counts = {}
  if (events) {
    events.forEach(e => {
      counts[e.vendor_id] = (counts[e.vendor_id] || 0) + 1
    })
  }

  const stats = {}
  if (vendors) {
    vendors.forEach(v => {
      stats[v.name] = counts[v.id] || 0
    })
  }

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" }
  })
}
