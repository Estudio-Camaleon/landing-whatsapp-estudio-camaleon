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

  const method = req.method
  const url = new URL(req.url)

  try {
    if (method === "GET") {
      const brandId = url.searchParams.get("brand_id")
      const vendorId = url.searchParams.get("id")

      if (vendorId) {
        const { data, error } = await supabase
          .from("vendors")
          .select("*")
          .eq("id", vendorId)
          .single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
      }

      let query = supabase.from("vendors").select("*").order("name")
      if (brandId) query = query.eq("brand_id", brandId)

      const { data, error } = await query
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
    }

    if (method === "POST") {
      const body = await req.json()
      const { brand_id, name, phone, schedule } = body

      if (!brand_id || !name || !phone) {
        return new Response(JSON.stringify({ error: "brand_id_name_phone_required" }), { status: 400 })
      }

      const { data, error } = await supabase
        .from("vendors")
        .insert({ brand_id, name, phone, schedule: schedule || {} })
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      })
    }

    if (method === "PUT") {
      const body = await req.json()
      const { id, name, phone, active, schedule } = body

      if (!id) {
        return new Response(JSON.stringify({ error: "id_required" }), { status: 400 })
      }

      const updates: Record<string, unknown> = {}
      if (name !== undefined) updates.name = name
      if (phone !== undefined) updates.phone = phone
      if (active !== undefined) updates.active = active
      if (schedule !== undefined) updates.schedule = schedule

      const { data, error } = await supabase
        .from("vendors")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
    }

    if (method === "DELETE") {
      const body = await req.json()
      const { id } = body

      if (!id) {
        return new Response(JSON.stringify({ error: "id_required" }), { status: 400 })
      }

      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
    }

    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || "server_error" }), { status: 500 })
  }
}
