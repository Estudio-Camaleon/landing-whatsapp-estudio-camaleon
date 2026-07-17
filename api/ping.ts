import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (_req: VercelRequest, res: VercelResponse) => {
  res.status(200).json({ pong: true, node: process.version, env: Object.keys(process.env).filter(k => !k.includes("KEY") && !k.includes("SECRET") && !k.includes("PASSWORD")) });
};
