
-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  height_cm NUMERIC(5,1),
  birth_year INT,
  goal_description TEXT,
  start_date DATE DEFAULT '2024-09-17',
  start_weight NUMERIC(6,2) DEFAULT 149.8,
  discharge_weight NUMERIC(6,2) DEFAULT 145.5,
  start_waist NUMERIC(6,2) DEFAULT 155.5,
  discharge_waist NUMERIC(6,2) DEFAULT 154.0,
  start_neck NUMERIC(6,2) DEFAULT 52.0,
  discharge_neck NUMERIC(6,2) DEFAULT 50.0,
  preferred_weigh_days TEXT[] DEFAULT ARRAY['monday'],
  uses_cpap BOOLEAN DEFAULT TRUE,
  hide_weight_dashboard BOOLEAN DEFAULT FALSE,
  hide_bmi BOOLEAN DEFAULT FALSE,
  pin_enabled BOOLEAN DEFAULT FALSE,
  pin_hash TEXT,
  locale TEXT DEFAULT 'it-IT',
  timezone TEXT DEFAULT 'Europe/Rome',
  dark_mode BOOLEAN DEFAULT FALSE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Personal Goals
CREATE TABLE IF NOT EXISTS personal_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_goals_select_own" ON personal_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "personal_goals_insert_own" ON personal_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_goals_update_own" ON personal_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "personal_goals_delete_own" ON personal_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Work Shifts
CREATE TABLE IF NOT EXISTS work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL CHECK (shift_type IN ('morning','afternoon','night','rest','custom')),
  custom_label TEXT,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_shifts_select_own" ON work_shifts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "work_shifts_insert_own" ON work_shifts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_shifts_update_own" ON work_shifts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_shifts_delete_own" ON work_shifts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_work_shifts_user_date ON work_shifts(user_id, date);

-- Favorite Meals
CREATE TABLE IF NOT EXISTS favorite_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast','morning_snack','lunch','afternoon_snack','dinner','night_snack')),
  ingredients TEXT,
  notes TEXT,
  shift_types TEXT[],
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE favorite_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorite_meals_select_own" ON favorite_meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorite_meals_insert_own" ON favorite_meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorite_meals_update_own" ON favorite_meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorite_meals_delete_own" ON favorite_meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Weekly Plans
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_plans_select_own" ON weekly_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "weekly_plans_insert_own" ON weekly_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_plans_update_own" ON weekly_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weekly_plans_delete_own" ON weekly_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Planned Meals
CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast','morning_snack','lunch','afternoon_snack','dinner','night_snack')),
  name TEXT NOT NULL,
  ingredients TEXT,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  favorite_meal_id UUID REFERENCES favorite_meals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planned_meals_select_own" ON planned_meals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "planned_meals_insert_own" ON planned_meals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planned_meals_update_own" ON planned_meals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planned_meals_delete_own" ON planned_meals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_planned_meals_user_date ON planned_meals(user_id, plan_date);

-- Shopping Lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  week_start DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_lists_select_own" ON shopping_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "shopping_lists_insert_own" ON shopping_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_lists_update_own" ON shopping_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_lists_delete_own" ON shopping_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Shopping List Items
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'altro' CHECK (category IN ('frutta','verdura','proteine','latticini','cereali','dispensa','surgelati','bevande','altro')),
  quantity TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shopping_list_items_select_own" ON shopping_list_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "shopping_list_items_insert_own" ON shopping_list_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_list_items_update_own" ON shopping_list_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shopping_list_items_delete_own" ON shopping_list_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Daily Checkins
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  mood_score INT CHECK (mood_score BETWEEN 1 AND 5),
  energy_score INT CHECK (energy_score BETWEEN 1 AND 5),
  motivation_score INT CHECK (motivation_score BETWEEN 1 AND 5),
  stress_score INT CHECK (stress_score BETWEEN 1 AND 5),
  water_ml INT DEFAULT 0,
  sleep_hours NUMERIC(4,2),
  cpap_used BOOLEAN,
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 5),
  steps INT,
  activity_minutes INT DEFAULT 0,
  top_priority TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_checkins_select_own" ON daily_checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "daily_checkins_insert_own" ON daily_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_checkins_update_own" ON daily_checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_checkins_delete_own" ON daily_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  feeling_today TEXT,
  small_victory TEXT,
  main_difficulty TEXT,
  what_helped TEXT,
  tomorrow_intention TEXT,
  current_need TEXT,
  free_notes TEXT,
  important_event TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_entries_select_own" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_entries_insert_own" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_update_own" ON journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_delete_own" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);

