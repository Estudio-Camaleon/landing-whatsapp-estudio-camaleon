import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyToken } from "./_shared/auth.ts"

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
  const brandSlug = url.searchParams.get("brand")

  let vendors, events

  if (brandSlug) {
    const { data: brand } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", brandSlug)
      .single()
    if (!brand) {
      return new Response(JSON.stringify({ error: "brand_not_found" }), { status: 404 })
    }
    const v = await supabase.from("vendors").select("id, name").eq("brand_id", brand.id)
    vendors = v.data
    const e = await supabase.from("events").select("vendor_id").eq("brand_id", brand.id)
    events = e.data
  } else {
    // Global stats (admin panel)
    const v = await supabase.from("vendors").select("id, name")
    vendors = v.data
    const e = await supabase.from("events").select("vendor_id")
    events = e.data
  }

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
