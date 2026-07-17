-- Add presentation/display fields to brands table
-- These were previously only in the static brands-data.js config

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS theme text DEFAULT 'indumentaria';
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS heading text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS button_text text DEFAULT 'Solicitar un vendedor';
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_width text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_height text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS card_padding text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_margin_bottom text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS heading_margin_bottom text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS seller_margin_bottom text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS cta_padding text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_overflow text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS accent text;
