-- ============================================
-- Migration: Add household_id to children table
-- Purpose: Enable multi-site support for health module
-- ============================================

-- 1. Add household_id column to children table
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_children_household_id ON public.children(household_id);

-- 3. Migrate existing data: Link children to their user's first household
-- This ensures existing data is not orphaned
UPDATE public.children c
SET household_id = (
  SELECT hm.household_id
  FROM public.household_members hm
  WHERE hm.user_id = c.user_id
  ORDER BY hm.joined_at ASC
  LIMIT 1
)
WHERE c.household_id IS NULL;

-- 4. Drop old RLS policies
DROP POLICY IF EXISTS "Users can view their own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert their own children" ON public.children;
DROP POLICY IF EXISTS "Users can update their own children" ON public.children;
DROP POLICY IF EXISTS "Users can delete their own children" ON public.children;

-- 5. Create new RLS policies based on household membership
CREATE POLICY "Users can view children in their households"
ON public.children FOR SELECT
USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert children in their households"
ON public.children FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update children in their households"
ON public.children FOR UPDATE
USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete children in their households"
ON public.children FOR DELETE
USING (
  household_id IN (
    SELECT household_id FROM public.household_members
    WHERE user_id = auth.uid()
  )
);

-- 6. Update logs table RLS to use household-based access through children
DROP POLICY IF EXISTS "Users can view logs for their children" ON public.logs;
DROP POLICY IF EXISTS "Users can insert logs for their children" ON public.logs;
DROP POLICY IF EXISTS "Users can update logs for their children" ON public.logs;
DROP POLICY IF EXISTS "Users can delete logs for their children" ON public.logs;

CREATE POLICY "Users can view logs for children in their households"
ON public.logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = logs.child_id
    AND c.household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert logs for children in their households"
ON public.logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = logs.child_id
    AND c.household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update logs for children in their households"
ON public.logs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = logs.child_id
    AND c.household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete logs for children in their households"
ON public.logs FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.children c
    WHERE c.id = logs.child_id
    AND c.household_id IN (
      SELECT household_id FROM public.household_members
      WHERE user_id = auth.uid()
    )
  )
);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
