import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive, BookOpen, CalendarDays, Check, ChevronRight, Database,
  Droplets, Dumbbell, Heart, Pill, Scale, Sparkles, Target, Utensils,
  Salad, Home, Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type {
  ActivityEntry, Appointment, DailyCheckin, HabitDefinition, HabitLog,
  HungerSatietyEntry, JournalEntry, MedicationLog, MedicationReminder,
  Reminder, WorkShift,
} from '../../lib/supabase';
import {
  formatDateLong, getGreeting, MEAL_TYPE_LABELS, SHIFT_LABELS, todayISO,
} from '../../lib/utils';
import { getTibetanCalendarDay, qualityLabel } from '../../lib/tibetan-calendar-2026';
import { BrandMark } from '../brand/BrandMark';
import { Modal } from '../ui/Modal';
import { QuickActivityModal } from './QuickActivityModal';
import { QuickMealModal } from './QuickMealModal';
import { QuickMoodModal } from './QuickMoodModal';
import { QuickWaterModal } from './QuickWaterModal';
import { QuickWeightModal } from './QuickWeightModal';
import { JarvisCorePage } from '../altro/JarvisCorePage';
import { sendJarvisCoreMessage } from '../../lib/jarvis-core';

const today = todayISO();
const dayStart = new Date(`${today}T00:00:00`).toISOString();
const dayEnd = new Date(`${today}T23:59:59`).toISOString();

type ModalName = 'weight' | 'water' | 'mood' | 'activity' | 'meal' | 'priority' | null;

interface CommandRow {
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
  tone?: 'normal' | 'attention' | 'complete';
  action: () => void;
}

function normalizeMedicationName(value: string) {
  return value.toLocaleLowerCase('it').replace(/[^a-z0-9]+/g, ' ').trim();
}

function medicationDueToday(item: MedicationReminder) {
  if (item.frequency === 'as_needed') return false;
  if (!item.scheduled_days?.length || item.frequency === 'daily') return true;
  const aliases = [
    ['sun', 'sunday', 'dom', 'domenica'],
    ['mon', 'monday', 'lun', 'lunedi'],
    ['tue', 'tuesday', 'mar', 'martedi'],
    ['wed', 'wednesday', 'mer', 'mercoledi'],
    ['thu', 'thursday', 'gio', 'giovedi'],
    ['fri', 'friday', 'ven', 'venerdi'],
    ['sat', 'saturday', 'sab', 'sabato'],
  ][new Date(`${today}T12:00:00`).getDay()];
  return item.scheduled_days.some(day => aliases.includes(
    day.toLocaleLowerCase('it').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  ));
}

