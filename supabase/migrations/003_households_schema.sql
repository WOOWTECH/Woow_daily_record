-- ============================================
-- Households Schema for Family Sharing
-- ============================================

-- 1. HOUSEHOLDS TABLE
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'My Family',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- 2. HOUSEHOLD MEMBERS (join table)
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR HOUSEHOLDS
-- Users can view households they belong to
CREATE POLICY "Users can view their households"
    ON public.households FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
        )
    );

-- Users can update households they own
CREATE POLICY "Owners can update their households"
    ON public.households FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = households.id
            AND household_members.user_id = auth.uid()
            AND household_members.role = 'owner'
        )
    );

-- 4. RLS POLICIES FOR HOUSEHOLD MEMBERS
-- Users can view their own membership records (simple policy to avoid recursion)
CREATE POLICY "Users can view household members"
    ON public.household_members FOR SELECT
    USING (user_id = auth.uid());

-- Owners can add members
CREATE POLICY "Owners can add household members"
    ON public.household_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = household_members.household_id
            AND household_members.user_id = auth.uid()
            AND household_members.role = 'owner'
        )
        OR NOT EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = household_members.household_id
        )
    );

-- Owners can remove members
CREATE POLICY "Owners can remove household members"
    ON public.household_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members AS owner_check
            WHERE owner_check.household_id = household_members.household_id
            AND owner_check.user_id = auth.uid()
            AND owner_check.role = 'owner'
        )
    );

-- 5. UPDATED_AT TRIGGER
CREATE TRIGGER set_updated_at_households
    BEFORE UPDATE ON public.households
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. AUTO-CREATE HOUSEHOLD ON USER SIGNUP
-- Function to create default household for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_household()
RETURNS TRIGGER AS $$
DECLARE
    new_household_id UUID;
BEGIN
    -- Create a new household
    INSERT INTO public.households (name)
    VALUES ('My Family')
    RETURNING id INTO new_household_id;

    -- Add user as owner
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (new_household_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on profile creation (after user signs up)
CREATE TRIGGER on_profile_created_create_household
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_household();

-- ============================================
-- ONE-TIME MIGRATION FOR EXISTING USERS
-- Run this section once to create households for existing users
-- who don't have one yet. Can be commented out after initial run.
-- ============================================
DO $$
DECLARE
    profile_record RECORD;
    new_household_id UUID;
BEGIN
    FOR profile_record IN
        SELECT p.id
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.household_members hm
            WHERE hm.user_id = p.id
        )
    LOOP
        -- Create household
        INSERT INTO public.households (name)
        VALUES ('My Family')
        RETURNING id INTO new_household_id;

        -- Add as owner
        INSERT INTO public.household_members (household_id, user_id, role)
        VALUES (new_household_id, profile_record.id, 'owner');
    END LOOP;
END $$;
