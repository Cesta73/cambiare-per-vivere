-- Campi opzionali per i report professionali e classificazione completa attività.
-- Migrazione additiva: nessun dato esistente viene modificato o cancellato.

ALTER TABLE public.body_measurements
  ADD COLUMN IF NOT EXISTS body_fat_percent numeric,
  ADD COLUMN IF NOT EXISTS body_water_percent numeric,
  ADD COLUMN IF NOT EXISTS muscle_percent numeric,
  ADD COLUMN IF NOT EXISTS bone_mass_kg numeric,
  ADD COLUMN IF NOT EXISTS basal_metabolism_kcal integer;

ALTER TABLE public.medication_reminders
  ADD COLUMN IF NOT EXISTS dosage_text text;

ALTER TABLE public.activity_entries DROP CONSTRAINT IF EXISTS activity_entries_activity_type_check;
ALTER TABLE public.activity_entries
  ADD CONSTRAINT activity_entries_activity_type_check
  CHECK (activity_type IN ('walking','aerobic','strength','mobility','yoga','daily','other'));
