-- supabase/migrations/009_settings_schema.sql
-- ============================================
-- SETTINGS & ACCESS CONTROL SCHEMA (EXTENDS 003)
-- ============================================
-- This migration extends the existing households schema from 003
-- Adding site settings columns and new access control tables

-- ============================================
-- 1. ALTER HOUSEHOLDS TABLE - Add Site Settings columns
-- ============================================
-- Add owner_id column (derived from household_members where role='owner')
ALTER TABLE public.households
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add site settings columns
ALTER TABLE public.households
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS units TEXT DEFAULT 'metric',
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add CHECK constraints for new columns
DO $$ BEGIN
    ALTER TABLE public.households ADD CONSTRAINT units_check CHECK (units IN ('metric', 'imperial'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.households ADD CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'system'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.households ADD CONSTRAINT language_check CHECK (language IN ('en', 'zh-CN', 'zh-TW'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Populate owner_id from existing household_members where role='owner'
UPDATE public.households h
SET owner_id = (
    SELECT hm.user_id
    FROM public.household_members hm
    WHERE hm.household_id = h.id AND hm.role = 'owner'
    LIMIT 1
)
WHERE h.owner_id IS NULL;

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);

-- ============================================
-- 2. ALTER HOUSEHOLD_MEMBERS TABLE - Add invited_by column
-- ============================================
ALTER TABLE public.household_members
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- ============================================
-- 3. PAGE_PERMISSIONS TABLE (NEW)
-- Tracks per-page access levels for each member
-- Access levels: close (no access), view (read-only), partial (add records), edit (full)
-- ============================================
CREATE TABLE IF NOT EXISTS public.page_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_member_id UUID NOT NULL REFERENCES public.household_members(id) ON DELETE CASCADE,
    page TEXT NOT NULL CHECK (page IN ('activity', 'records', 'growth', 'analytics', 'settings')),
    access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('close', 'view', 'partial', 'edit')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(household_member_id, page)
);

CREATE INDEX IF NOT EXISTS idx_page_permissions_member_id ON public.page_permissions(household_member_id);
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for page_permissions
CREATE POLICY "Users can view their own permissions" ON public.page_permissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.household_members WHERE id = household_member_id AND user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Only owner can manage permissions" ON public.page_permissions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Only owner can update permissions" ON public.page_permissions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );

CREATE POLICY "Only owner can delete permissions" ON public.page_permissions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            JOIN public.households h ON h.id = hm.household_id
            WHERE hm.id = household_member_id AND h.owner_id = auth.uid()
        )
    );

-- ============================================
-- 4. INVITATIONS TABLE (NEW)
-- Tracks pending invitations to join a household
-- Invite code is 32-char hex (128-bit entropy for security)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    default_access_level TEXT DEFAULT 'view' CHECK (default_access_level IN ('view', 'partial', 'edit')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_household_id ON public.invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_invite_code ON public.invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_invitations_household_email ON public.invitations(household_id, email);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations for their households" ON public.invitations FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

CREATE POLICY "Only owner can create invitations" ON public.invitations FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

CREATE POLICY "Only owner can update invitations" ON public.invitations FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

CREATE POLICY "Only owner can delete invitations" ON public.invitations FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.households WHERE id = household_id AND owner_id = auth.uid()));

-- ============================================
-- 5. UPDATE TRIGGER for page_permissions
-- (households trigger already exists from 003)
-- ============================================
DROP TRIGGER IF EXISTS set_updated_at_page_permissions ON public.page_permissions;
CREATE TRIGGER set_updated_at_page_permissions
    BEFORE UPDATE ON public.page_permissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
