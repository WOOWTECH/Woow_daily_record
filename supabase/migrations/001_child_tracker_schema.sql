-- ============================================
-- Phase 3: Child Tracker Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. CHILDREN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dob DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON public.children(parent_id);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
CREATE POLICY "Users can view their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own children"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);

-- ============================================
-- 3. ACTIVITY TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.activity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    color_theme TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS (Read-only for all authenticated users)
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_types (read-only)
CREATE POLICY "All authenticated users can view activity types"
    ON public.activity_types FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- 4. LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    activity_type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    value NUMERIC,
    unit TEXT,
    note TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_logs_child_id ON public.logs(child_id);
CREATE INDEX IF NOT EXISTS idx_logs_activity_type_id ON public.logs(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_logs_start_time ON public.logs(start_time DESC);

-- Enable RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for logs (users can only access logs for their children)
CREATE POLICY "Users can view logs for their children"
    ON public.logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = logs.child_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their children"
    ON public.logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = logs.child_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs for their children"
    ON public.logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = logs.child_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs for their children"
    ON public.logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.children
            WHERE children.id = logs.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- ============================================
-- 5. SEED DATA - Activity Types
-- ============================================

-- Feeding (飲食) - accent-yellow
INSERT INTO public.activity_types (name, category, icon_name, color_theme) VALUES
    ('母乳', 'feeding', 'Baby', 'accent-yellow'),
    ('配方奶', 'feeding', 'Milk', 'accent-yellow'),
    ('副食品', 'feeding', 'Utensils', 'accent-yellow');

-- Sleep (睡眠) - accent-cyan
INSERT INTO public.activity_types (name, category, icon_name, color_theme) VALUES
    ('睡覺', 'sleep', 'Moon', 'accent-cyan'),
    ('起床', 'sleep', 'Sun', 'accent-cyan');

-- Excretion (排泄) - accent-green
INSERT INTO public.activity_types (name, category, icon_name, color_theme) VALUES
    ('尿尿', 'excretion', 'Droplet', 'accent-green'),
    ('便便', 'excretion', 'Circle', 'accent-green');

-- Health (健康) - accent-pink
INSERT INTO public.activity_types (name, category, icon_name, color_theme) VALUES
    ('體溫', 'health', 'Thermometer', 'accent-pink'),
    ('吃藥', 'health', 'Pill', 'accent-pink');

-- Care (護理) - accent-purple
INSERT INTO public.activity_types (name, category, icon_name, color_theme) VALUES
    ('洗澡', 'care', 'Bath', 'accent-purple');

-- ============================================
-- 6. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_children
    BEFORE UPDATE ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_logs
    BEFORE UPDATE ON public.logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
