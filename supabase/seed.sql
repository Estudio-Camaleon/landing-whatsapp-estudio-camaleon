-- ============================================================
-- Seed Data - Brands, Sucursales, Vendors, Rotation
-- IDEMPOTENTE: resuelve IDs dinámicamente por slug
-- ============================================================

-- ─── Brands: solo inserta si no existen (por slug) ───
INSERT INTO public.brands (id, name, slug, domain)
SELECT gen_random_uuid(), 'Aventus Perfumería', 'aventus', 'aventus.com'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'aventus');

INSERT INTO public.brands (id, name, slug, domain)
SELECT gen_random_uuid(), 'MaggieStore Indumentaria', 'maggiestore', 'maggiestore.com'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'maggiestore');

INSERT INTO public.brands (id, name, slug, domain)
SELECT gen_random_uuid(), 'TusLibrosYa! Librería', 'tuslibrosya', 'tuslibrosya.com'
WHERE NOT EXISTS (SELECT 1 FROM public.brands WHERE slug = 'tuslibrosya');

-- ─── Sucursales (resuelve brand_id por slug) ───
INSERT INTO public.sucursales (brand_id, name, address)
SELECT id, 'Casa Central', 'San Miguel de Tucumán' FROM public.brands WHERE slug = 'aventus'
UNION ALL
SELECT id, 'Sucursal Yerba Buena', 'Yerba Buena' FROM public.brands WHERE slug = 'aventus'
UNION ALL
SELECT id, 'Casa Central', 'San Miguel de Tucumán' FROM public.brands WHERE slug = 'maggiestore'
UNION ALL
SELECT id, 'Casa Central', 'San Miguel de Tucumán' FROM public.brands WHERE slug = 'tuslibrosya'
UNION ALL
SELECT id, 'Sucursal Yerba Buena', 'Yerba Buena' FROM public.brands WHERE slug = 'tuslibrosya'
ON CONFLICT DO NOTHING;

-- ─── Vendors (resuelve brand_id por slug) ───
-- Aventus - Casa Central
INSERT INTO public.vendors (brand_id, sucursal_name, name, phone, active, schedule)
SELECT id, 'Casa Central', 'Dario', '5493815272820', true, '{}'::jsonb FROM public.brands WHERE slug = 'aventus'
UNION ALL
SELECT id, 'Casa Central', 'Neo', '5493813583226', true, '{}'::jsonb FROM public.brands WHERE slug = 'aventus'
-- Aventus - Yerba Buena
UNION ALL
SELECT id, 'Sucursal Yerba Buena', 'Facundo', '5493812114879', true, '{}'::jsonb FROM public.brands WHERE slug = 'aventus'
-- MaggieStore - Casa Central
UNION ALL
SELECT id, 'Casa Central', 'Dario', '5493815272820', true, '{}'::jsonb FROM public.brands WHERE slug = 'maggiestore'
-- TusLibrosYa - Casa Central
UNION ALL
SELECT id, 'Casa Central', 'Dario', '5493815272820', true, '{}'::jsonb FROM public.brands WHERE slug = 'tuslibrosya'
UNION ALL
SELECT id, 'Casa Central', 'Neo', '5493813583226', true, '{}'::jsonb FROM public.brands WHERE slug = 'tuslibrosya'
-- TusLibrosYa - Yerba Buena
UNION ALL
SELECT id, 'Sucursal Yerba Buena', 'Dario', '5493815272820', true, '{}'::jsonb FROM public.brands WHERE slug = 'tuslibrosya'
UNION ALL
SELECT id, 'Sucursal Yerba Buena', 'Facundo', '5493812114879', true, '{}'::jsonb FROM public.brands WHERE slug = 'tuslibrosya'
ON CONFLICT DO NOTHING;

-- ─── Rotation State (resuelve brand_id por slug) ───
INSERT INTO public.rotation_state (brand_id, last_vendor_index)
SELECT id, 0 FROM public.brands WHERE slug = 'aventus'
UNION ALL
SELECT id, 0 FROM public.brands WHERE slug = 'maggiestore'
UNION ALL
SELECT id, 0 FROM public.brands WHERE slug = 'tuslibrosya'
ON CONFLICT DO NOTHING;
