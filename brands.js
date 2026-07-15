const BRANDS = {
  // ─── Maggiestore (indumentaria) ──────────────────────────
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
    buttonText: "Hablar con",
    logo: "./media/logo/lg-aventus.svg",
    logoWidth: "800px",
    logoHeight: "auto",
    background: "./media/background/bg-aventus.png",
    backgroundMobile: "./media/background/bg-mobile-aventus.png",
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
    buttonText: "Hablar con",
    logo: "./media/logo/lg-tuslibrosya.svg",
    logoWidth: "100px",
    logoHeight: "100px",
    background: "./media/background/bg-tuslibrosya.png",
    backgroundMobile: "./media/background/bg-mobile-tuslibrosya.png",
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
  },

  // ─── Netlify (test) ──────────────────────────────────
  "wsprotador.netlify.app": {
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
  }
};

window.__brands = BRANDS;
