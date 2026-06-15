ALTER TABLE hunger_satiety_entries
  ADD COLUMN IF NOT EXISTS protein_g NUMERIC(7,1) CHECK (protein_g >= 0),
  ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(7,1) CHECK (carbs_g >= 0),
  ADD COLUMN IF NOT EXISTS fat_g NUMERIC(7,1) CHECK (fat_g >= 0),
  ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(7,1) CHECK (fiber_g >= 0);

ALTER TABLE favorite_meals
  ADD COLUMN IF NOT EXISTS protein_g NUMERIC(7,1) CHECK (protein_g >= 0),
  ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(7,1) CHECK (carbs_g >= 0),
  ADD COLUMN IF NOT EXISTS fat_g NUMERIC(7,1) CHECK (fat_g >= 0),
  ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(7,1) CHECK (fiber_g >= 0);

ALTER TABLE planned_meals
  ADD COLUMN IF NOT EXISTS protein_g NUMERIC(7,1) CHECK (protein_g >= 0),
  ADD COLUMN IF NOT EXISTS carbs_g NUMERIC(7,1) CHECK (carbs_g >= 0),
  ADD COLUMN IF NOT EXISTS fat_g NUMERIC(7,1) CHECK (fat_g >= 0),
  ADD COLUMN IF NOT EXISTS fiber_g NUMERIC(7,1) CHECK (fiber_g >= 0);
