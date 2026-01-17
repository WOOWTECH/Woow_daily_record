-- ============================================
-- Tasks Schema
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    due_date DATE,

    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_tasks_household_id ON public.tasks(household_id);
CREATE INDEX idx_tasks_is_completed ON public.tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view tasks in their household"
    ON public.tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their household"
    ON public.tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their household"
    ON public.tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their household"
    ON public.tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE household_members.household_id = tasks.household_id
            AND household_members.user_id = auth.uid()
        )
    );

-- Updated at trigger
CREATE TRIGGER set_updated_at_tasks
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
