-- Storage bucket (crear desde Supabase Dashboard > Storage > New bucket)
-- Nombre: brand-assets
-- Public: true

-- Columnas para URLs de assets
alter table brands add column if not exists logo_url text;
alter table brands add column if not exists background_url text;
alter table brands add column if not exists background_mobile_url text;
