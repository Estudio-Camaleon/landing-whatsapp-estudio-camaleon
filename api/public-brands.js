import { getAllBrands } from "./_lib/brands-data.js";

const THEME_ACCENTS = {
  perfumes: "#7c3aed",
  libreria: "#d97706",
  indumentaria: "#00c9fd",
};

export default async (_req, res) => {
  const brands = (await getAllBrands())
    .filter((b) => b.slug !== "default" && b.id !== "default")
    .map((b) => ({
      id: b.id,
      name: b.title || b.name,
      theme: b.theme || "indumentaria",
      slug: b.slug || b.id,
      logo: b.logo || b.logo_url || null,
      logoWidth: b.logoWidth || null,
      logoHeight: b.logoHeight || null,
      accent: THEME_ACCENTS[b.theme || "indumentaria"] || "#667eea",
    }));

  return res.status(200).json(brands);
};
