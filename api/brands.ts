import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import {
  getAllBrands, getBrandById,
  createBrand, updateBrand, deleteBrand
} from "./_lib/store";

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
      const brand = getBrandById(brandId);
      if (!brand) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(brand);
    }
    return res.status(200).json(getAllBrands());
  }

  if (req.method === "POST") {
    const { name, slug, domain, theme } = req.body || {};
    if (!name) return res.status(400).json({ error: "name_required" });
    const id = slug || name.toLowerCase().replace(/\s+/g, "-");
    const brand = createBrand({
      id, name, slug: id, domain: domain || null,
      theme: theme || "indumentaria", active: true,
    });
    return res.status(201).json(brand);
  }

  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    if (!id) return res.status(400).json({ error: "id_required" });
    const brand = updateBrand(id, data);
    if (!brand) return res.status(404).json({ error: "not_found" });
    return res.status(200).json(brand);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id_required" });
    const ok = deleteBrand(id);
    if (!ok) return res.status(404).json({ error: "not_found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
