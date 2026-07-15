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

function getBrandEmployees(brand: BrandConfig, sucursalName?: string): Employee[] {
  if (sucursalName && brand.sucursales) {
    const s = brand.sucursales.find(s => s.name === sucursalName);
    if (s) return s.employees;
  }
  return brand.employees || [];
}

const brands: Record<string, BrandConfig> = {
  "landing-whatsapp-estudio-camaleon.vercel.app": {
    id: "selector",
    heading: "Elegí tu tienda",
  },

  "maggiestore.com": {
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

  "aventus.com": {
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

  "tuslibrosya.com": {
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

export function getBrandByDomain(host: string): BrandConfig | null {
  const cleanHost = host.replace(/^www\./, "").toLowerCase();
  return brands[cleanHost] || null;
}

export function getBrandBySlug(slug: string): BrandConfig | null {
  for (const key in brands) {
    if (brands[key].id === slug) return brands[key];
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
    cardPadding: "48px 40px 40px",
    logoMarginBottom: "0px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  };
}

export function getAllBrands(): BrandConfig[] {
  const result: BrandConfig[] = [];
  for (const key in brands) {
    if (key !== "default") result.push(brands[key]);
  }
  return result;
}
