-- Migration 004: Gap Fixes
--
-- This migration addresses several gaps:
-- 1. Creates the platform_settings table for storing configurable platform parameters
-- 2. Adds link access tracking columns to questionnaire_links
-- 3. Seeds default platform settings (pillar weights, thresholds, expiry, pillar order)

-- 1. Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 2. Add link access tracking columns to questionnaire_links
ALTER TABLE public.questionnaire_links ADD COLUMN IF NOT EXISTS first_accessed_at TIMESTAMPTZ;
ALTER TABLE public.questionnaire_links ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;
ALTER TABLE public.questionnaire_links ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

-- 3. Seed default platform settings
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('pillar_weights', '{"p1":0.18,"p2":0.15,"p3":0.18,"p4":0.20,"p5":0.10,"p6":0.09,"p7":0.10,"p8":0.10,"p9":0.12}', 'Weight multipliers for each pillar score'),
  ('traffic_light_thresholds', '{"green":80,"yellow":65,"orange":50}', 'Score thresholds for traffic light indicators'),
  ('link_expiry_days', '30', 'Number of days before questionnaire links expire'),
  ('pillar_order', '["p1","p2","p3","p4","p5","p6","p7","p8","p9"]', 'Display order of pillars')
ON CONFLICT DO NOTHING;