-- Hunger Satiety Entries
CREATE TABLE IF NOT EXISTS hunger_satiety_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_datetime TIMESTAMPTZ NOT NULL,
  meal_type TEXT,
  pre_hunger INT CHECK (pre_hunger BETWEEN 0 AND 10),
  pre_emotional_state TEXT,
  pre_eating_reason TEXT,
  pre_craving TEXT,
  post_satiety INT CHECK (post_satiety BETWEEN 0 AND 10),
  post_satisfaction INT CHECK (post_satisfaction BETWEEN 0 AND 10),
  post_ate_calmly BOOLEAN,
  post_stopped_at_right_time BOOLEAN,
  post_notes TEXT,
  shift_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hunger_satiety_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hunger_satiety_select_own" ON hunger_satiety_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "hunger_satiety_insert_own" ON hunger_satiety_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hunger_satiety_update_own" ON hunger_satiety_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hunger_satiety_delete_own" ON hunger_satiety_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Body Measurements
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at DATE NOT NULL,
  weight_kg NUMERIC(6,2),
  waist_cm NUMERIC(6,2),
  neck_cm NUMERIC(6,2),
  systolic_bp INT,
  diastolic_bp INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "body_measurements_select_own" ON body_measurements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "body_measurements_insert_own" ON body_measurements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "body_measurements_update_own" ON body_measurements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "body_measurements_delete_own" ON body_measurements FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, measured_at);

-- Activity Entries
CREATE TABLE IF NOT EXISTS activity_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('walking','aerobic','strength','mobility','daily','other')),
  activity_name TEXT,
  duration_minutes INT NOT NULL,
  perceived_effort INT CHECK (perceived_effort BETWEEN 1 AND 10),
  pain_or_difficulty TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_entries_select_own" ON activity_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "activity_entries_insert_own" ON activity_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_entries_update_own" ON activity_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activity_entries_delete_own" ON activity_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Hydration Entries
CREATE TABLE IF NOT EXISTS hydration_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  amount_ml INT NOT NULL DEFAULT 250,
  entry_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hydration_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hydration_entries_select_own" ON hydration_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "hydration_entries_insert_own" ON hydration_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hydration_entries_update_own" ON hydration_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hydration_entries_delete_own" ON hydration_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_hydration_entries_user_date ON hydration_entries(user_id, entry_date);

-- Sleep Entries
CREATE TABLE IF NOT EXISTS sleep_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL,
  bedtime TIME,
  wake_time TIME,
  duration_hours NUMERIC(4,2),
  quality INT CHECK (quality BETWEEN 1 AND 5),
  cpap_used BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sleep_date)
);

ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sleep_entries_select_own" ON sleep_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sleep_entries_insert_own" ON sleep_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_entries_update_own" ON sleep_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sleep_entries_delete_own" ON sleep_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Medication Reminders
CREATE TABLE IF NOT EXISTS medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'supplement' CHECK (category IN ('medication','supplement','appointment','exam','cpap','other')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','biweekly','monthly','once','as_needed')),
  scheduled_days TEXT[],
  scheduled_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  professional_note TEXT DEFAULT 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medication_reminders_select_own" ON medication_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "medication_reminders_insert_own" ON medication_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medication_reminders_update_own" ON medication_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medication_reminders_delete_own" ON medication_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Medication Logs
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES medication_reminders(id) ON DELETE SET NULL,
  reminder_name TEXT NOT NULL,
  log_date DATE NOT NULL,
  log_time TIME,
  taken BOOLEAN NOT NULL,
  notes TEXT,
  symptoms_to_report TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medication_logs_select_own" ON medication_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "medication_logs_insert_own" ON medication_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medication_logs_update_own" ON medication_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "medication_logs_delete_own" ON medication_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_medication_logs_user_date ON medication_logs(user_id, log_date);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  type TEXT DEFAULT 'other' CHECK (type IN ('medical','dietitian','exam','therapy','other')),
  location TEXT,
  notes TEXT,
  is_past BOOLEAN DEFAULT FALSE,
  outcome TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointments_select_own" ON appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "appointments_insert_own" ON appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_update_own" ON appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "appointments_delete_own" ON appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);

-- Habit Definitions
CREATE TABLE IF NOT EXISTS habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'check',
  color TEXT DEFAULT '#5B8B76',
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily','weekdays','weekly','custom')),
  scheduled_days TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habit_definitions_select_own" ON habit_definitions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "habit_definitions_insert_own" ON habit_definitions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_definitions_update_own" ON habit_definitions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_definitions_delete_own" ON habit_definitions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Habit Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, log_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "habit_logs_select_own" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "habit_logs_insert_own" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_logs_update_own" ON habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "habit_logs_delete_own" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, log_date);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_goals_updated_at BEFORE UPDATE ON personal_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planned_meals_updated_at BEFORE UPDATE ON planned_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_body_measurements_updated_at BEFORE UPDATE ON body_measurements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON daily_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medication_reminders_updated_at BEFORE UPDATE ON medication_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habit_definitions_updated_at BEFORE UPDATE ON habit_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
