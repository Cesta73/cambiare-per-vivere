import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, BookOpen, CheckCircle2, Clock3, Droplets,
  Footprints, HeartPulse, MessageCircle, Moon, Pill, RefreshCw,
  Ruler, Scale, Sparkles, Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { JarvisEvent } from '../../lib/supabase';
import { MEAL_TYPE_LABELS, todayISO } from '../../lib/utils';

type Period = 'today' | '7days' | '30days';

interface TimelineItem {
  id: string;
  at: string;
  title: string;
  detail: string;
  badge?: string;
  Icon: LucideIcon;
  color: string;
}

const formatTime = (value: string) => new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const dateStart = (period: Period) => {
  const date = new Date();
  if (period === '7days') date.setDate(date.getDate() - 6);
  if (period === '30days') date.setDate(date.getDate() - 29);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const dateOnlyStart = (period: Period) => dateStart(period).slice(0, 10);

export function RegistroPage({ compact = false }: { compact?: boolean } = {}) {
  const { user, dataVersion, showToast } = useApp();
  const [period, setPeriod] = useState<Period>('today');
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [events, setEvents] = useState<JarvisEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    const fromDate = period === 'today' ? todayISO() : dateOnlyStart(period);
    const fromTimestamp = period === 'today'
      ? new Date(`${todayISO()}T00:00:00`).toISOString()
      : dateStart(period);

    const results = await Promise.all([
      supabase.from('body_measurements').select('*').eq('user_id', user.id).gte('measured_at', fromDate),
      supabase.from('hydration_entries').select('*').eq('user_id', user.id).gte('entry_date', fromDate),
      supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id).gte('entry_datetime', fromTimestamp),
      supabase.from('activity_entries').select('*').eq('user_id', user.id).gte('activity_date', fromDate),
      supabase.from('camino_workouts').select('*').eq('user_id', user.id).gte('planned_date', fromDate),
      supabase.from('daily_checkins').select('*').eq('user_id', user.id).gte('checkin_date', fromDate),
      supabase.from('sleep_entries').select('*').eq('user_id', user.id).gte('sleep_date', fromDate),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('entry_date', fromDate),
      supabase.from('medication_logs').select('*').eq('user_id', user.id).gte('log_date', fromDate),
      supabase.from('contemplative_sessions').select('*').eq('user_id', user.id).gte('started_at', fromTimestamp),
      supabase.from('jarvis_events').select('*').eq('user_id', user.id).gte('received_at', fromTimestamp).order('received_at', { ascending: false }),
    ]);

    const firstError = results.find(result => result.error)?.error;
    if (firstError) {
      setLoadError(firstError.message);
      setLoading(false);
      return;
    }

    const [
      measurements, hydration, meals, activities, camino, checkins,
      sleep, journals, medicationLogs, contemplative, jarvisEvents,
    ] = results.map(result => result.data ?? []);

    const timeline: TimelineItem[] = [];
    measurements.forEach(row => {
      if (row.weight_kg !== null) timeline.push(item(row.id + '-weight', row.created_at, 'Peso', `${row.weight_kg} kg`, Scale, 'bg-petrol-50 text-petrol-700'));
      if (row.systolic_bp !== null && row.diastolic_bp !== null) timeline.push(item(row.id + '-bp', row.created_at, 'Pressione', `${row.systolic_bp}/${row.diastolic_bp}`, HeartPulse, 'bg-rose-50 text-rose-700'));
      if (row.waist_cm !== null || row.neck_cm !== null) timeline.push(item(row.id + '-measure', row.created_at, 'Misure corporee', `Addome ${row.waist_cm ?? '—'} cm · Collo ${row.neck_cm ?? '—'} cm`, Ruler, 'bg-teal-50 text-teal-700'));
    });
    hydration.forEach(row => timeline.push(item(row.id, row.created_at, 'Acqua', `${row.amount_ml} ml`, Droplets, 'bg-blue-50 text-blue-700')));
    meals.forEach(row => timeline.push(item(
      row.id,
      row.entry_datetime,
      row.meal_name || MEAL_TYPE_LABELS[row.meal_type ?? ''] || 'Pasto',
      mealDetail(row),
      Utensils,
      'bg-amber-50 text-amber-700',
      MEAL_TYPE_LABELS[row.meal_type ?? ''],
    )));
    activities.forEach(row => timeline.push(item(row.id, row.created_at, row.activity_name || 'Attività', `${row.duration_minutes} min${row.perceived_effort ? ` · sforzo ${row.perceived_effort}/10` : ''}`, Activity, 'bg-green-50 text-green-700')));
    camino.forEach(row => {
      if (!row.completed && !row.actual_distance_km) return;
      timeline.push(item(row.id, row.completed_at || row.created_at, `Cammino · ${row.title}`, `${row.actual_distance_km ?? 0} km${row.actual_duration_minutes ? ` · ${row.actual_duration_minutes} min` : ''}`, Footprints, 'bg-orange-50 text-orange-700'));
    });
    checkins.forEach(row => {
      const values = [
        row.mood_score && `umore ${row.mood_score}/5`,
        row.energy_score && `energia ${row.energy_score}/5`,
        row.motivation_score && `motivazione ${row.motivation_score}/5`,
        row.stress_score && `stress ${row.stress_score}/5`,
      ].filter(Boolean).join(' · ');
      if (values) timeline.push(item(row.id, row.updated_at, 'Come sto', values, HeartPulse, 'bg-rose-50 text-rose-700'));
    });
    sleep.forEach(row => timeline.push(item(row.id, row.updated_at, 'Sonno', `${row.duration_hours ?? '—'} ore · qualità ${row.quality ?? '—'}/5`, Moon, 'bg-indigo-50 text-indigo-700')));
    journals.forEach(row => timeline.push(item(row.id, row.updated_at, 'Diario', journalDetail(row), BookOpen, 'bg-warm-gray-100 text-warm-gray-700')));
    medicationLogs.forEach(row => timeline.push(item(row.id, row.created_at, row.reminder_name, row.taken ? 'Assunto' : 'Non assunto', Pill, 'bg-purple-50 text-purple-700')));
    contemplative.forEach(row => timeline.push(item(row.id, row.started_at, row.practice_name, `${Math.round((row.actual_duration_sec ?? row.planned_duration_sec ?? 0) / 60)} min`, Sparkles, 'bg-sage-50 text-sage-700')));

    timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    setItems(timeline);
    setEvents(jarvisEvents as JarvisEvent[]);
    setLoading(false);
  }, [period, user]);

  useEffect(() => {
    void loadData();
  }, [loadData, dataVersion]);

  const pendingCount = useMemo(
    () => events.filter(event => event.status === 'pending' || event.status === 'error').length,
    [events],
  );

  return (
    <div className="space-y-4 pb-4">
      <div className={`${compact ? '' : 'page-intro'} flex items-start justify-between gap-3`}>
        <div>
          <h1 className={compact ? 'font-semibold text-warm-gray-800' : 'section-title'}>{compact ? 'Registro Jarvis' : 'Registro'}</h1>
          {!compact && <p className="text-sm text-warm-gray-500 mt-1">Tutto ciò che Jarvis salva, nello stesso posto.</p>}
        </div>
        <button onClick={() => void loadData()} className="p-3 rounded-xl bg-white border border-warm-gray-100 text-sage-700" aria-label="Aggiorna">
          <RefreshCw size={19} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="segmented-control grid grid-cols-3 gap-2 bg-warm-gray-100 rounded-xl p-1">
        {([
          ['today', 'Oggi'],
          ['7days', '7 giorni'],
          ['30days', '30 giorni'],
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => setPeriod(value)} className={`py-2.5 rounded-lg text-sm font-semibold ${period === value ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="card bg-amber-50 border-amber-200 flex gap-3">
          <AlertCircle size={21} className="text-amber-700 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">{pendingCount} richieste da controllare</p>
            <p className="text-sm text-amber-800 mt-1">Sono incomplete oppure hanno prodotto un errore. Le trovi in “Messaggi Jarvis”.</p>
          </div>
        </div>
      )}

      {loadError ? (
        <div className="card bg-red-50 border-red-200">
          <p className="font-semibold text-red-800">Registro non disponibile</p>
          <p className="text-sm text-red-700 mt-1">{loadError}</p>
          <button onClick={() => { showToast('Riprovo a caricare il registro.', 'info'); void loadData(); }} className="btn-secondary mt-3">Riprova</button>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-semibold text-warm-gray-800">Dati registrati</h2>
              <span className="text-xs text-warm-gray-400">{items.length}</span>
            </div>
            {!loading && items.length === 0 && <EmptyState text="Nessun dato registrato nel periodo." />}
            {items.map(entry => <TimelineCard key={entry.id} entry={entry} />)}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-2">
              <h2 className="font-semibold text-warm-gray-800">Messaggi Jarvis</h2>
              <span className="text-xs text-warm-gray-400">{events.length}</span>
            </div>
            {!loading && events.length === 0 && <EmptyState text="I nuovi messaggi compariranno qui dopo l’aggiornamento di Jarvis." />}
            {events.map(event => <JarvisEventCard key={event.id} event={event} />)}
          </section>
        </>
      )}
    </div>
  );
}

function item(id: string, at: string, title: string, detail: string, Icon: LucideIcon, color: string, badge?: string): TimelineItem {
  return { id, at, title, detail, Icon, color, badge };
}

function mealDetail(row: Record<string, any>) {
  const parts = [
    row.pre_hunger !== null && `fame ${row.pre_hunger}/10`,
    row.post_satiety !== null && `sazietà ${row.post_satiety}/10`,
    row.post_satisfaction !== null && `soddisfazione ${row.post_satisfaction}/10`,
    row.calories_kcal !== null && `${row.calories_kcal} kcal`,
  ].filter(Boolean);
  return parts.join(' · ') || 'Pasto registrato';
}

function journalDetail(row: Record<string, any>) {
  return row.feeling_today || row.small_victory || row.main_difficulty || row.current_need || row.free_notes || 'Voce di diario registrata';
}

function TimelineCard({ entry }: { entry: TimelineItem }) {
  return (
    <div className="card-sm flex gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${entry.color}`}>
        <entry.Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-warm-gray-800">{entry.title}</p>
          <span className="text-xs text-warm-gray-400 whitespace-nowrap">{formatTime(entry.at)}</span>
        </div>
        <p className="text-sm text-warm-gray-600 mt-0.5 break-words">{entry.detail}</p>
        {entry.badge && <span className="inline-block text-xs mt-2 px-2 py-1 rounded-full bg-warm-gray-100 text-warm-gray-600">{entry.badge}</span>}
      </div>
    </div>
  );
}

function JarvisEventCard({ event }: { event: JarvisEvent }) {
  const status = {
    received: { label: 'Ricevuto', color: 'bg-blue-50 text-blue-700', Icon: Clock3 },
    pending: { label: 'Da completare', color: 'bg-amber-50 text-amber-700', Icon: AlertCircle },
    saved: { label: 'Salvato', color: 'bg-green-50 text-green-700', Icon: CheckCircle2 },
    chat: { label: 'Conversazione', color: 'bg-warm-gray-100 text-warm-gray-600', Icon: MessageCircle },
    error: { label: 'Errore', color: 'bg-red-50 text-red-700', Icon: AlertCircle },
  }[event.status];

  return (
    <div className="card-sm">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${status.color}`}>
          <status.Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
            <span className="text-xs text-warm-gray-400 whitespace-nowrap">{formatTime(event.received_at)}</span>
          </div>
          <p className="text-sm font-medium text-warm-gray-800 mt-2 break-words">{event.raw_text}</p>
          {(event.error_message || event.summary) && (
            <p className={`text-xs mt-1 break-words ${event.error_message ? 'text-red-700' : 'text-warm-gray-500'}`}>
              {event.error_message || event.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card text-center py-8">
      <MessageCircle size={25} className="mx-auto text-warm-gray-300" />
      <p className="text-sm text-warm-gray-400 mt-2">{text}</p>
    </div>
  );
}
