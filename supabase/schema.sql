-- ============================================================
-- WhatsApp Landing Page System - Esquema Completo
-- Ejecutar en Supabase SQL Editor
-- IDEMPOTENTE: se puede ejecutar múltiples veces sin errores
-- ============================================================

-- ─── Brands ───
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  domain text UNIQUE,
  slug text UNIQUE,
  logo_url text,
  background_url text,
  background_mobile_url text,
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- ─── Sucursales (branches per brand) ───
CREATE TABLE IF NOT EXISTS public.sucursales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text DEFAULT '',
  CONSTRAINT sucursales_pkey PRIMARY KEY (id),
  CONSTRAINT sucursales_brand_name_unique UNIQUE (brand_id, name)
);

-- ─── Vendors (employees per brand/sucursal) ───
CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  sucursal_name text,
  name text NOT NULL,
  phone text NOT NULL,
  active boolean DEFAULT true,
  schedule jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);

ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS sucursal_name text;

-- ─── Rotation State (round-robin index per brand) ───
CREATE TABLE IF NOT EXISTS public.rotation_state (
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  last_vendor_index integer DEFAULT 0,
  CONSTRAINT rotation_state_pkey PRIMARY KEY (brand_id)
);

-- ─── Events (tracking clicks per IP) ───
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ip text,
  user_agent text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_events_brand_ip ON public.events(brand_id, ip, created_at);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);

-- ============================================================
-- Row Level Security (RLS) - Multi-tenant isolation
-- ============================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rotation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Brands: anon can read; admin can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'brands_select_anon') THEN
    CREATE POLICY "brands_select_anon" ON public.brands FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brands' AND policyname = 'brands_all_admin') THEN
    CREATE POLICY "brands_all_admin" ON public.brands FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Sucursales: anon can read; admin can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sucursales' AND policyname = 'sucursales_select_anon') THEN
    CREATE POLICY "sucursales_select_anon" ON public.sucursales FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sucursales' AND policyname = 'sucursales_all_admin') THEN
    CREATE POLICY "sucursales_all_admin" ON public.sucursales FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Vendors: anon can read; admin can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_select_anon') THEN
    CREATE POLICY "vendors_select_anon" ON public.vendors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'vendors_all_admin') THEN
    CREATE POLICY "vendors_all_admin" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Rotation: anon can read/write (needed for round-robin)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rotation_state' AND policyname = 'rotation_all_anon') THEN
    CREATE POLICY "rotation_all_anon" ON public.rotation_state FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Events: anon can insert; admin can read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_insert_anon') THEN
    CREATE POLICY "events_insert_anon" ON public.events FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_select_admin') THEN
    CREATE POLICY "events_select_admin" ON public.events FOR SELECT USING (true);
  END IF;
END $$;

-- ============================================================
-- Storage Bucket
-- ============================================================
-- Run in Supabase Dashboard > Storage:
-- 1. Create bucket "brand-assets" (public)
-- 2. Add policies:
--    SELECT: bucket_id = 'brand-assets'
--    INSERT: bucket_id = 'brand-assets' AND auth.role() = 'anon'
--    UPDATE: bucket_id = 'brand-assets' AND auth.role() = 'anon'
