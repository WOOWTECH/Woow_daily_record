-- Create growth_records table
CREATE TABLE IF NOT EXISTS public.growth_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    height NUMERIC, -- in cm
    weight NUMERIC, -- in kg
    head_circumference NUMERIC, -- in cm
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.growth_records ENABLE ROW LEVEL SECURITY;

-- Create Policy: View own children's records
CREATE POLICY "Users can view records of their children"
    ON public.growth_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE public.children.id = public.growth_records.child_id
            AND public.children.parent_id = auth.uid() -- Assuming parent_id links to profiles.id which links to auth.uid via RLS logic or just parent_id matching user logic
            -- Actually, children.parent_id is profile.id.
            -- profiles.id is auth.users.id.
            -- So parent_id = auth.uid() works.
        )
    );

-- Create Policy: Insert records for own children
CREATE POLICY "Users can insert records for their children"
    ON public.growth_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE public.children.id = public.growth_records.child_id
            AND public.children.parent_id = auth.uid()
        )
    );

-- Create Trigger for updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.growth_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
