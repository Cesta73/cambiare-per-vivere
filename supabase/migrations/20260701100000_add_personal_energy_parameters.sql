-- Parametri personali necessari al modello energetico Mifflin-St Jeor.
-- Migrazione additiva; nessun dato esistente viene rimosso.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS biological_sex text;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_biological_sex_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_biological_sex_check
  CHECK (biological_sex IS NULL OR biological_sex IN ('male', 'female'));
