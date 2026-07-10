import { signToken } from "../_shared/auth.ts"

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405
    })
  }

  const { user, password } = await req.json()
  const adminUser = Deno.env.get("ADMIN_USER")
  const adminPass = Deno.env.get("ADMIN_PASSWORD")

  if (!adminUser || !adminPass) {
    return new Response(JSON.stringify({ error: "auth_not_configured" }), {
      status: 500
    })
  }

  if (user !== adminUser || password !== adminPass) {
    return new Response(JSON.stringify({ error: "invalid_credentials" }), {
      status: 401
    })
  }

  const token = await signToken({
    user,
    exp: Date.now() + 86400000
  })

  return new Response(JSON.stringify({ token }), {
    headers: { "Content-Type": "application/json" }
  })
}
