const BRANDS = {
  // ─── Maggiestore (indumentaria) ──────────────────────────
  "maggiestore.com": {
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
    employees: [],
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [{ name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" }] },
    ],
    // ─── Espaciado ───────────────────────────────────────
    cardPadding: "48px 40px 40px",
    logoMarginBottom: "0px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  },

  // ─── Aventus (perfumes) ────────────────────────────────
  "aventus.com": {
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
    employees: [],
    sucursales: [
      { name: "Casa Central", address: "San Miguel de Tucumán", employees: [
        { name: "Dario", phone: "NTQ5MzgxNTI3MjgyMA==" },
        { name: "Neo", phone: "NTQ5MzgxMzU4MzIyNg==" },
      ]},
      { name: "Sucursal Yerba Buena", address: "Yerba Buena", employees: [
        { name: "Facundo", phone: "NTQ5MzgxMjExNDg3OQ==" },
      ]},
    ],
    // ─── Espaciado ───────────────────────────────────────
    cardPadding: "16px 32px 20px",
    logoMarginBottom: "10px",
    headingMarginBottom: "16px",
    sellerMarginBottom: "16px",
    ctaPadding: "14px 28px",
    logoOverflow: "hidden",
  },

  // ─── TusLibrosYa (librería) ─────────────────────────────
  "tuslibrosya.com": {
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
    employees: [],
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
    // ─── Espaciado ───────────────────────────────────────
    cardPadding: "35px 40px 40px",
    logoMarginBottom: "10px",
    headingMarginBottom: "28px",
    sellerMarginBottom: "24px",
    ctaPadding: "16px 32px",
    logoOverflow: "visible",
  },

  // ─── Marca por defecto (fallback) ─────────────────────
  default: {
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
  }
};

window.__brands = BRANDS;
