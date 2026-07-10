const encoder = new TextEncoder()

function getSecret(): string {
  return Deno.env.get("ADMIN_PASSWORD") || ""
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const secret = getSecret()
  const data = encoder.encode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, data)
  const payloadB64 = btoa(JSON.stringify(payload))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${payloadB64}.${sigB64}`
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 2) return null

    const [payloadB64, sigB64] = parts
    const payload = JSON.parse(atob(payloadB64))
    const secret = getSecret()

    const data = encoder.encode(JSON.stringify(payload))
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const sig = new Uint8Array(atob(sigB64).split("").map(c => c.charCodeAt(0)))
    const valid = await crypto.subtle.verify("HMAC", key, sig, data)

    if (!valid) return null
    if (payload.exp && (payload.exp as number) < Date.now()) return null

    return payload
  } catch {
    return null
  }
}
