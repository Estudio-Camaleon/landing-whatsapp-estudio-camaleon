import { getAllBrands } from "./_lib/brands-data.js";

const THEME_ACCENTS = {
  perfumes: "#7c3aed",
  libreria: "#d97706",
  indumentaria: "#00c9fd",
};

export default async (req, res) => {
  try {
    const data = await getAllBrands();

    // 1. Defender contra datos que no sean un arreglo
    if (!Array.isArray(data)) {
      console.error("Error de datos: getAllBrands() no devolvió un arreglo", data);
      return res.status(500).json({ error: "Internal Server Error: Formato de datos inválido" });
    }

    const brands = data
      // 2. Defender contra elementos nulos/indefinidos en el arreglo
      .filter((b) => b && b.slug !== "default" && b.id !== "default")
      .map((b) => ({
        id: b.id,
        name: b.title || b.name,
        theme: b.theme || "indumentaria",
        slug: b.slug || b.id,
        logo: b.logo || b.logo_url || null,
        logoWidth: b.logoWidth || null,
        logoHeight: b.logoHeight || null,
        accent: THEME_ACCENTS[b.theme || "indumentaria"] || "#667eea",
      }));

    return res.status(200).json(brands);

  } catch (error) {
    // 3. Capturar y registrar en los logs cualquier error que venga de getAllBrands()
    console.error("Error de la API al obtener las marcas:", error);
    
    // Devolver un error en JSON para que el fetch del frontend no falle al intentar leer HTML
    return res.status(500).json({ error: "Error al cargar los datos de las marcas" });
  }
};