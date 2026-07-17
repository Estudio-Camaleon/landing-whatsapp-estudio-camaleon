function detectBrand() {
  var params = new URLSearchParams(window.location.search);
  var brandOverride = params.get("brand");

  if (brandOverride) {
    return { id: brandOverride, slug: brandOverride };
  }

  return { id: "default", slug: null };
}

var CONFIG = detectBrand();

if (!CONFIG) {
  console.error("[Brand] No hay configuración disponible");
  document.body.innerHTML = "<p style='color:white;text-align:center;padding:40px;font-family:sans-serif;'>Error: No hay configuración de marca</p>";
  throw new Error("No hay configuración de marca");
}

export { CONFIG };
