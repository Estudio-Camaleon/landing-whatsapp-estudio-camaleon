import type { VercelRequest, VercelResponse } from "@vercel/node";
import { signToken } from "../_lib/auth";

const LOGIN_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req: VercelRequest): string {
  return (
    (req.headers["x-vercel-forwarded-for"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")?.[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = LOGIN_ATTEMPTS.get(ip);
  if (!entry || now > entry.resetAt) {
    LOGIN_ATTEMPTS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const ip = getClientIp(req);

  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: "too_many_attempts", message: "Demasiados intentos. Esperá 15 minutos." });
  }

  const { user, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: "auth_not_configured" });
  }

  if (typeof user !== "string" || typeof password !== "string" || user !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = await signToken({ sub: user, exp: Date.now() + 86400000 });

  return res.status(200).json({ token });
};
