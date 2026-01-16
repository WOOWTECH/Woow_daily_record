// supabase/functions/generate-notifications/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60000); // Next 1 minute

  // Get events with reminders
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .not('reminder_minutes', 'eq', '{}')
    .gte('start_time', now.toISOString());

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let created = 0;

  for (const event of events || []) {
    const eventTime = new Date(event.start_time);

    for (const minutes of event.reminder_minutes || []) {
      const triggerAt = new Date(eventTime.getTime() - minutes * 60000);

      if (triggerAt >= now && triggerAt < windowEnd) {
        const { error } = await supabase.from('notifications').upsert(
          {
            household_id: event.household_id,
            source_type: 'calendar_event',
            source_id: event.id,
            title: event.title,
            message: minutes === 0 ? 'Starting now' : `In ${minutes} minutes`,
            icon: 'calendar',
            trigger_at: triggerAt.toISOString(),
          },
          { onConflict: 'source_type,source_id,trigger_at', ignoreDuplicates: true }
        );

        if (!error) created++;
      }
    }
  }

  return new Response(JSON.stringify({ success: true, created }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
