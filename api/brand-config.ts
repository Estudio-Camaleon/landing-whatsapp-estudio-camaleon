import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBrandByDomain, getBrandBySlug } from "./_lib/brands-data";

export default async (req: VercelRequest, res: VercelResponse) => {
  const slug = req.query.slug as string;
  const host = req.headers["host"] || "";

  let brand = slug ? getBrandBySlug(slug) : null;
  if (!brand) brand = getBrandByDomain(host);

  if (!brand) {
    return res.status(404).json({ error: "brand_not_found" });
  }

  return res.status(200).json({
    slug: brand.id,
    logo_url: brand.logo || null,
    background_url: brand.background || null,
    background_mobile_url: brand.backgroundMobile || null
  });
};
