-- Biz Ascend RAD™ - Organizations (Multi-Tenant) Schema
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  max_users INTEGER NOT NULL DEFAULT 3,
  max_projects INTEGER NOT NULL DEFAULT 20,
  features JSONB DEFAULT '["ai_reports", "pdf_export"]',
  settings JSONB DEFAULT '{"branding": {"primary_color": "#f97316"}, "email": {"sender_name": "Biz Ascend RAD"}}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add organization_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Add organization_id to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create indexes for organization_id
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Update timestamp trigger for organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SETUP INSTRUCTIONS:
-- 1. Run this SQL in Supabase SQL Editor after 001_initial_schema.sql
-- 2. Create your first organization:
--    INSERT INTO public.organizations (name, slug, plan, max_users, max_projects)
--    VALUES ('Your Company', 'your-company', 'enterprise', 50, 500);
-- 3. Link your admin user to the organization:
--    UPDATE public.profiles SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'your-company')
--    WHERE email = 'your-admin@email.com';
