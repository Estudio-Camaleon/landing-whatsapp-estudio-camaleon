import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import {
  getAllVendors, getVendorById, getVendorsByBrand,
  createVendor, updateVendor, deleteVendor
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
    const vendorId = req.query.id as string;
    const sucursalName = req.query.sucursal as string;

    if (vendorId) {
      const v = await getVendorById(vendorId);
      if (!v) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(v);
    }

    if (brandId) return res.status(200).json(await getVendorsByBrand(brandId, sucursalName));
    return res.status(200).json(await getAllVendors());
  }

  if (req.method === "POST") {
    const { brand_id, sucursal_name, name, phone, active, schedule } = req.body || {};
    if (!brand_id || !name || !phone) {
      return res.status(400).json({ error: "brand_id_name_phone_required" });
    }
    const vendor = await createVendor({
      brand_id,
      sucursal_name: sucursal_name || "",
      name,
      phone,
      active: active !== false,
      schedule: schedule || {},
    });
    return res.status(201).json(vendor);
  }

  if (req.method === "PUT") {
    const { id, ...data } = req.body || {};
    if (!id) return res.status(400).json({ error: "id_required" });
    const vendor = await updateVendor(id, data);
    if (!vendor) return res.status(404).json({ error: "not_found" });
    return res.status(200).json(vendor);
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id_required" });
    const ok = await deleteVendor(id);
    if (!ok) return res.status(404).json({ error: "not_found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
