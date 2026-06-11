
-- Contemplative preferences per user
CREATE TABLE IF NOT EXISTS contemplative_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'secular' CHECK (mode IN ('secular', 'spiritual', 'both')),
  streak_type TEXT NOT NULL DEFAULT 'none' CHECK (streak_type IN ('none', 'consecutive_days', 'weekly_count', 'minutes')),
  sound_enabled BOOLEAN DEFAULT TRUE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  breath_sync_enabled BOOLEAN DEFAULT TRUE,
  mantra_enabled BOOLEAN DEFAULT TRUE,
  guide_text_enabled BOOLEAN DEFAULT TRUE,
  show_moon_calendar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE contemplative_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contempl_prefs_select_own" ON contemplative_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contempl_prefs_insert_own" ON contemplative_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_prefs_update_own" ON contemplative_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_prefs_delete_own" ON contemplative_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Contemplative sessions (actual practice records)
CREATE TABLE IF NOT EXISTS contemplative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_key TEXT NOT NULL,
  practice_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('secular', 'spiritual')),
  planned_duration_sec INT,
  actual_duration_sec INT,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  linked_to TEXT,
  linked_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contemplative_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contempl_sessions_select_own" ON contemplative_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contempl_sessions_insert_own" ON contemplative_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_sessions_update_own" ON contemplative_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_sessions_delete_own" ON contemplative_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_contempl_sessions_user_date ON contemplative_sessions(user_id, started_at);

-- Contemplative check-ins (before / after a practice)
CREATE TABLE IF NOT EXISTS contemplative_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES contemplative_sessions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('before', 'after')),
  state_label TEXT,
  stress_score INT CHECK (stress_score BETWEEN 1 AND 5),
  energy_score INT CHECK (energy_score BETWEEN 1 AND 5),
  helpful BOOLEAN,
  what_noticed TEXT,
  reason_here TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contemplative_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contempl_checkins_select_own" ON contemplative_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contempl_checkins_insert_own" ON contemplative_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_checkins_update_own" ON contemplative_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_checkins_delete_own" ON contemplative_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Study progress
CREATE TABLE IF NOT EXISTS contemplative_study_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  bookmarked BOOLEAN DEFAULT FALSE,
  personal_notes TEXT,
  last_opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_key)
);

ALTER TABLE contemplative_study_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contempl_study_select_own" ON contemplative_study_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "contempl_study_insert_own" ON contemplative_study_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_study_update_own" ON contemplative_study_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "contempl_study_delete_own" ON contemplative_study_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_contempl_prefs_updated_at BEFORE UPDATE ON contemplative_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contempl_sessions_updated_at BEFORE UPDATE ON contemplative_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contempl_study_updated_at BEFORE UPDATE ON contemplative_study_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
