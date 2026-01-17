-- ============================================
-- Notes Schema for Household Notes
-- ============================================

-- 1. NOTES TABLE
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notes_household_id ON public.notes(household_id);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_is_pinned ON public.notes(is_pinned);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 2. RLS POLICIES FOR NOTES
-- Users can view notes in their household
CREATE POLICY "Users can view household notes"
    ON public.notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = notes.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Users can create notes in their household
CREATE POLICY "Users can create household notes"
    ON public.notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = notes.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Users can update notes in their household
CREATE POLICY "Users can update household notes"
    ON public.notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = notes.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Users can delete notes in their household
CREATE POLICY "Users can delete household notes"
    ON public.notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = notes.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- 3. UPDATED_AT TRIGGER
CREATE TRIGGER set_updated_at_notes
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
