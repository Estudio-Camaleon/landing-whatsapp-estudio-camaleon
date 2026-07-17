import {
  getBrandById as storeGetBrandById,
  getBrandBySlug as storeGetBrandBySlug,
  getBrandByDomain as storeGetBrandByDomain,
  getAllBrands as storeGetAllBrands,
} from "./store.js";

const staticBrandData = {
  maggiestore: {
    id: "maggiestore",
    theme: "indumentaria",
    title: "MaggieStore Indumentaria",
    heading: "Elegí tu sucursal",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    logo: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/maggiestore/logo.svg",
    logoWidth: "300px",
    logoHeight: "300px",
    background: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/maggiestore/background.png",
    backgroundMobile: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/maggiestore/background_mobile.png",
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [{ name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" }] },
    ],
    cardPadding: "48px 40px 40px",
    logoMarginBottom: "0px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  },
  aventus: {
    id: "aventus",
    theme: "perfumes",
    title: "Aventus Perfumería",
    heading: "Elegí tu sucursal",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    logo: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/aventus/logo.svg",
    logoWidth: "800px",
    logoHeight: "auto",
    background: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/aventus/background.png",
    backgroundMobile: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/aventus/background_mobile.png",
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [
        { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
        { name: "Neo", phone: "NTQ5MzgxMzU4MzIyNg==" },
      ]},
      { name: "Sucursal Yerba Buena", address: "Yerba Buena", employees: [
        { name: "Facundo", phone: "NTQ5MzgxMjExNDg3OQ==" },
      ]},
    ],
    cardPadding: "16px 32px 20px",
    logoMarginBottom: "10px",
    headingMarginBottom: "16px",
    sellerMarginBottom: "16px",
    ctaPadding: "14px 28px",
    logoOverflow: "hidden",
  },
  tuslibrosya: {
    id: "tuslibrosya",
    theme: "libreria",
    title: "TusLibrosYa! Librería",
    heading: "Elegí tu sucursal",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    logo: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/tuslibrosya/logo.svg",
    logoWidth: "100px",
    logoHeight: "100px",
    background: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/tuslibrosya/background.png",
    backgroundMobile: "https://kjkqpsxpgqmscccjcnmg.supabase.co/storage/v1/object/public/brand-assets/tuslibrosya/background_mobile.png",
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [
        { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
        { name: "Neo", phone: "NTQ5MzgxMzU4MzIyNg==" },
      ]},
      { name: "Sucursal Yerba Buena", address: "Yerba Buena", employees: [
        { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
        { name: "Facundo", phone: "NTQ5MzgxMjExNDg3OQ==" },
      ]},
    ],
    cardPadding: "35px 40px 40px",
    logoMarginBottom: "10px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  },
};

function mergeWithStatic(storeBrand) {
  const cfg = staticBrandData[storeBrand.slug || storeBrand.id];
  if (!cfg) return storeBrand;
  // Static config provides visual defaults, DB overrides (preserves UUID id)
  return { ...cfg, ...storeBrand, employees: getBrandEmployees(cfg) };
}

export function getBrandEmployees(brand, sucursalName) {
  if (sucursalName) {
    const cfg = staticBrandData[brand.id];
    if (cfg?.sucursales) {
      const s = cfg.sucursales.find(x => x.name === sucursalName);
      if (s) return s.employees;
    }
  }
  if (brand && "employees" in brand && brand.employees?.length) {
    return brand.employees;
  }
  const cfg = staticBrandData[brand.id];
  if (cfg?.sucursales) return cfg.sucursales.flatMap(s => s.employees);
  if (cfg?.employees) return cfg.employees;
  return [];
}

export async function getBrandByDomain(host) {
  const store = await storeGetBrandByDomain(host);
  if (store) return mergeWithStatic(store);
  const clean = host.replace(/^www\./, "").toLowerCase();
  for (const key in staticBrandData) {
    if (key === clean || key === host) {
      return { ...staticBrandData[key], employees: getBrandEmployees(staticBrandData[key]) };
    }
  }
  return null;
}

export async function getBrandBySlug(slug) {
  const store = await storeGetBrandBySlug(slug);
  if (store) return mergeWithStatic(store);
  if (staticBrandData[slug]) {
    const cfg = staticBrandData[slug];
    return { ...cfg, employees: getBrandEmployees(cfg) };
  }
  return null;
}

export function getDefaultBrand() {
  return {
    id: "default",
    theme: "perfumes",
    title: "WhatsApp Landing",
    heading: "Habla con uno de nuestros vendedores",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    cardPadding: "48px 40px 40px",
    logoMarginBottom: "0px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  };
}

export async function getAllBrands() {
  const store = await storeGetAllBrands();
  return store.map(s => {
    const cfg = staticBrandData[s.slug || s.id];
    // Preserve DB id (UUID), merge visual config from static data
    return { ...cfg, ...s, employees: cfg ? getBrandEmployees(cfg) : [] };
  });
}

export async function getBrandById(id) {
  const s = await storeGetBrandById(id);
  if (!s) return null;
  const cfg = staticBrandData[s.slug || s.id];
  return { ...cfg, ...s, employees: cfg ? getBrandEmployees(cfg) : [] };
}
