import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllBrands } from "./_lib/brands-data";

export default async (_req: VercelRequest, res: VercelResponse) => {
  const brands = getAllBrands()
    .filter(b => b.id !== "selector" && b.id !== "default")
    .map(b => ({
      id: b.id,
      name: b.title || b.name,
      theme: b.theme || "indumentaria",
      slug: b.id,
    }));

  return res.status(200).json(brands);
};
