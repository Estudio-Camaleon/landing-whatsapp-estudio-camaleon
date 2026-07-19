import { signToken } from "../_lib/auth.js";
import { rateLimit, limits } from "../_lib/rate-limit.js";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const rejected = rateLimit(limits.strict)(req, res);
  if (rejected) return;

  const { user, password } = req.body;
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: "auth_not_configured" });
  }

  if (user !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = await signToken({ user, exp: Date.now() + 86400000 });

  return res.status(200).json({ token });
};
