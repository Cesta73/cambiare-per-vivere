/*
  Shared reminders and the "Mio Cammino" training foundation.

  Browser notifications and calendar export can both read from reminders.
  Native Android alarm/watch integration can be added later without changing
  the core planning data.
*/

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'measurement', 'meal_plan', 'medication', 'appointment',
    'journal_morning', 'journal_evening', 'camino_workout', 'dharma_practice', 'other'
  )),
  entity_id UUID,
  remind_at TIMESTAMPTZ NOT NULL,
  repeat_rule TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_select_own" ON reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_reminders_user_time ON reminders(user_id, remind_at);
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS camino_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  target_name TEXT NOT NULL DEFAULT 'Ultimi 100 km del Cammino di Santiago',
  target_date DATE NOT NULL DEFAULT '2027-04-25',
  target_distance_km NUMERIC(6,2) NOT NULL DEFAULT 100,
  weekly_training_days INT DEFAULT 3 CHECK (weekly_training_days BETWEEN 1 AND 7),
  current_comfortable_distance_km NUMERIC(6,2),
  current_challenging_distance_km NUMERIC(6,2),
  current_max_distance_km NUMERIC(6,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE camino_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camino_settings_select_own" ON camino_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "camino_settings_insert_own" ON camino_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "camino_settings_update_own" ON camino_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "camino_settings_delete_own" ON camino_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_camino_settings_updated_at BEFORE UPDATE ON camino_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS camino_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN (
    'easy_walk', 'long_walk', 'hills', 'strength', 'mobility', 'recovery', 'test_walk', 'other'
  )),
  title TEXT NOT NULL,
  planned_distance_km NUMERIC(6,2),
  planned_duration_minutes INT,
  actual_distance_km NUMERIC(6,2),
  actual_duration_minutes INT,
  steps INT,
  perceived_effort INT CHECK (perceived_effort BETWEEN 1 AND 10),
  pain_or_difficulty TEXT,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE camino_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camino_workouts_select_own" ON camino_workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "camino_workouts_insert_own" ON camino_workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "camino_workouts_update_own" ON camino_workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "camino_workouts_delete_own" ON camino_workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_camino_workouts_user_date ON camino_workouts(user_id, planned_date);
CREATE TRIGGER update_camino_workouts_updated_at BEFORE UPDATE ON camino_workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_logs_unique_daily
  ON medication_logs(user_id, reminder_id, log_date);
