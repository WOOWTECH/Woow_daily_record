-- Calendar Events Schema
-- Migration: 006_calendar_schema.sql

-- Create event category enum
CREATE TYPE event_category AS ENUM ('personal', 'work', 'family', 'health', 'other');

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    category event_category DEFAULT 'personal',
    color TEXT, -- Optional color override
    recurrence_rule TEXT, -- iCal RRULE format
    recurrence_end TIMESTAMPTZ, -- When recurrence stops
    reminder_minutes INTEGER[] DEFAULT '{}', -- Array of minutes before event
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Ensure end_time is after start_time
    CONSTRAINT valid_time_range CHECK (end_time >= start_time)
);

-- Create indexes for common queries
CREATE INDEX idx_events_household_id ON public.events(household_id);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_end_time ON public.events(end_time);
CREATE INDEX idx_events_category ON public.events(category);
CREATE INDEX idx_events_time_range ON public.events(household_id, start_time, end_time);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Select: Users can view events from their household
CREATE POLICY "Users can view household events"
    ON public.events FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- Insert: Users can create events in their household
CREATE POLICY "Users can create household events"
    ON public.events FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- Update: Users can update events in their household
CREATE POLICY "Users can update household events"
    ON public.events FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- Delete: Users can delete events in their household
CREATE POLICY "Users can delete household events"
    ON public.events FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
