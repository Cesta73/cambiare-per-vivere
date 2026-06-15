ALTER TABLE planned_meals
  ADD COLUMN IF NOT EXISTS quantity_g NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS calories_kcal INT CHECK (calories_kcal >= 0);

ALTER TABLE hunger_satiety_entries
  ADD COLUMN IF NOT EXISTS planned_meal_id UUID UNIQUE REFERENCES planned_meals(id) ON DELETE CASCADE;
