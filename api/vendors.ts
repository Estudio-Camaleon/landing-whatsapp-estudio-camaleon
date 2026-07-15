import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken } from "./_lib/auth";
import { getAllBrands, getBrandEmployees } from "./_lib/brands-data";

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

    const allBrands = getAllBrands();
    let vendors = allBrands.flatMap(b =>
      getBrandEmployees(b).map((e, i) => ({
        id: `${b.id}-${i}`,
        brand_id: b.id,
        name: e.name,
        phone: atob(e.phone),
        active: true,
        schedule: {}
      }))
    );

    if (vendorId) {
      const v = vendors.find(x => x.id === vendorId);
      if (!v) return res.status(404).json({ error: "not_found" });
      return res.status(200).json(v);
    }

    if (brandId) vendors = vendors.filter(v => v.brand_id === brandId);
    return res.status(200).json(vendors);
  }

  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(501).json({ error: "read_only_mode" });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
