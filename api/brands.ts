import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getAllBrands, getBrandByDomain } from "./_lib/brands-data";

export default async (req: VercelRequest, res: VercelResponse) => {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (req.method === "GET") {
    const brandId = req.query.id as string;
    if (brandId) {
      const brands = getAllBrands();
      const brand = brands.find(b => b.id === brandId);
      if (!brand) return res.status(404).json({ error: "not_found" });
      return res.status(200).json({
        id: brand.id,
        name: brand.title || brand.id,
        slug: brand.id,
        domain: null,
        active: true,
        logo_url: brand.logo || null,
        background_url: brand.background || null,
        background_mobile_url: brand.backgroundMobile || null
      });
    }
    const data = getAllBrands().map(b => ({
      id: b.id,
      name: b.title || b.id,
      slug: b.id,
      domain: null,
      active: true,
      logo_url: b.logo || null,
      background_url: b.background || null,
      background_mobile_url: b.backgroundMobile || null
    }));
    return res.status(200).json(data);
  }

  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(501).json({ error: "read_only_mode" });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
