-- Notifications Schema
-- Migration: 008_notifications.sql

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,

  title TEXT NOT NULL,
  message TEXT,
  icon TEXT,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  trigger_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_notification UNIQUE (source_type, source_id, trigger_at)
);

-- Indexes
CREATE INDEX idx_notifications_household_unread
  ON public.notifications(household_id, is_read, trigger_at DESC);

CREATE INDEX idx_notifications_trigger
  ON public.notifications(trigger_at)
  WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view household notifications" ON public.notifications
FOR SELECT USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update household notifications" ON public.notifications
FOR UPDATE USING (
  household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
