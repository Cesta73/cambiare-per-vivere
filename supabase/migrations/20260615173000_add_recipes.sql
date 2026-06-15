CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  finished_weight_g NUMERIC(8,1) NOT NULL CHECK (finished_weight_g > 0),
  total_calories_kcal INT NOT NULL DEFAULT 0 CHECK (total_calories_kcal >= 0),
  total_protein_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (total_protein_g >= 0),
  total_carbs_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (total_carbs_g >= 0),
  total_fat_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (total_fat_g >= 0),
  total_fiber_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (total_fiber_g >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  quantity_g NUMERIC(8,1) NOT NULL CHECK (quantity_g > 0),
  calories_kcal INT NOT NULL DEFAULT 0 CHECK (calories_kcal >= 0),
  protein_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g NUMERIC(8,1) NOT NULL DEFAULT 0 CHECK (fiber_g >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_select_own" ON recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recipes_insert_own" ON recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_update_own" ON recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipes_delete_own" ON recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipe_ingredients_select_own" ON recipe_ingredients FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_insert_own" ON recipe_ingredients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_update_own" ON recipe_ingredients FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recipe_ingredients_delete_own" ON recipe_ingredients FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_recipes_user ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
