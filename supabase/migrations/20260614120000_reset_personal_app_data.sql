/*
  Clean start for the single-user personal app.

  This deliberately removes application data while preserving auth.users,
  so the existing login keeps working. Applying this migration is irreversible.
*/

TRUNCATE TABLE
  contemplative_checkins,
  contemplative_sessions,
  contemplative_study_progress,
  contemplative_preferences,
  habit_logs,
  habit_definitions,
  medication_logs,
  medication_reminders,
  appointments,
  sleep_entries,
  hydration_entries,
  activity_entries,
  body_measurements,
  hunger_satiety_entries,
  journal_entries,
  daily_checkins,
  shopping_list_items,
  shopping_lists,
  planned_meals,
  weekly_plans,
  favorite_meals,
  work_shifts,
  personal_goals,
  profiles
RESTART IDENTITY;

ALTER TABLE profiles
  ALTER COLUMN start_date DROP DEFAULT,
  ALTER COLUMN start_weight DROP DEFAULT,
  ALTER COLUMN discharge_weight DROP DEFAULT,
  ALTER COLUMN start_waist DROP DEFAULT,
  ALTER COLUMN discharge_waist DROP DEFAULT,
  ALTER COLUMN start_neck DROP DEFAULT,
  ALTER COLUMN discharge_neck DROP DEFAULT,
  ALTER COLUMN uses_cpap SET DEFAULT FALSE;
