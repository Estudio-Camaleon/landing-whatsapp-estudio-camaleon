import { createHmac } from "crypto";

function getSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

export async function signToken(payload) {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const sig = hmac.digest("base64");
  const payloadB64 = Buffer.from(data).toString("base64");
  return `${payloadB64}.${sig}`;
}

export async function verifyToken(token) {
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

    return payload;
  } catch {
    return null;
  }
}
