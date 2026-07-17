import { createHmac, randomBytes } from "crypto";

let JWT_SECRET: string | null = null;

function getSecret(): string {
  if (JWT_SECRET) return JWT_SECRET;
  const envSecret = process.env.JWT_SECRET;
  if (envSecret && envSecret.length >= 16) {
    JWT_SECRET = envSecret;
    return JWT_SECRET;
  }
  // Fallback solo para desarrollo: generar clave efímera
  if (process.env.NODE_ENV !== "production") {
    JWT_SECRET = randomBytes(32).toString("hex");
    console.warn("[auth] JWT_SECRET no configurado, usando clave generada (solo dev)");
    return JWT_SECRET;
  }
  throw new Error("JWT_SECRET debe configurarse en production");
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  const secret = getSecret();
  const fullPayload = {
    ...payload,
    iat: Date.now(),
    nbf: Date.now(),
  };
  const data = JSON.stringify(fullPayload);
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const sig = hmac.digest("base64");
  const payloadB64 = Buffer.from(data).toString("base64");
  return `${payloadB64}.${sig}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"));
    const secret = getSecret();

    const hmac = createHmac("sha256", secret);
    hmac.update(JSON.stringify(payload));
    const expectedSig = hmac.digest("base64");

    if (sigB64 !== expectedSig) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    if (payload.nbf && payload.nbf > Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}
