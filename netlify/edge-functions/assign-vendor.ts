import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async (req: Request) => {
  const url = new URL(req.url)
  const host = req.headers.get("host") || ""
  const brandSlug = url.searchParams.get("brand")

  // 1. Obtener IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"

  // 2. Detectar brand: ?brand=slug > dominio > fallback al primer brand
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
    const { data } = await supabase
      .from("brands")
      .select("*")
      .limit(1)
      .single()
    brand = data
  }

  if (!brand) {
    return new Response(JSON.stringify({ error: "brand_not_found" }), {
      status: 404
    })
  }

  if (brand.active === false) {
    return new Response(JSON.stringify({ error: "brand_suspended" }), {
      status: 503
    })
  }

  // 3. Rate limit (5 min)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const { data: recent } = await supabase
    .from("events")
    .select("*")
    .eq("ip", ip)
    .eq("brand_id", brand.id)
    .gte("created_at", fiveMinAgo)

  if (recent && recent.length > 0) {
    return new Response(
      JSON.stringify({
        cooldown: true,
        message: "Esperá unos minutos antes de volver a intentar"
      }),
      { status: 429 }
    )
  }

  // 4. Obtener vendedores activos
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("brand_id", brand.id)
    .eq("active", true)
    .order("id", { ascending: true })

  if (!vendors || vendors.length === 0) {
    return new Response(JSON.stringify({ error: "no_vendors" }), {
      status: 500
    })
  }

  // 5. Obtener estado de rotación
  const { data: rotation } = await supabase
    .from("rotation_state")
    .select("*")
    .eq("brand_id", brand.id)
    .single()

  let nextIndex = 0

  if (rotation) {
    nextIndex = (rotation.last_vendor_index + 1) % vendors.length

    await supabase
      .from("rotation_state")
      .update({ last_vendor_index: nextIndex })
      .eq("brand_id", brand.id)
  } else {
    await supabase.from("rotation_state").insert({
      brand_id: brand.id,
      last_vendor_index: 0
    })
  }

  const vendor = vendors[nextIndex]

  // 6. Mensaje dinámico
  const messages = [
    "Hola! Vengo de la web",
    "Buenas, quiero info",
    "Hola, me interesa un producto"
  ]

  const message =
    messages[Math.floor(Math.random() * messages.length)]

  const whatsappUrl = `https://wa.me/${vendor.phone}?text=${encodeURIComponent(
    message
  )}`

  // 7. Tracking
  await supabase.from("events").insert({
    brand_id: brand.id,
    vendor_id: vendor.id,
    ip,
    user_agent: req.headers.get("user-agent")
  })

  return new Response(
    JSON.stringify({
      vendor: {
        name: vendor.name
      },
      whatsappUrl
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  )
}