export function OggiPage() {
  const {
    profile, user, showToast, setActiveTab, dataVersion,
  } = useApp();
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [habits, setHabits] = useState<HabitDefinition[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [shift, setShift] = useState<WorkShift | null>(null);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [meals, setMeals] = useState<HungerSatietyEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [journal, setJournal] = useState<JournalEntry | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalName>(null);
  const [priorityText, setPriorityText] = useState('');
  const [briefing, setBriefing] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [
      checkinRes, habitsRes, logsRes, shiftRes, medicationsRes,
      medicationLogsRes, mealsRes, activitiesRes, journalRes,
      appointmentRes, remindersRes,
    ] = await Promise.all([
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', today).maybeSingle(),
      supabase.from('habit_definitions').select('*').eq('user_id', user.id).eq('is_active', true).order('display_order'),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('log_date', today),
      supabase.from('work_shifts').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('medication_reminders').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('medication_logs').select('*').eq('user_id', user.id).eq('log_date', today),
      supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id).gte('entry_datetime', dayStart).lte('entry_datetime', dayEnd).order('entry_datetime'),
      supabase.from('activity_entries').select('*').eq('user_id', user.id).eq('activity_date', today),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('entry_date', today).maybeSingle(),
      supabase.from('appointments').select('*').eq('user_id', user.id).eq('is_archived', false).gte('appointment_date', today).order('appointment_date').order('appointment_time').limit(1).maybeSingle(),
      supabase.from('reminders').select('*').eq('user_id', user.id).eq('is_enabled', true).is('completed_at', null).gte('remind_at', dayStart).lte('remind_at', dayEnd),
    ]);

    setCheckin(checkinRes.data);
    setHabits(habitsRes.data ?? []);
    setHabitLogs(logsRes.data ?? []);
    setShift(shiftRes.data);
    setMedications(medicationsRes.data ?? []);
    setMedicationLogs(medicationLogsRes.data ?? []);
    setMeals(mealsRes.data ?? []);
    setActivities(activitiesRes.data ?? []);
    setJournal(journalRes.data);
    setNextAppointment(appointmentRes.data);
    setReminders(remindersRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData, dataVersion]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setBriefingLoading(true);
    setBriefingError(false);
    void sendJarvisCoreMessage(
      'Come sono messo oggi?',
      `web-home-briefing-${today}`,
      `web-home-briefing-${user.id}-${today}`,
    ).then(response => {
      if (active) setBriefing(response.answer.trim() || null);
    }).catch(() => {
      if (active) setBriefingError(true);
    }).finally(() => {
      if (active) setBriefingLoading(false);
    });
    return () => { active = false; };
  }, [user]);

  const dueMedications = useMemo(() => medications.filter(medicationDueToday), [medications]);
  const takenMedicationIds = new Set(medicationLogs.filter(log => log.taken).map(log => log.reminder_id));
  const takenMedicationNames = medicationLogs.filter(log => log.taken).map(log => normalizeMedicationName(log.reminder_name));
  const pendingMedications = dueMedications.filter(item => {
    if (takenMedicationIds.has(item.id)) return false;
    const name = normalizeMedicationName(item.name);
    return !takenMedicationNames.some(logged => logged.includes(name) || name.includes(logged));
  });
  const completedHabits = habits.filter(habit => habitLogs.some(log => log.habit_id === habit.id && log.completed));
  const waterMl = checkin?.water_ml ?? 0;
  const movementMinutes = activities.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0);
  const dharmaDay = getTibetanCalendarDay(today);

  const nextAppointmentLabel = nextAppointment
    ? `${nextAppointment.appointment_date === today ? nextAppointment.appointment_time?.slice(0, 5) || 'Oggi' : nextAppointment.appointment_date} · ${nextAppointment.title}`
    : reminders.length
      ? `${reminders.length} promemoria oggi`
      : 'Nessun impegno urgente';

  const latestMeal = meals[meals.length - 1];
  const mealLabel = latestMeal
    ? `${meals.length} registrat${meals.length === 1 ? 'o' : 'i'} · ${MEAL_TYPE_LABELS[latestMeal.meal_type || ''] || latestMeal.meal_type || 'Pasto'}`
    : 'Nessun pasto registrato';

  const commands: CommandRow[] = [
    {
      id: 'priority', label: 'Priorità', Icon: Target,
      value: checkin?.top_priority || 'Scegli una cosa realistica',
      tone: checkin?.top_priority ? 'complete' : 'attention',
      action: () => { setPriorityText(checkin?.top_priority || ''); setModal('priority'); },
    },
    {
      id: 'therapy', label: 'Terapia', Icon: Pill,
      value: pendingMedications.length ? `${pendingMedications.length} da confermare` : `${dueMedications.length} previste · in ordine`,
      tone: pendingMedications.length ? 'attention' : 'complete', action: () => setActiveTab('agenda'),
    },
    { id: 'nutrition', label: 'Piano alimentare', Icon: Salad, value: 'Menù, quantità e guida del giorno', action: () => setActiveTab('nutrizione') },
    { id: 'meal', label: 'Registra pasto', Icon: Utensils, value: mealLabel, action: () => setModal('meal') },
    { id: 'water', label: 'Acqua', Icon: Droplets, value: `${waterMl} ml · obiettivo 2–2,5 L`, tone: waterMl >= 2000 ? 'complete' : 'normal', action: () => setModal('water') },
    { id: 'movement', label: 'Movimento', Icon: Dumbbell, value: movementMinutes ? `${movementMinutes} minuti registrati` : 'Non ancora registrato', tone: movementMinutes ? 'complete' : 'normal', action: () => setModal('activity') },
    { id: 'journal', label: 'Diario', Icon: BookOpen, value: journal ? 'Aggiornato oggi' : 'Ancora da compilare', tone: journal ? 'complete' : 'normal', action: () => setActiveTab('diario') },
    { id: 'agenda', label: 'Agenda', Icon: CalendarDays, value: nextAppointmentLabel, action: () => setActiveTab('agenda') },
  ];
  const featureCards: CommandRow[] = [
    { id: 'nutrition', label: 'Nutrizione', value: 'Piano e scelte quotidiane', Icon: Salad, action: () => setActiveTab('nutrizione') },
    { id: 'pantry', label: 'Cambusa', value: 'Scorte, spesa e scadenze', Icon: Archive, action: () => setActiveTab('cambusa') },
    { id: 'agenda', label: 'Agenda', value: 'Impegni, turni e terapie', Icon: CalendarDays, action: () => setActiveTab('agenda') },
    { id: 'health', label: 'Salute', value: 'Terapie e segnali essenziali', Icon: Heart, action: () => setActiveTab('salute') },
    { id: 'movement', label: 'Movimento', value: 'Attività e progressi', Icon: Dumbbell, action: () => setActiveTab('movimento') },
    { id: 'family', label: 'Famiglia', value: 'Contesto familiare separato', Icon: Home, action: () => setActiveTab('famiglia') },
  ];

  async function savePriority() {
    if (!user || !priorityText.trim()) { setModal(null); return; }
    const { data, error } = await supabase.from('daily_checkins').upsert({
      user_id: user.id,
      checkin_date: today,
      top_priority: priorityText.trim(),
    }, { onConflict: 'user_id,checkin_date' }).select().maybeSingle();
    if (error) return showToast(`Priorità non salvata: ${error.message}`, 'error');
    if (data) setCheckin(data);
    setModal(null);
    showToast('Priorità aggiornata.', 'success');
  }

  async function toggleHabit(habit: HabitDefinition) {
    if (!user) return;
    const existing = habitLogs.find(log => log.habit_id === habit.id);
    const completed = !existing?.completed;
    const { data, error } = await supabase.from('habit_logs').upsert({
      user_id: user.id, habit_id: habit.id, log_date: today, completed,
    }, { onConflict: 'user_id,habit_id,log_date' }).select().maybeSingle();
    if (error) return showToast(`Abitudine non aggiornata: ${error.message}`, 'error');
    if (data) setHabitLogs(current => [...current.filter(log => log.habit_id !== habit.id), data]);
  }

  if (loading) {
    return <div className="command-page command-loading" aria-label="Caricamento della giornata" />;
  }

  return (
    <div className="jarvis-home">
      <header className="jarvis-home-header">
        <div className="jarvis-home-brand">
          <BrandMark className="w-12 h-12" title="Jarvis" />
          <span className="jarvis-wordmark">JARVIS</span>
        </div>
        <p className="jarvis-home-greeting">{getGreeting(profile?.display_name ?? null).replace(',', '').replace('!', '')}.</p>
        <h1>Come posso aiutarti oggi?</h1>
        <p className="jarvis-home-date">{formatDateLong(today)}</p>
      </header>

      <section className="card jarvis-briefing" aria-label="Il punto di Jarvis" aria-live="polite">
        <div className="jarvis-section-heading">
          <div>
            <p>Briefing e attenzione</p>
            <h2>Il punto di Jarvis</h2>
          </div>
          {briefingLoading && <Loader2 size={18} className="animate-spin text-sage-600" aria-label="Aggiornamento in corso" />}
        </div>
        {briefing && (
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-warm-gray-700">
            {briefing.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>)}
          </div>
        )}
        {!briefingLoading && !briefing && !briefingError && <p className="mt-3 text-sm text-warm-gray-500">Nulla richiede particolare attenzione.</p>}
        {briefingError && <p className="mt-3 text-sm text-warm-gray-500">Non riesco a preparare il punto della giornata in questo momento.</p>}
      </section>

      <JarvisCorePage embedded />

      <section className="jarvis-feature-grid" aria-label="Viste specializzate">
        {featureCards.map(({ id, label, value, Icon, action }) => (
          <button key={id} type="button" onClick={action} className="jarvis-feature-card">
            <Icon size={21} strokeWidth={1.4} />
            <span>
              <strong>{label}</strong>
              <small>{value}</small>
            </span>
            <ChevronRight size={16} strokeWidth={1.4} />
          </button>
        ))}
      </section>

      <section className="jarvis-today">
        <div className="jarvis-section-heading">
          <div>
            <p>Presenza quotidiana</p>
            <h2>Il tuo oggi</h2>
          </div>
          <button type="button" onClick={() => setActiveTab('agenda')}>
            {shift ? shift.custom_label || SHIFT_LABELS[shift.shift_type] : 'Giornata'}
          </button>
        </div>
        <div className="jarvis-today-meta">
          <span>{formatDateLong(today)}</span>
          {dharmaDay && <span>M{dharmaDay.tibetanMonth} · G{dharmaDay.tibetanDay} · {qualityLabel(dharmaDay.quality)}</span>}
        </div>
        <div className="command-list" aria-label="Guida della giornata">
          {commands.map(({ id, label, value, Icon, tone = 'normal', action }) => (
            <button key={id} type="button" onClick={action} className={`command-row command-row-${tone}`}>
              <span className="command-row-icon"><Icon size={19} strokeWidth={1.45} /></span>
              <span className="command-row-copy">
                <span className="command-row-label">{label}</span>
                <span className="command-row-value">{value}</span>
              </span>
              <ChevronRight size={17} strokeWidth={1.4} className="command-chevron" />
            </button>
          ))}
        </div>
      </section>

      <section className="command-tools" aria-label="Registrazioni rapide">
        <button onClick={() => setModal('mood')}><Heart size={18} /><span>Come sto</span></button>
        <button onClick={() => setModal('weight')}><Scale size={18} /><span>Peso</span></button>
        <button onClick={() => setActiveTab('dharma')}><Sparkles size={18} /><span>Dharma</span></button>
        <button onClick={() => setActiveTab('raw-data')}><Database size={18} /><span>Dati</span></button>
      </section>

      {habits.length > 0 && (
        <section className="command-habits">
          <div className="command-section-heading">
            <h2>Pratiche di oggi</h2>
            <span>{completedHabits.length}/{habits.length}</span>
          </div>
          <div className="command-habit-grid">
            {habits.map(habit => {
              const done = habitLogs.some(log => log.habit_id === habit.id && log.completed);
              return (
                <button key={habit.id} onClick={() => toggleHabit(habit)} className={done ? 'is-done' : ''}>
                  <span>{done ? <Check size={16} /> : <span className="habit-empty" />}</span>
                  {habit.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {modal === 'priority' && (
        <Modal isOpen title="Priorità di oggi" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <textarea className="input-field h-24 resize-none" value={priorityText} onChange={event => setPriorityText(event.target.value)} autoFocus />
            <button onClick={savePriority} className="btn-primary w-full">Salva priorità</button>
          </div>
        </Modal>
      )}
      {modal === 'weight' && <QuickWeightModal onClose={() => { setModal(null); void loadData(); }} />}
      {modal === 'water' && <QuickWaterModal checkin={checkin} onClose={() => { setModal(null); void loadData(); }} />}
      {modal === 'mood' && <QuickMoodModal checkin={checkin} onClose={() => { setModal(null); void loadData(); }} />}
      {modal === 'activity' && <QuickActivityModal onClose={() => { setModal(null); void loadData(); }} />}
      {modal === 'meal' && <QuickMealModal onClose={() => { setModal(null); void loadData(); }} />}
    </div>
  );
}
