import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAllBrands } from "./_lib/brands-data";

const THEME_ACCENTS: Record<string, string> = {
  perfumes: "#7c3aed",
  libreria: "#d97706",
  indumentaria: "#00c9fd",
};

export default async (_req: VercelRequest, res: VercelResponse) => {
  const brands = (await getAllBrands())
    .filter((b: any) => b.slug !== "default" && b.id !== "default")
    .map((b: any) => ({
      id: b.id,
      name: b.title || b.name,
      theme: b.theme || "indumentaria",
      slug: b.slug || b.id,
      logo: b.logo || null,
      logoWidth: b.logoWidth || null,
      logoHeight: b.logoHeight || null,
      accent: THEME_ACCENTS[b.theme || "indumentaria"] || "#667eea",
    }));

  return res.status(200).json(brands);
};
