import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyToken } from "./_shared/auth.ts"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 })
  }

  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  const payload = await verifyToken(token)
  if (!payload) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 })
  }

  const url = new URL(req.url)
  const brandId = url.searchParams.get("brand_id")
  const vendorId = url.searchParams.get("vendor_id")
  const days = url.searchParams.get("days")
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200)

  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("events")
      .select("*, vendors(name)", { count: "exact" })

    if (brandId) query = query.eq("brand_id", brandId)
    if (vendorId) query = query.eq("vendor_id", vendorId)

    if (days) {
      const since = new Date(Date.now() - parseInt(days, 10) * 86400000).toISOString()
      query = query.gte("created_at", since)
    }

    query = query.order("created_at", { ascending: false }).range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return new Response(JSON.stringify({ data, total: count || 0, page, limit }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "server_error" }), { status: 500 })
  }
}
