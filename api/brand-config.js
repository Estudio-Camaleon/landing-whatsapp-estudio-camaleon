import { getBrandBySlug, getBrandByDomain } from "./_lib/brands-data.js";
import { getSucursalesByBrand } from "./_lib/store.js";
import { getVendorsByBrand } from "./_lib/store.js";

export default async (req, res) => {
  const slug = req.query.slug;
  const host = req.headers["host"] || "";
  const full = req.query.full !== undefined;

  let brand = slug ? await getBrandBySlug(slug) : null;
  if (!brand) brand = await getBrandByDomain(host);

  if (!brand) {
    return res.status(404).json({ error: "brand_not_found" });
  }

  if (full) {
    const sucursales = await getSucursalesByBrand(brand.id);
    const vendors = await getVendorsByBrand(brand.id);
    return res.status(200).json({
      ...brand,
      sucursales: sucursales.map(s => ({
        ...s,
        employees: vendors
          .filter(v => v.sucursal_name === s.name)
          .map(v => ({ name: v.name, phone: v.phone })),
      })),
      employees: vendors
        .filter(v => !v.sucursal_name)
        .map(v => ({ name: v.name, phone: v.phone })),
    });
  }

  return res.status(200).json({
    id: brand.id,
    slug: brand.slug || brand.id,
    name: brand.name || null,
    theme: brand.theme || null,
    title: brand.title || brand.meta_title || null,
    heading: brand.heading || null,
    buttonText: brand.buttonText || null,
    logo: brand.logo || null,
    logo_url: brand.logo_url || null,
    logoWidth: brand.logoWidth || null,
    logoHeight: brand.logoHeight || null,
    background: brand.background || null,
    background_url: brand.background_url || null,
    backgroundMobile: brand.backgroundMobile || null,
    background_mobile_url: brand.background_mobile_url || null,
    meta_title: brand.meta_title || null,
    favicon_url: brand.favicon_url || null,
    cardPadding: brand.cardPadding || null,
    logoMarginBottom: brand.logoMarginBottom || null,
    logoOverflow: brand.logoOverflow || null,
    headingMarginBottom: brand.headingMarginBottom || null,
    sellerMarginBottom: brand.sellerMarginBottom || null,
    ctaPadding: brand.ctaPadding || null,
  });
};
