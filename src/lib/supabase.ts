import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      body_measurements: { Row: BodyMeasurement; Insert: Partial<BodyMeasurement>; Update: Partial<BodyMeasurement> };
      daily_checkins: { Row: DailyCheckin; Insert: Partial<DailyCheckin>; Update: Partial<DailyCheckin> };
      journal_entries: { Row: JournalEntry; Insert: Partial<JournalEntry>; Update: Partial<JournalEntry> };
      planned_meals: { Row: PlannedMeal; Insert: Partial<PlannedMeal>; Update: Partial<PlannedMeal> };
      favorite_meals: { Row: FavoriteMeal; Insert: Partial<FavoriteMeal>; Update: Partial<FavoriteMeal> };
      shopping_lists: { Row: ShoppingList; Insert: Partial<ShoppingList>; Update: Partial<ShoppingList> };
      shopping_list_items: { Row: ShoppingListItem; Insert: Partial<ShoppingListItem>; Update: Partial<ShoppingListItem> };
      activity_entries: { Row: ActivityEntry; Insert: Partial<ActivityEntry>; Update: Partial<ActivityEntry> };
      hydration_entries: { Row: HydrationEntry; Insert: Partial<HydrationEntry>; Update: Partial<HydrationEntry> };
      sleep_entries: { Row: SleepEntry; Insert: Partial<SleepEntry>; Update: Partial<SleepEntry> };
      medication_reminders: { Row: MedicationReminder; Insert: Partial<MedicationReminder>; Update: Partial<MedicationReminder> };
      medication_logs: { Row: MedicationLog; Insert: Partial<MedicationLog>; Update: Partial<MedicationLog> };
      appointments: { Row: Appointment; Insert: Partial<Appointment>; Update: Partial<Appointment> };
      habit_definitions: { Row: HabitDefinition; Insert: Partial<HabitDefinition>; Update: Partial<HabitDefinition> };
      habit_logs: { Row: HabitLog; Insert: Partial<HabitLog>; Update: Partial<HabitLog> };
      personal_goals: { Row: PersonalGoal; Insert: Partial<PersonalGoal>; Update: Partial<PersonalGoal> };
      work_shifts: { Row: WorkShift; Insert: Partial<WorkShift>; Update: Partial<WorkShift> };
      hunger_satiety_entries: { Row: HungerSatietyEntry; Insert: Partial<HungerSatietyEntry>; Update: Partial<HungerSatietyEntry> };
    };
  };
};

export interface Profile {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  birth_year: number | null;
  goal_description: string | null;
  start_date: string;
  start_weight: number;
  discharge_weight: number;
  start_waist: number;
  discharge_waist: number;
  start_neck: number;
  discharge_neck: number;
  preferred_weigh_days: string[];
  uses_cpap: boolean;
  hide_weight_dashboard: boolean;
  hide_bmi: boolean;
  is_demo: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number | null;
  waist_cm: number | null;
  neck_cm: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  mood_score: number | null;
  energy_score: number | null;
  motivation_score: number | null;
  stress_score: number | null;
  water_ml: number;
  sleep_hours: number | null;
  cpap_used: boolean | null;
  sleep_quality: number | null;
  steps: number | null;
  activity_minutes: number;
  top_priority: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  feeling_today: string | null;
  small_victory: string | null;
  main_difficulty: string | null;
  what_helped: string | null;
  tomorrow_intention: string | null;
  current_need: string | null;
  free_notes: string | null;
  important_event: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlannedMeal {
  id: string;
  user_id: string;
  plan_date: string;
  meal_type: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'night_snack';
  name: string;
  ingredients: string | null;
  notes: string | null;
  is_completed: boolean;
  favorite_meal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FavoriteMeal {
  id: string;
  user_id: string;
  name: string;
  meal_type: string | null;
  ingredients: string | null;
  notes: string | null;
  shift_types: string[] | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  week_start: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  list_id: string;
  name: string;
  category: string;
  quantity: string | null;
  is_purchased: boolean;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  activity_date: string;
  activity_type: 'walking' | 'aerobic' | 'strength' | 'mobility' | 'daily' | 'other';
  activity_name: string | null;
  duration_minutes: number;
  perceived_effort: number | null;
  pain_or_difficulty: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HydrationEntry {
  id: string;
  user_id: string;
  entry_date: string;
  amount_ml: number;
  entry_time: string | null;
  notes: string | null;
  created_at: string;
}

export interface SleepEntry {
  id: string;
  user_id: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  duration_hours: number | null;
  quality: number | null;
  cpap_used: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationReminder {
  id: string;
  user_id: string;
  name: string;
  category: 'medication' | 'supplement' | 'appointment' | 'exam' | 'cpap' | 'other';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'once' | 'as_needed';
  scheduled_days: string[] | null;
  scheduled_time: string | null;
  is_active: boolean;
  notes: string | null;
  professional_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  user_id: string;
  reminder_id: string | null;
  reminder_name: string;
  log_date: string;
  log_time: string | null;
  taken: boolean;
  notes: string | null;
  symptoms_to_report: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  title: string;
  appointment_date: string;
  appointment_time: string | null;
  type: 'medical' | 'dietitian' | 'exam' | 'therapy' | 'other';
  location: string | null;
  notes: string | null;
  is_past: boolean;
  outcome: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitDefinition {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'custom';
  scheduled_days: string[] | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

export interface PersonalGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkShift {
  id: string;
  user_id: string;
  date: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'rest' | 'custom';
  custom_label: string | null;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HungerSatietyEntry {
  id: string;
  user_id: string;
  entry_datetime: string;
  meal_type: string | null;
  pre_hunger: number | null;
  pre_emotional_state: string | null;
  pre_eating_reason: string | null;
  pre_craving: string | null;
  post_satiety: number | null;
  post_satisfaction: number | null;
  post_ate_calmly: boolean | null;
  post_stopped_at_right_time: boolean | null;
  post_notes: string | null;
  shift_type: string | null;
  created_at: string;
  updated_at: string;
}
