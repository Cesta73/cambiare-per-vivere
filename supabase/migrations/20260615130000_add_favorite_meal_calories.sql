ALTER TABLE favorite_meals
  ADD COLUMN IF NOT EXISTS quantity_g NUMERIC(7,1),
  ADD COLUMN IF NOT EXISTS calories_kcal INT CHECK (calories_kcal >= 0),
  ADD COLUMN IF NOT EXISTS calories_source TEXT CHECK (calories_source IN ('open_food_facts', 'manual')),
  ADD COLUMN IF NOT EXISTS source_product TEXT;
