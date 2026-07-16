import {
  getBrandById as storeGetBrandById,
  getBrandBySlug as storeGetBrandBySlug,
  getBrandByDomain as storeGetBrandByDomain,
  getAllBrands as storeGetAllBrands,
} from "./store";

export interface Employee {
  name: string;
  phone: string;
}

export interface Sucursal {
  name: string;
  address: string;
  employees: Employee[];
}

export interface BrandConfig {
  id: string;
  theme?: string;
  title?: string;
  heading?: string;
  message?: string;
  buttonText?: string;
  logo?: string;
  logoWidth?: string;
  logoHeight?: string;
  background?: string;
  backgroundMobile?: string;
  employees?: Employee[];
  sucursales?: Sucursal[];
  active?: boolean;
  cardPadding?: string;
  logoMarginBottom?: string;
  headingMarginBottom?: string;
  sellerMarginBottom?: string;
  ctaPadding?: string;
  logoOverflow?: string;
}

const staticBrandData: Record<string, BrandConfig> = {
  maggiestore: {
    id: "maggiestore",
    theme: "indumentaria",
    title: "MaggieStore Indumentaria",
    heading: "Elegí tu sucursal",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    logo: "/media/logo/maggie/lg-maggie.svg",
    logoWidth: "300px",
    logoHeight: "300px",
    background: "/media/bg-deskop/maggie/bg-maggie.png",
    backgroundMobile: "/media/bg-mobile/maggie/bg-mobile-maggie.png",
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
    logo: "/media/logo/aventus/lg-aventus.svg",
    logoWidth: "800px",
    logoHeight: "auto",
    background: "/media/bg-deskop/aventus/bg-aventus.png",
    backgroundMobile: "/media/bg-mobile/aventus/bg-mobile-aventus.png",
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
    logo: "/media/logo/tuslibrosya/lg-tuslibrosya.svg",
    logoWidth: "100px",
    logoHeight: "100px",
    background: "/media/bg-deskop/tuslibrosya/bg-tuslibrosya.png",
    backgroundMobile: "/media/bg-mobile/tuslibrosya/bg-mobile-tuslibrosya.png",
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

function mergeWithStatic(storeBrand: { id: string; slug?: string } & Record<string, unknown>) {
  const cfg = staticBrandData[storeBrand.slug || storeBrand.id];
  if (!cfg) return storeBrand;
  // Static config provides visual defaults, DB overrides (preserves UUID id)
  return { ...cfg, ...storeBrand, employees: getBrandEmployees(cfg) };
}

export function getBrandEmployees(brand: BrandConfig | { id: string }, sucursalName?: string): Employee[] {
  if (sucursalName) {
    const cfg = staticBrandData[brand.id];
    if (cfg?.sucursales) {
      const s = cfg.sucursales.find(x => x.name === sucursalName);
      if (s) return s.employees;
    }
  }
  if (brand && "employees" in brand && (brand as BrandConfig).employees?.length) {
    return (brand as BrandConfig).employees!;
  }
  const cfg = staticBrandData[brand.id];
  if (cfg?.sucursales) return cfg.sucursales.flatMap(s => s.employees);
  if (cfg?.employees) return cfg.employees;
  return [];
}

export async function getBrandByDomain(host: string) {
  const store = await storeGetBrandByDomain(host);
  if (store) return mergeWithStatic(store) as BrandConfig;
  const clean = host.replace(/^www\./, "").toLowerCase();
  for (const key in staticBrandData) {
    if (key === clean || key === host) {
      return { ...staticBrandData[key], employees: getBrandEmployees(staticBrandData[key]) };
    }
  }
  return null;
}

export async function getBrandBySlug(slug: string) {
  const store = await storeGetBrandBySlug(slug);
  if (store) return mergeWithStatic(store) as BrandConfig;
  if (staticBrandData[slug]) {
    const cfg = staticBrandData[slug];
    return { ...cfg, employees: getBrandEmployees(cfg) };
  }
  return null;
}

export function getDefaultBrand(): BrandConfig {
  return {
    id: "default",
    theme: "perfumes",
    title: "WhatsApp Landing",
    heading: "Habla con uno de nuestros vendedores",
    message: "Hola! Quiero consultar productos",
    buttonText: "Solicitar un vendedor",
    logo: "/media/logo/aventus/lg-aventus.svg",
    logoWidth: "300px",
    logoHeight: "300px",
    background: "/media/bg-deskop/aventus/bg-aventus.png",
    backgroundMobile: "/media/bg-mobile/aventus/bg-mobile-aventus.png",
    employees: [
      { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
      { name: "Neo", phone: "NTQ5MzgxMzU4MzIyNg==" },
      { name: "Facundo", phone: "NTQ5MzgxMjExNDg3OQ==" },
    ],
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [
        { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
      ]},
    ],
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

export async function getBrandById(id: string) {
  const s = await storeGetBrandById(id);
  if (!s) return null;
  const cfg = staticBrandData[s.slug || s.id];
  return { ...cfg, ...s, employees: cfg ? getBrandEmployees(cfg) : [] };
}
