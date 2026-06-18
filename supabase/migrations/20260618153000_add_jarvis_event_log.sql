/*
  Jarvis is the primary data-entry surface.

  This table is the durable receipt for every Telegram message processed by
  Jarvis. The app can show whether a request was saved, still needs answers,
  was conversational only, or failed.
*/

CREATE TABLE IF NOT EXISTS jarvis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'telegram',
  chat_id TEXT,
  message_id TEXT,
  raw_text TEXT NOT NULL,
  intent TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (
    status IN ('received', 'pending', 'saved', 'chat', 'error')
  ),
  entity_type TEXT,
  entity_id UUID,
  summary TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_jarvis_events_message
  ON jarvis_events(user_id, source, message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jarvis_events_user_received
  ON jarvis_events(user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_jarvis_events_user_status
  ON jarvis_events(user_id, status, received_at DESC);

ALTER TABLE jarvis_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jarvis_events_select_own"
  ON jarvis_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "jarvis_events_insert_own"
  ON jarvis_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jarvis_events_update_own"
  ON jarvis_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jarvis_events_delete_own"
  ON jarvis_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_jarvis_events_updated_at ON jarvis_events;
CREATE TRIGGER update_jarvis_events_updated_at
  BEFORE UPDATE ON jarvis_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'jarvis_events',
    'body_measurements',
    'daily_checkins',
    'journal_entries',
    'hunger_satiety_entries',
    'activity_entries',
    'hydration_entries',
    'sleep_entries',
    'medication_logs',
    'reminders',
    'camino_workouts',
    'contemplative_sessions'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
