import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getBrandByDomain, getBrandBySlug, getDefaultBrand } from "./_lib/brands-data";

export default async (req: VercelRequest, res: VercelResponse) => {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const host = req.headers["host"] || "";
  const brandSlug = req.query.brand as string;

  let brand = brandSlug ? await getBrandBySlug(brandSlug) : null;
  if (!brand) brand = await getBrandByDomain(host);
  if (!brand) brand = getDefaultBrand();

  const vendors = brand.employees.map((e, i) => ({
    id: i + 1,
    brand_id: brand.id,
    name: e.name,
    phone: atob(e.phone),
    active: true,
    schedule: {}
  }));

  return res.status(200).json(vendors);
};
