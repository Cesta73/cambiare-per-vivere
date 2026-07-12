import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BookOpen, CalendarDays, Check, ChevronRight, Database,
  Droplets, Dumbbell, Heart, Pill, Scale, Sparkles, Target, Utensils,
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
    profile, user, showToast, setActiveTab, dataVersion, openJarvisCore,
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
  const attentionCount = pendingMedications.length + reminders.length;
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
    ...(attentionCount > 0 ? [{
      id: 'attention', label: 'Da fare ora', Icon: AlertCircle,
      value: `${attentionCount} ${attentionCount === 1 ? 'elemento richiede' : 'elementi richiedono'} attenzione`,
      tone: 'attention' as const, action: () => setActiveTab('agenda'),
    }] : []),
    {
      id: 'therapy', label: 'Terapia', Icon: Pill,
      value: pendingMedications.length ? `${pendingMedications.length} da confermare` : `${dueMedications.length} previste · in ordine`,
      tone: pendingMedications.length ? 'attention' : 'complete', action: () => setActiveTab('agenda'),
    },
    { id: 'meal', label: 'Pasto', Icon: Utensils, value: mealLabel, action: () => setModal('meal') },
    { id: 'water', label: 'Acqua', Icon: Droplets, value: `${waterMl} / 2000 ml`, tone: waterMl >= 1500 ? 'complete' : 'normal', action: () => setModal('water') },
    { id: 'movement', label: 'Movimento', Icon: Dumbbell, value: movementMinutes ? `${movementMinutes} minuti registrati` : 'Non ancora registrato', tone: movementMinutes ? 'complete' : 'normal', action: () => setModal('activity') },
    { id: 'journal', label: 'Diario', Icon: BookOpen, value: journal ? 'Aggiornato oggi' : 'Ancora da compilare', tone: journal ? 'complete' : 'normal', action: () => setActiveTab('diario') },
    { id: 'agenda', label: 'Agenda', Icon: CalendarDays, value: nextAppointmentLabel, action: () => setActiveTab('agenda') },
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
    <div className="command-page">
      <header className="command-header">
        <div className="command-brand-line">
          <BrandMark className="w-11 h-11 text-mineral" title="Jarvis" />
          <div className="min-w-0">
            <p className="command-kicker">Cambiare per Vivere · Jarvis</p>
            <h1>{getGreeting(profile?.display_name ?? null)}</h1>
          </div>
          <button type="button" className="command-status" onClick={() => setActiveTab('agenda')}>
            {shift ? shift.custom_label || SHIFT_LABELS[shift.shift_type] : 'Giornata'}
          </button>
        </div>
        <div className="command-date-line">
          <span>{formatDateLong(today)}</span>
          {dharmaDay && <span>M{dharmaDay.tibetanMonth} · G{dharmaDay.tibetanDay} · {qualityLabel(dharmaDay.quality)}</span>}
        </div>
      </header>

      <section className="command-list" aria-label="Cabina di regia della giornata">
        {commands.map(({ id, label, value, Icon, tone = 'normal', action }) => (
          <button key={id} type="button" onClick={action} className={`command-row command-row-${tone}`}>
            <span className="command-row-icon"><Icon size={20} strokeWidth={1.8} /></span>
            <span className="command-row-copy">
              <span className="command-row-label">{label}</span>
              <span className="command-row-value">{value}</span>
            </span>
            <ChevronRight size={18} className="command-chevron" />
          </button>
        ))}
      </section>

      <button type="button" onClick={openJarvisCore} className="jarvis-command-button">
        <BrandMark className="w-8 h-8" title="Jarvis" />
        <span>Parla con Jarvis</span>
        <ChevronRight size={19} />
      </button>

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
