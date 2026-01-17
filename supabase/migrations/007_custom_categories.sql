-- Custom Categories Schema
-- Migration: 007_custom_categories.sql
-- Allows households to define custom calendar event categories with custom colors

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  icon TEXT DEFAULT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(household_id, name)
);

-- Create index for faster lookups
CREATE INDEX idx_categories_household ON public.categories(household_id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view categories in their household" ON public.categories
FOR SELECT USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert categories in their household" ON public.categories
FOR INSERT WITH CHECK (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update categories in their household" ON public.categories
FOR UPDATE USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete non-default categories in their household" ON public.categories
FOR DELETE USING (household_id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid()) AND is_default = FALSE);

-- Add category_id to events (nullable initially for migration)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Create index for category_id lookups
CREATE INDEX IF NOT EXISTS idx_events_category_id ON public.events(category_id);

-- Function to seed default categories for a household
CREATE OR REPLACE FUNCTION seed_default_categories(p_household_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.categories (household_id, name, color, is_default)
  VALUES
    (p_household_id, 'Personal', '#3B82F6', TRUE),
    (p_household_id, 'Work', '#8B5CF6', TRUE),
    (p_household_id, 'Family', '#22C55E', TRUE),
    (p_household_id, 'Health', '#EF4444', TRUE),
    (p_household_id, 'Other', '#6B7280', TRUE)
  ON CONFLICT (household_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Data Migration: Seed default categories for all existing households
DO $$
DECLARE
  household RECORD;
BEGIN
  FOR household IN SELECT id FROM public.households LOOP
    PERFORM seed_default_categories(household.id);
  END LOOP;
END $$;

-- Data Migration: Update existing events to use category_id based on their category enum value
UPDATE public.events e
SET category_id = c.id
FROM public.categories c
WHERE e.household_id = c.household_id
  AND e.category_id IS NULL
  AND c.name = INITCAP(e.category::TEXT);

-- Note: We keep the old 'category' column for backward compatibility during transition
-- It can be dropped in a future migration after confirming all code uses category_id
