import { readFileSync } from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Folder name to brand slug mapping
const FOLDER_TO_SLUG: Record<string, string> = {
  aventus: "aventus",
  maggie: "maggiestore",
  tuslibrosya: "tuslibrosya",
};

// Asset type by folder structure
function detectAssetType(filePath: string): string | null {
  const relative = path.relative(
    path.join(process.cwd(), "public", "media"),
    filePath
  );
  const parts = relative.split(path.sep);
  if (parts.length < 2) return null;
  const category = parts[0];
  if (category === "logo") return "logo";
  if (category === "bg-deskop") return "background";
  if (category === "bg-mobile") return "background_mobile";
  return null;
}

// MIME type by extension
function mimeType(ext: string): string {
  const map: Record<string, string> = {
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return map[ext.toLowerCase()] || "image/png";
}

async function main() {
  const mediaDir = path.join(process.cwd(), "public", "media");
  const glob = require("glob");
  const files: string[] = glob.sync("**/*", { cwd: mediaDir, nodir: true });

  console.log(`Encontrados ${files.length} archivos en public/media/\n`);

  for (const relativePath of files) {
    const fullPath = path.join(mediaDir, relativePath);
    const ext = path.extname(fullPath);
    const assetType = detectAssetType(fullPath);

    if (!assetType) {
      console.warn(`  ⚠ No se pudo determinar asset_type para: ${relativePath}`);
      continue;
    }

    // Extract brand folder name from path: e.g. "logo/aventus/lg-aventus.svg" → "aventus"
    const parts = relativePath.split(/[\\/]/);
    const brandFolder = parts[1];
    const brandSlug = FOLDER_TO_SLUG[brandFolder];

    if (!brandSlug) {
      console.warn(`  ⚠ No hay mapping para carpeta: ${brandFolder}`);
      continue;
    }

    const content = readFileSync(fullPath);
    const fileName = `${brandSlug}/${assetType}${ext}`;

    console.log(`  Subiendo ${assetType} para ${brandSlug}...`);

    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(fileName, content, {
        contentType: mimeType(ext),
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ✗ Error subiendo ${fileName}: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("brand-assets")
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.error(`  ✗ No se pudo obtener URL pública para ${fileName}`);
      continue;
    }

    const dbField =
      assetType === "logo"
        ? "logo_url"
        : assetType === "background"
          ? "background_url"
          : "background_mobile_url";

    const { error: updateError } = await supabase
      .from("brands")
      .update({ [dbField]: publicUrl })
      .eq("slug", brandSlug);

    if (updateError) {
      console.error(`  ✗ Error actualizando ${brandSlug}.${dbField}: ${updateError.message}`);
      continue;
    }

    console.log(`  ✓ ${brandSlug}.${dbField} = ${publicUrl}`);
  }

  console.log("\n✅ Proceso completado");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
