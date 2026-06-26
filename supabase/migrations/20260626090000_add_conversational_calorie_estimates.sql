alter table public.hunger_satiety_entries
  drop constraint if exists hunger_satiety_entries_calories_source_check;

alter table public.hunger_satiety_entries
  add constraint hunger_satiety_entries_calories_source_check
  check (calories_source in ('open_food_facts', 'manual', 'deepseek_estimate'));

alter table public.hunger_satiety_entries
  add column if not exists calories_min_kcal int check (calories_min_kcal >= 0),
  add column if not exists calories_max_kcal int check (calories_max_kcal >= 0),
  add column if not exists calorie_confidence text
    check (calorie_confidence in ('low', 'medium', 'high')),
  add column if not exists calorie_assumptions jsonb not null default '[]'::jsonb,
  add column if not exists calorie_unclear_items jsonb not null default '[]'::jsonb,
  add column if not exists calorie_emotional_note text;

alter table public.favorite_meals
  drop constraint if exists favorite_meals_calories_source_check;

alter table public.favorite_meals
  add constraint favorite_meals_calories_source_check
  check (calories_source in ('open_food_facts', 'manual', 'deepseek_estimate'));
