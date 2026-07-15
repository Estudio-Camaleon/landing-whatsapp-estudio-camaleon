import {
  seedData, onSeed, isSeeded,
  getBrandById as storeGetBrandById,
  getBrandBySlug as storeGetBrandBySlug,
  getBrandByDomain as storeGetBrandByDomain,
  getAllBrands as storeGetAllBrands,
  getVendorsByBrand,
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
    buttonText: "Hablar con",
    logo: "./media/logo/lg-maggie.svg",
    logoWidth: "300px",
    logoHeight: "300px",
    background: "./media/background/bg-maggie.png",
    backgroundMobile: "./media/background/bg-mobile-maggie.png",
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
    buttonText: "Hablar con",
    logo: "./media/logo/lg-aventus.svg",
    logoWidth: "800px",
    logoHeight: "auto",
    background: "./media/background/bg-aventus.png",
    backgroundMobile: "./media/background/bg-mobile-aventus.png",
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
    buttonText: "Hablar con",
    logo: "./media/logo/lg-tuslibrosya.svg",
    logoWidth: "100px",
    logoHeight: "100px",
    background: "./media/background/bg-tuslibrosya.png",
    backgroundMobile: "./media/background/bg-mobile-tuslibrosya.png",
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

// Register seed callback so store auto-seeds on first access
onSeed(function() {
  if (isSeeded()) return;

  const domainBySlug: Record<string, string> = {
    maggiestore: "maggiestore.com",
    aventus: "aventus.com",
    tuslibrosya: "tuslibrosya.com",
  };

  const brands = Object.entries(staticBrandData).map(([key, cfg]) => ({
    id: cfg.id,
    name: cfg.title || cfg.id,
    slug: cfg.id,
    domain: domainBySlug[cfg.id] || null,
    theme: cfg.theme,
    title: cfg.title,
    heading: cfg.heading,
    message: cfg.message,
    buttonText: cfg.buttonText,
    logo: cfg.logo,
    logoWidth: cfg.logoWidth,
    logoHeight: cfg.logoHeight,
    background: cfg.background,
    backgroundMobile: cfg.backgroundMobile,
    active: true,
    cardPadding: cfg.cardPadding,
    logoMarginBottom: cfg.logoMarginBottom,
    headingMarginBottom: cfg.headingMarginBottom,
    sellerMarginBottom: cfg.sellerMarginBottom,
    ctaPadding: cfg.ctaPadding,
    logoOverflow: cfg.logoOverflow,
  }));

  const sucursales: { name: string; address: string; brand_id: string }[] = [];
  const vendors: {
    id: string; brand_id: string; sucursal_name: string;
    name: string; phone: string; active: boolean; schedule: Record<string, any>;
  }[] = [];

  Object.values(staticBrandData).forEach(cfg => {
    if (!cfg.sucursales) return;
    cfg.sucursales.forEach(s => {
      sucursales.push({ name: s.name, address: s.address, brand_id: cfg.id });
      s.employees.forEach((e, i) => {
        vendors.push({
          id: `${cfg.id}-${s.name}-${i}`,
          brand_id: cfg.id,
          sucursal_name: s.name,
          name: e.name,
          phone: e.phone,
          active: true,
          schedule: {},
        });
      });
    });
  });

  seedData(brands, sucursales, vendors);
});

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

export function getBrandByDomain(host: string) {
  const store = storeGetBrandByDomain(host);
  if (store) return { ...store, employees: getBrandEmployees(store) };
  return null;
}

export function getBrandBySlug(slug: string) {
  const store = storeGetBrandBySlug(slug);
  if (store) {
    const cfg = staticBrandData[slug];
    return { ...store, ...cfg, employees: cfg ? getBrandEmployees(cfg) : [] };
  }
  if (staticBrandData[slug]) {
    const cfg = staticBrandData[slug];
    return { ...cfg, employees: getBrandEmployees(cfg) };
  }
  return null;
}

export function getDefaultBrand() {
  const brand = {
    id: "default",
    theme: "perfumes",
    title: "WhatsApp Landing",
    heading: "Habla con uno de nuestros vendedores",
    message: "Hola! Quiero consultar productos",
    buttonText: "Hablar con",
    logo: "./media/logo/lg-aventus.svg",
    logoWidth: "300px",
    logoHeight: "300px",
    background: "./media/background/bg-aventus.png",
    backgroundMobile: "./media/background/bg-mobile-aventus.png",
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
  return brand;
}

export function getAllBrands() {
  const store = storeGetAllBrands();
  return store.map(s => {
    const cfg = staticBrandData[s.slug || s.id];
    return { ...s, ...cfg, employees: cfg ? getBrandEmployees(cfg) : [] };
  });
}

export function getBrandById(id: string) {
  const s = storeGetBrandById(id);
  if (!s) return null;
  const cfg = staticBrandData[s.slug || s.id];
  return { ...s, ...cfg, employees: cfg ? getBrandEmployees(cfg) : [] };
}
