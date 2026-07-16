import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import {
  getSucursalesByBrand, getAllSucursales,
  createSucursal, updateSucursal, deleteSucursal
} from "./_lib/store";

export default async (req: VercelRequest, res: VercelResponse) => {
  const authHeader = (req.headers["authorization"] as string) || "";
  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "unauthorized" });
  }

  if (req.method === "GET") {
    const brandId = req.query.brand_id as string;
    if (brandId) return res.status(200).json(await getSucursalesByBrand(brandId));
    return res.status(200).json(await getAllSucursales());
  }

  if (req.method === "POST") {
    const { brand_id, name, address } = req.body || {};
    if (!brand_id || !name) {
      return res.status(400).json({ error: "brand_id_name_required" });
    }
    const s = await createSucursal({ brand_id, name, address: address || "" });
    return res.status(201).json(s);
  }

  if (req.method === "PUT") {
    const { brand_id, name, old_name, ...data } = req.body || {};
    const lookupName = old_name || name;
    if (!brand_id || !lookupName) {
      return res.status(400).json({ error: "brand_id_name_required" });
    }
    const s = await updateSucursal(brand_id, lookupName, { name, ...data });
    if (!s) return res.status(404).json({ error: "not_found" });
    return res.status(200).json(s);
  }

  if (req.method === "DELETE") {
    const { brand_id, name } = req.body || {};
    if (!brand_id || !name) {
      return res.status(400).json({ error: "brand_id_name_required" });
    }
    const ok = await deleteSucursal(brand_id, name);
    if (!ok) return res.status(404).json({ error: "not_found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
