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
      const brandId = url.searchParams.get("id")
      if (brandId) {
        const { data, error } = await supabase
          .from("brands")
          .select("*")
          .eq("id", brandId)
          .single()
        if (error) throw error
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
      }

      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name")
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
    }

    if (method === "POST") {
      const body = await req.json()
      const { name, domain, slug } = body

      if (!name) {
        return new Response(JSON.stringify({ error: "name_required" }), { status: 400 })
      }

      const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

      const { data, error } = await supabase
        .from("brands")
        .insert({ name, domain: domain || null, slug: autoSlug })
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
      const { id, name, domain, slug } = body

      if (!id) {
        return new Response(JSON.stringify({ error: "id_required" }), { status: 400 })
      }

      const updates: Record<string, unknown> = {}
      if (name !== undefined) updates.name = name
      if (domain !== undefined) updates.domain = domain
      if (slug !== undefined) updates.slug = slug

      const { data, error } = await supabase
        .from("brands")
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
        .from("brands")
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
