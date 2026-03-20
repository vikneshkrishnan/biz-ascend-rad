-- Migration 005: Fix pillar weights to match rebrief spec
-- Previous weights summed to 1.22 (122%), breaking RAD score calculation
-- Updated weights sum to exactly 1.00 per the rebrief specification

UPDATE public.platform_settings
SET value = '{"p1":0.12,"p2":0.11,"p3":0.15,"p4":0.15,"p5":0.10,"p6":0.07,"p7":0.08,"p8":0.10,"p9":0.12}',
    updated_at = now()
WHERE key = 'pillar_weights';
