-- ============================================
-- Sites Schema (Rename from Households) & HA Integration
-- ============================================

-- 1. RENAME TABLES: households -> sites, household_members -> site_members
-- Note: We keep the original tables and create views for backwards compatibility
-- Then gradually migrate to new naming

-- First, add HA integration columns to households table
ALTER TABLE public.households
    ADD COLUMN IF NOT EXISTS ha_url TEXT,
    ADD COLUMN IF NOT EXISTS ha_token TEXT,
    ADD COLUMN IF NOT EXISTS ha_connected BOOLEAN DEFAULT false;

-- Add more role options to household_members
-- First drop the existing constraint
ALTER TABLE public.household_members
    DROP CONSTRAINT IF EXISTS household_members_role_check;

-- Add new constraint with expanded roles
ALTER TABLE public.household_members
    ADD CONSTRAINT household_members_role_check
    CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- Add new columns for invitation tracking
ALTER TABLE public.household_members
    ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'removed'));

-- Update existing members to have 'active' status
UPDATE public.household_members
SET status = 'active', accepted_at = joined_at
WHERE status IS NULL OR status = '';

-- 2. CREATE SITE_INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.site_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE,
    email TEXT, -- Optional: for direct email invitations
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes for site_invitations
CREATE INDEX IF NOT EXISTS idx_site_invitations_code ON public.site_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_site_invitations_household_id ON public.site_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_site_invitations_email ON public.site_invitations(email);

ALTER TABLE public.site_invitations ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR SITE_INVITATIONS

-- Site members can view invitations for their site
CREATE POLICY "Site members can view invitations"
    ON public.site_invitations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = site_invitations.household_id
            AND hm.user_id = auth.uid()
            AND hm.status = 'active'
        )
    );

-- Site admins can create invitations
CREATE POLICY "Site admins can create invitations"
    ON public.site_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = site_invitations.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
    );

-- Site admins can update invitations
CREATE POLICY "Site admins can update invitations"
    ON public.site_invitations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = site_invitations.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
    );

-- Site admins can delete invitations
CREATE POLICY "Site admins can delete invitations"
    ON public.site_invitations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = site_invitations.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
    );

-- Anyone can view invitation by code (for accepting)
CREATE POLICY "Anyone can view invitation by code"
    ON public.site_invitations FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- 4. UPDATE HOUSEHOLD_MEMBERS RLS POLICIES

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view household members" ON public.household_members;
DROP POLICY IF EXISTS "Owners can add household members" ON public.household_members;
DROP POLICY IF EXISTS "Owners can remove household members" ON public.household_members;

-- New policies with expanded roles
-- Users can view all members in their site
CREATE POLICY "Users can view site members"
    ON public.household_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
            AND hm.status = 'active'
        )
    );

-- Site admins can add members
CREATE POLICY "Site admins can add members"
    ON public.household_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
        )
    );

-- Site admins can update members (except owners can't be demoted by admins)
CREATE POLICY "Site admins can update members"
    ON public.household_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
    );

-- Site admins can remove members (owners can't be removed, admins can't remove other admins)
CREATE POLICY "Site admins can remove members"
    ON public.household_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.household_id = household_members.household_id
            AND hm.user_id = auth.uid()
            AND hm.role IN ('owner', 'admin')
            AND hm.status = 'active'
        )
        AND household_members.role != 'owner'
    );

-- 5. FUNCTION TO USE INVITE CODE
CREATE OR REPLACE FUNCTION public.use_invite_code(p_invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_invitation RECORD;
    v_user_id UUID;
    v_existing_member RECORD;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- Get invitation
    SELECT * INTO v_invitation
    FROM public.site_invitations
    WHERE invite_code = p_invite_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses = 0 OR uses_count < max_uses);

    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
    END IF;

    -- Check if already a member
    SELECT * INTO v_existing_member
    FROM public.household_members
    WHERE household_id = v_invitation.household_id
    AND user_id = v_user_id;

    IF v_existing_member IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Already a member of this site');
    END IF;

    -- Add user as member
    INSERT INTO public.household_members (household_id, user_id, role, invited_by, status, accepted_at)
    VALUES (v_invitation.household_id, v_user_id, v_invitation.role, v_invitation.created_by, 'active', NOW());

    -- Increment uses count
    UPDATE public.site_invitations
    SET uses_count = uses_count + 1
    WHERE id = v_invitation.id;

    -- Deactivate if max uses reached
    IF v_invitation.max_uses > 0 AND v_invitation.uses_count + 1 >= v_invitation.max_uses THEN
        UPDATE public.site_invitations
        SET is_active = false
        WHERE id = v_invitation.id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'household_id', v_invitation.household_id,
        'role', v_invitation.role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION TO GENERATE INVITE CODE
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 8 character code
        v_code := upper(substr(md5(random()::text), 1, 8));

        -- Check if exists
        SELECT EXISTS(SELECT 1 FROM public.site_invitations WHERE invite_code = v_code) INTO v_exists;

        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. UPDATE HOUSEHOLDS RLS POLICY FOR HA SETTINGS
-- Only owners and admins can update HA settings
DROP POLICY IF EXISTS "Owners can update their households" ON public.households;

CREATE POLICY "Admins can update their sites"
    ON public.households FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
            AND household_members.role IN ('owner', 'admin')
            AND household_members.status = 'active'
        )
    );

-- 8. CREATE VIEWS FOR ALIAS (sites = households)
-- This allows gradual migration to new naming
CREATE OR REPLACE VIEW public.sites AS
SELECT
    id,
    name,
    ha_url,
    ha_token,
    ha_connected,
    created_at,
    updated_at
FROM public.households;

CREATE OR REPLACE VIEW public.site_members AS
SELECT
    id,
    household_id AS site_id,
    user_id,
    role,
    joined_at,
    invited_by,
    invited_at,
    accepted_at,
    status
FROM public.household_members;

-- Grant access to views
GRANT SELECT ON public.sites TO authenticated;
GRANT SELECT ON public.site_members TO authenticated;

-- 9. UPDATE DEFAULT HOUSEHOLD NAME
-- Change default from "My Family" to "My Field" for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_household()
RETURNS TRIGGER AS $$
DECLARE
    new_household_id UUID;
BEGIN
    -- Create a new household (site)
    INSERT INTO public.households (name)
    VALUES ('我的場域')
    RETURNING id INTO new_household_id;

    -- Add user as owner
    INSERT INTO public.household_members (household_id, user_id, role, status, accepted_at)
    VALUES (new_household_id, NEW.id, 'owner', 'active', NOW());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
