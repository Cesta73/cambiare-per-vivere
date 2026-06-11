import type {
  Profile, BodyMeasurement, DailyCheckin, JournalEntry,
  PlannedMeal, ActivityEntry, HydrationEntry, SleepEntry,
  MedicationReminder, Appointment, HabitDefinition, HabitLog,
  PersonalGoal, WorkShift, HungerSatietyEntry, ShoppingList,
  ShoppingListItem, FavoriteMeal
} from './supabase';

export const DEMO_USER_ID = 'demo-user-id';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];

export const demoProfile: Profile = {
  id: DEMO_USER_ID,
  display_name: 'Demo',
  height_cm: 175,
  birth_year: 1985,
  goal_description: 'Migliorare la salute generale e consolidare nuove abitudini, seguendo le indicazioni dei professionisti.',
  start_date: '2024-09-17',
  start_weight: 149.8,
  discharge_weight: 145.5,
  start_waist: 155.5,
  discharge_waist: 154.0,
  start_neck: 52.0,
  discharge_neck: 50.0,
  preferred_weigh_days: ['monday', 'thursday'],
  uses_cpap: true,
  hide_weight_dashboard: false,
  hide_bmi: false,
  is_demo: true,
  dark_mode: false,
  created_at: '2024-09-17T00:00:00Z',
  updated_at: today + 'T00:00:00Z',
};

export const demoMeasurements: BodyMeasurement[] = [
  { id: 'dm1', user_id: DEMO_USER_ID, measured_at: '2024-09-17', weight_kg: 149.8, waist_cm: 155.5, neck_cm: 52.0, systolic_bp: null, diastolic_bp: null, notes: 'Misurazione iniziale percorso', created_at: '2024-09-17T08:00:00Z', updated_at: '2024-09-17T08:00:00Z' },
  { id: 'dm2', user_id: DEMO_USER_ID, measured_at: '2024-10-03', weight_kg: 145.5, waist_cm: 154.0, neck_cm: 50.0, systolic_bp: null, diastolic_bp: null, notes: 'Misurazione alla dimissione', created_at: '2024-10-03T08:00:00Z', updated_at: '2024-10-03T08:00:00Z' },
  { id: 'dm3', user_id: DEMO_USER_ID, measured_at: '2024-11-04', weight_kg: 143.2, waist_cm: 152.5, neck_cm: 49.5, systolic_bp: null, diastolic_bp: null, notes: null, created_at: '2024-11-04T08:00:00Z', updated_at: '2024-11-04T08:00:00Z' },
  { id: 'dm4', user_id: DEMO_USER_ID, measured_at: '2024-12-02', weight_kg: 141.8, waist_cm: 151.0, neck_cm: 49.0, systolic_bp: null, diastolic_bp: null, notes: null, created_at: '2024-12-02T08:00:00Z', updated_at: '2024-12-02T08:00:00Z' },
  { id: 'dm5', user_id: DEMO_USER_ID, measured_at: yesterday, weight_kg: 140.5, waist_cm: 150.0, neck_cm: 48.5, systolic_bp: null, diastolic_bp: null, notes: null, created_at: yesterday + 'T08:00:00Z', updated_at: yesterday + 'T08:00:00Z' },
];

export const demoDailyCheckin: DailyCheckin = {
  id: 'dc1',
  user_id: DEMO_USER_ID,
  checkin_date: today,
  mood_score: 3,
  energy_score: 3,
  motivation_score: 4,
  stress_score: 2,
  water_ml: 750,
  sleep_hours: 7,
  cpap_used: true,
  sleep_quality: 3,
  steps: 3200,
  activity_minutes: 0,
  top_priority: 'Bere almeno 2 litri d\'acqua',
  notes: null,
  created_at: today + 'T07:00:00Z',
  updated_at: today + 'T07:00:00Z',
};

export const demoJournalEntries: JournalEntry[] = [
  {
    id: 'je1',
    user_id: DEMO_USER_ID,
    entry_date: yesterday,
    feeling_today: 'Un po\' stanco dopo il turno, ma sono soddisfatto di aver rispettato il piano alimentare.',
    small_victory: 'Ho scelto frutta invece del biscotto per lo spuntino.',
    main_difficulty: 'Il turno notturno mi ha fatto venire voglia di dolci.',
    what_helped: 'Avere la frutta già pronta in borsa.',
    tomorrow_intention: 'Fare una passeggiata di 20 minuti.',
    current_need: 'Riposo e idratazione.',
    free_notes: null,
    important_event: null,
    photo_url: null,
    created_at: yesterday + 'T21:00:00Z',
    updated_at: yesterday + 'T21:00:00Z',
  },
  {
    id: 'je2',
    user_id: DEMO_USER_ID,
    entry_date: twoDaysAgo,
    feeling_today: 'Buona giornata, energia discreta.',
    small_victory: 'Ho camminato 30 minuti nel pomeriggio.',
    main_difficulty: null,
    what_helped: 'Il tempo bello ha reso piacevole la passeggiata.',
    tomorrow_intention: null,
    current_need: null,
    free_notes: 'Prima sessione di camminata della settimana.',
    important_event: null,
    photo_url: null,
    created_at: twoDaysAgo + 'T20:00:00Z',
    updated_at: twoDaysAgo + 'T20:00:00Z',
  },
];

