import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBrandBySlug, getBrandByDomain, getBrandById } from "./_lib/store";
import { getSucursalesByBrand } from "./_lib/store";
import { getVendorsByBrand } from "./_lib/store";

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const slug = typeof req.query.slug === "string" ? req.query.slug : null;
    const host = typeof req.headers["host"] === "string" ? req.headers["host"] : "";
    const full = req.query.full !== undefined;

    // --- Buscar marca -------------------------------------------------------
    let brand = slug ? (await getBrandBySlug(slug) || await getBrandById(slug)) : null;
    if (!brand) brand = await getBrandByDomain(host);

    if (!brand) {
      return res.status(404).json({ error: "brand_not_found" });
    }

    // --- Respuesta completa -----------------------------------------------
    if (full) {
      // Protección contra errores en la capa de datos
      const sucursales = (await getSucursalesByBrand(brand.id)) ?? [];
      const vendors = (await getVendorsByBrand(brand.id)) ?? [];

      return res.status(200).json({
        slug: brand.slug ?? brand.id,
        logo_url: brand.logo_url || null,
        background_url: brand.background_url || null,
        background_mobile_url: brand.background_mobile_url || null,
        meta_title: brand.meta_title || null,
        favicon_url: brand.favicon_url || null,
        sucursales: sucursales.map((s: any) => ({
          ...s,
          employees: vendors
            .filter((v: any) => v.sucursal_name === s.name)
            .map((v: any) => ({ name: v.name, phone: v.phone })),
        })),
        employees: vendors
          .filter((v: any) => !v.sucursal_name)
          .map((v: any) => ({ name: v.name, phone: v.phone })),
      });
    }

    // --- Respuesta básica -------------------------------------------------
    return res.status(200).json({
      slug: brand.slug ?? brand.id,
      logo_url: brand.logo_url || null,
      background_url: brand.background_url || null,
      background_mobile_url: brand.background_mobile_url || null,
      meta_title: brand.meta_title || null,
      favicon_url: brand.favicon_url || null,
    });
  } catch (err) {
    console.error("[brand-config] error:", err);
    return res.status(500).json({ error: "internal_server_error", details: err.message });
  }
};
