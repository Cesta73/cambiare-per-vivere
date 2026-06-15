/*
  Indicative calorie tracking for meals and activities.
  The daily target is user-managed and defaults to the agreed cautious value.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS daily_calorie_target INT NOT NULL DEFAULT 2200
    CHECK (daily_calorie_target BETWEEN 800 AND 6000);

ALTER TABLE hunger_satiety_entries
  ADD COLUMN IF NOT EXISTS meal_name TEXT,
  ADD COLUMN IF NOT EXISTS quantity_g NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS calories_kcal INT CHECK (calories_kcal >= 0),
  ADD COLUMN IF NOT EXISTS calories_source TEXT CHECK (calories_source IN ('open_food_facts', 'manual')),
  ADD COLUMN IF NOT EXISTS source_product TEXT;

ALTER TABLE activity_entries
  ADD COLUMN IF NOT EXISTS calories_burned_kcal INT CHECK (calories_burned_kcal >= 0),
  ADD COLUMN IF NOT EXISTS calories_source TEXT CHECK (calories_source IN ('met_estimate', 'manual'));

CREATE INDEX IF NOT EXISTS idx_hunger_satiety_user_datetime
  ON hunger_satiety_entries(user_id, entry_datetime);