export const demoActivities: ActivityEntry[] = [
  { id: 'ae1', user_id: DEMO_USER_ID, activity_date: twoDaysAgo, activity_type: 'walking', activity_name: 'Passeggiata', duration_minutes: 30, perceived_effort: 4, pain_or_difficulty: null, notes: 'Camminata piacevole', created_at: twoDaysAgo + 'T16:00:00Z', updated_at: twoDaysAgo + 'T16:00:00Z' },
  { id: 'ae2', user_id: DEMO_USER_ID, activity_date: threeDaysAgo, activity_type: 'mobility', activity_name: 'Stretching mattutino', duration_minutes: 15, perceived_effort: 2, pain_or_difficulty: null, notes: null, created_at: threeDaysAgo + 'T07:30:00Z', updated_at: threeDaysAgo + 'T07:30:00Z' },
];

export const demoWorkShifts: WorkShift[] = [
  { id: 'ws1', user_id: DEMO_USER_ID, date: today, shift_type: 'morning', custom_label: null, start_time: '06:00', end_time: '14:00', notes: null, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
  { id: 'ws2', user_id: DEMO_USER_ID, date: yesterday, shift_type: 'rest', custom_label: null, start_time: null, end_time: null, notes: null, created_at: yesterday + 'T00:00:00Z', updated_at: yesterday + 'T00:00:00Z' },
  { id: 'ws3', user_id: DEMO_USER_ID, date: twoDaysAgo, shift_type: 'night', custom_label: null, start_time: '22:00', end_time: '06:00', notes: null, created_at: twoDaysAgo + 'T00:00:00Z', updated_at: twoDaysAgo + 'T00:00:00Z' },
];

export const demoMedications: MedicationReminder[] = [
  { id: 'mr1', user_id: DEMO_USER_ID, name: 'Terapia settimanale prescritta', category: 'medication', frequency: 'weekly', scheduled_days: ['monday'], scheduled_time: '08:00', is_active: true, notes: 'Da assumere secondo prescrizione medica', professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.', created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'mr2', user_id: DEMO_USER_ID, name: 'Vitamina D', category: 'supplement', frequency: 'weekly', scheduled_days: ['sunday'], scheduled_time: null, is_active: true, notes: 'Secondo prescrizione', professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.', created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'mr3', user_id: DEMO_USER_ID, name: 'Folati', category: 'supplement', frequency: 'daily', scheduled_days: null, scheduled_time: '08:00', is_active: true, notes: 'Secondo prescrizione', professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.', created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'mr4', user_id: DEMO_USER_ID, name: 'Aminoacidi essenziali', category: 'supplement', frequency: 'daily', scheduled_days: null, scheduled_time: null, is_active: true, notes: 'Secondo prescrizione', professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.', created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'mr5', user_id: DEMO_USER_ID, name: 'CPAP', category: 'cpap', frequency: 'daily', scheduled_days: null, scheduled_time: '22:30', is_active: true, notes: 'Ogni notte durante il sonno', professional_note: 'Segui esclusivamente la prescrizione del professionista sanitario. Non modificare dose o frequenza tramite questa applicazione.', created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
];

export const demoAppointments: Appointment[] = [
  { id: 'ap1', user_id: DEMO_USER_ID, title: 'Controllo medico-dietistico', appointment_date: '2025-01-06', appointment_time: '10:00', type: 'dietitian', location: null, notes: 'Portare diario alimentare e misurazioni', is_past: true, outcome: null, is_archived: false, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'ap2', user_id: DEMO_USER_ID, title: 'Esami ematochimici', appointment_date: '2025-03-15', appointment_time: null, type: 'exam', location: null, notes: 'A digiuno', is_past: false, outcome: null, is_archived: false, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
];

export const demoHabits: HabitDefinition[] = [
  { id: 'hd1', user_id: DEMO_USER_ID, name: 'Bere 2L d\'acqua', description: null, icon: 'droplets', color: '#4A90D9', frequency: 'daily', scheduled_days: null, is_active: true, display_order: 0, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'hd2', user_id: DEMO_USER_ID, name: 'CPAP per il sonno', description: null, icon: 'wind', color: '#5B8B76', frequency: 'daily', scheduled_days: null, is_active: true, display_order: 1, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'hd3', user_id: DEMO_USER_ID, name: 'Passeggiata o movimento', description: null, icon: 'footprints', color: '#D4A853', frequency: 'daily', scheduled_days: null, is_active: true, display_order: 2, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'hd4', user_id: DEMO_USER_ID, name: 'Pasti pianificati', description: null, icon: 'utensils', color: '#8B6B5B', frequency: 'daily', scheduled_days: null, is_active: true, display_order: 3, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
];

export const demoHabitLogs: HabitLog[] = [
  { id: 'hl1', user_id: DEMO_USER_ID, habit_id: 'hd1', log_date: yesterday, completed: true, notes: null, created_at: yesterday + 'T21:00:00Z' },
  { id: 'hl2', user_id: DEMO_USER_ID, habit_id: 'hd2', log_date: yesterday, completed: true, notes: null, created_at: yesterday + 'T21:00:00Z' },
  { id: 'hl3', user_id: DEMO_USER_ID, habit_id: 'hd3', log_date: yesterday, completed: false, notes: null, created_at: yesterday + 'T21:00:00Z' },
  { id: 'hl4', user_id: DEMO_USER_ID, habit_id: 'hd4', log_date: yesterday, completed: true, notes: null, created_at: yesterday + 'T21:00:00Z' },
  { id: 'hl5', user_id: DEMO_USER_ID, habit_id: 'hd1', log_date: twoDaysAgo, completed: true, notes: null, created_at: twoDaysAgo + 'T21:00:00Z' },
  { id: 'hl6', user_id: DEMO_USER_ID, habit_id: 'hd2', log_date: twoDaysAgo, completed: true, notes: null, created_at: twoDaysAgo + 'T21:00:00Z' },
  { id: 'hl7', user_id: DEMO_USER_ID, habit_id: 'hd3', log_date: twoDaysAgo, completed: true, notes: null, created_at: twoDaysAgo + 'T21:00:00Z' },
  { id: 'hl8', user_id: DEMO_USER_ID, habit_id: 'hd4', log_date: twoDaysAgo, completed: true, notes: null, created_at: twoDaysAgo + 'T21:00:00Z' },
];

export const demoPersonalGoals: PersonalGoal[] = [
  { id: 'pg1', user_id: DEMO_USER_ID, title: 'Dormire meglio con la CPAP', description: 'Usare la CPAP ogni notte per migliorare la qualità del sonno', is_active: true, display_order: 0, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'pg2', user_id: DEMO_USER_ID, title: 'Muovermi di più ogni giorno', description: 'Anche solo una passeggiata conta', is_active: true, display_order: 1, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'pg3', user_id: DEMO_USER_ID, title: 'Consolidare le abitudini alimentari', description: 'Pianificare i pasti e rispettare gli spuntini', is_active: true, display_order: 2, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
];

export const demoHungerEntries: HungerSatietyEntry[] = [
  {
    id: 'hs1',
    user_id: DEMO_USER_ID,
    entry_datetime: yesterday + 'T12:30:00Z',
    meal_type: 'lunch',
    pre_hunger: 6,
    pre_emotional_state: 'Tranquillo',
    pre_eating_reason: 'Fame fisica',
    pre_craving: null,
    post_satiety: 7,
    post_satisfaction: 7,
    post_ate_calmly: true,
    post_stopped_at_right_time: true,
    post_notes: null,
    shift_type: 'rest',
    created_at: yesterday + 'T13:00:00Z',
    updated_at: yesterday + 'T13:00:00Z',
  },
];

export const demoFavoriteMeals: FavoriteMeal[] = [
  { id: 'fm1', user_id: DEMO_USER_ID, name: 'Yogurt con frutta fresca', meal_type: 'breakfast', ingredients: 'Yogurt greco, frutta di stagione', notes: null, shift_types: ['morning', 'rest'], use_count: 5, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'fm2', user_id: DEMO_USER_ID, name: 'Pasta con verdure', meal_type: 'lunch', ingredients: 'Pasta integrale, verdure di stagione, olio evo', notes: null, shift_types: null, use_count: 3, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
  { id: 'fm3', user_id: DEMO_USER_ID, name: 'Frutta fresca', meal_type: 'morning_snack', ingredients: 'Frutta di stagione', notes: null, shift_types: null, use_count: 8, created_at: '2024-09-17T00:00:00Z', updated_at: '2024-09-17T00:00:00Z' },
];

export const demoShoppingList: ShoppingList = {
  id: 'sl1',
  user_id: DEMO_USER_ID,
  name: 'Lista demo settimana corrente',
  week_start: null,
  is_completed: false,
  created_at: today + 'T00:00:00Z',
  updated_at: today + 'T00:00:00Z',
};

export const demoShoppingItems: ShoppingListItem[] = [
  { id: 'si1', user_id: DEMO_USER_ID, list_id: 'sl1', name: 'Yogurt greco', category: 'latticini', quantity: '4 vasetti', is_purchased: true, is_manual: false, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
  { id: 'si2', user_id: DEMO_USER_ID, list_id: 'sl1', name: 'Frutta di stagione', category: 'frutta', quantity: '1 kg', is_purchased: false, is_manual: false, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
  { id: 'si3', user_id: DEMO_USER_ID, list_id: 'sl1', name: 'Verdure miste', category: 'verdura', quantity: '500g', is_purchased: false, is_manual: false, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
  { id: 'si4', user_id: DEMO_USER_ID, list_id: 'sl1', name: 'Pasta integrale', category: 'cereali', quantity: '500g', is_purchased: false, is_manual: false, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
  { id: 'si5', user_id: DEMO_USER_ID, list_id: 'sl1', name: 'Petto di pollo', category: 'proteine', quantity: '400g', is_purchased: false, is_manual: false, created_at: today + 'T00:00:00Z', updated_at: today + 'T00:00:00Z' },
];
