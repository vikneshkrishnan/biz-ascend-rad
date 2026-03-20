-- Module 2: Client Project Management — gap fixes
-- Run this AFTER 002_organizations.sql in Supabase SQL Editor

-- Add contact and notes fields to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add is_archived flag (separate from status for independent querying)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Index for archive queries
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON public.projects(is_archived);
