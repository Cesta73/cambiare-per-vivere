import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarDays, Check, Flag, Footprints, Mountain, Plus,
  Route, ShieldCheck, Sparkles, Trophy,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { CaminoSettings, CaminoWorkout } from '../../lib/supabase';
import { dateToISO, formatDateLong, formatDateShort, getWeekStart } from '../../lib/utils';

interface Props {
  onBack: () => void;
}

const TARGET_DATE = '2027-04-25';

const WORKOUT_LABELS: Record<CaminoWorkout['workout_type'], string> = {
  easy_walk: 'Camminata facile',
  long_walk: 'Camminata lunga',
  hills: 'Salite e terreno vario',
  strength: 'Forza funzionale',
  mobility: 'Mobilità',
  recovery: 'Recupero attivo',
  test_walk: 'Camminata di verifica',
  other: 'Altro',
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return dateToISO(next);
};

export function CamminoPage({ onBack }: Props) {
  const { user, showToast } = useApp();
  const [settings, setSettings] = useState<CaminoSettings | null>(null);
  const [workouts, setWorkouts] = useState<CaminoWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekStartISO = dateToISO(weekStart);
  const weekEndISO = addDays(weekStart, 6);

  useEffect(() => {
    void loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [settingsResult, workoutsResult] = await Promise.all([
      supabase.from('camino_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('camino_workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('planned_date', weekStartISO)
        .lte('planned_date', weekEndISO)
        .order('planned_date'),
    ]);

    if (settingsResult.error || workoutsResult.error) {
      showToast('Applica prima la migrazione Mio Cammino nel database.', 'error');
      setLoading(false);
      return;
    }

    if (settingsResult.data) {
      setSettings(settingsResult.data);
    } else {
      const { data, error } = await supabase.from('camino_settings').insert({
        user_id: user.id,
        target_name: 'Ultimi 100 km del Cammino di Santiago',
        target_date: TARGET_DATE,
        target_distance_km: 100,
        weekly_training_days: 5,
        current_comfortable_distance_km: 4,
        current_challenging_distance_km: 8,
        current_max_distance_km: 12,
        notes: 'Piano personale adattabile. Aumentare solo se il recupero è buono.',
      }).select().maybeSingle();
      if (error) showToast(`Impostazioni non salvate: ${error.message}`, 'error');
      if (data) setSettings(data);
    }
    setWorkouts(workoutsResult.data ?? []);
    setLoading(false);
  };

  const createStarterWeek = async () => {
    if (!user || workouts.length > 0) return;
    const plan = [
      { offset: 0, workout_type: 'easy_walk', title: 'Passo tranquillo', planned_distance_km: 3, planned_duration_minutes: null },
      { offset: 1, workout_type: 'strength', title: 'Forza e stabilità', planned_distance_km: null, planned_duration_minutes: 20 },
      { offset: 3, workout_type: 'easy_walk', title: 'Camminata comoda', planned_distance_km: 4, planned_duration_minutes: null },
      { offset: 5, workout_type: 'long_walk', title: 'Lungo della settimana', planned_distance_km: 6, planned_duration_minutes: null },
      { offset: 6, workout_type: 'recovery', title: 'Recupero attivo', planned_distance_km: 2, planned_duration_minutes: null },
    ];
    const { data, error } = await supabase.from('camino_workouts').insert(plan.map(item => ({
      user_id: user.id,
      planned_date: addDays(weekStart, item.offset),
      workout_type: item.workout_type,
      title: item.title,
      planned_distance_km: item.planned_distance_km,
      planned_duration_minutes: item.planned_duration_minutes,
    }))).select();
    if (error) {
      showToast(`Piano non creato: ${error.message}`, 'error');
      return;
    }
    setWorkouts(data ?? []);
    showToast('Prima settimana creata. Conta la costanza, non la perfezione.', 'success');
  };

  const toggleWorkout = async (workout: CaminoWorkout) => {
    const completed = !workout.completed;
    const { data, error } = await supabase.from('camino_workouts').update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      actual_distance_km: completed ? workout.actual_distance_km ?? workout.planned_distance_km : workout.actual_distance_km,
      actual_duration_minutes: completed ? workout.actual_duration_minutes ?? workout.planned_duration_minutes : workout.actual_duration_minutes,
    }).eq('id', workout.id).select().maybeSingle();
    if (error) {
      showToast(`Allenamento non aggiornato: ${error.message}`, 'error');
      return;
    }
    if (data) setWorkouts(prev => prev.map(item => item.id === data.id ? data : item));
    showToast(completed ? 'Passo completato. Il cammino cresce così.' : 'Allenamento riaperto.', completed ? 'success' : 'info');
  };

  const completed = workouts.filter(workout => workout.completed);
  const completedKm = completed.reduce((sum, workout) => sum + (workout.actual_distance_km ?? 0), 0);
  const plannedKm = workouts.reduce((sum, workout) => sum + (workout.planned_distance_km ?? 0), 0);
  const xp = completed.length * 20 + Math.round(completedKm * 5);
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const daysToTarget = Math.max(0, Math.ceil((new Date(`${TARGET_DATE}T12:00:00`).getTime() - Date.now()) / 86400000));

  if (loading) {
    return <div className="card animate-pulse h-48 bg-warm-gray-100" />;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100" aria-label="Torna alla home">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="section-title">Mio Cammino</h1>
          <p className="text-sm text-warm-gray-500">Verso Santiago, un passo alla volta</p>
        </div>
        <Route size={26} className="text-amber-700" />
      </div>

      <div className="card bg-gradient-to-br from-amber-700 to-orange-800 text-white border-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-amber-100 text-xs font-semibold uppercase tracking-wide">Obiettivo</p>
            <h2 className="font-bold text-lg mt-1">{settings?.target_name}</h2>
            <p className="text-amber-100 text-sm mt-1">{formatDateLong(settings?.target_date ?? TARGET_DATE)} · {daysToTarget} giorni</p>
          </div>
          <Flag size={30} className="text-amber-200 flex-shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-sage-700">4</p>
          <p className="text-xs text-warm-gray-500">km comodi</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-amber-700">8</p>
          <p className="text-xs text-warm-gray-500">km impegnativi</p>
        </div>
        <div className="card-sm text-center">
          <p className="text-2xl font-bold text-orange-800">12</p>
          <p className="text-xs text-warm-gray-500">km massimo</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-600" />
            <h2 className="font-semibold text-warm-gray-800">Livello {level}</h2>
          </div>
          <span className="text-sm font-semibold text-amber-700">{xp} punti</span>
        </div>
        <div className="w-full bg-warm-gray-100 rounded-full h-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full" style={{ width: `${levelProgress}%` }} />
        </div>
        <p className="text-xs text-warm-gray-500 mt-2">I punti premiano costanza e chilometri completati, senza penalità per i giorni saltati.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-warm-gray-800">Questa settimana</h2>
            <p className="text-xs text-warm-gray-500">{formatDateShort(weekStartISO)} - {formatDateShort(weekEndISO)}</p>
          </div>
          <span className="text-sm font-semibold text-sage-700">{completed.length}/{workouts.length}</span>
        </div>

        {workouts.length === 0 ? (
          <button onClick={createStarterWeek} className="w-full border-2 border-dashed border-amber-200 rounded-xl p-4 text-amber-800 font-semibold flex items-center justify-center gap-2">
            <Plus size={18} /> Crea la prima settimana
          </button>
        ) : (
          <div className="space-y-2">
            {workouts.map(workout => (
              <button
                key={workout.id}
                onClick={() => toggleWorkout(workout)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${workout.completed ? 'bg-sage-50 border border-sage-200' : 'bg-warm-gray-50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${workout.completed ? 'bg-sage-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {workout.completed ? <Check size={19} /> : workout.workout_type === 'long_walk' ? <Mountain size={19} /> : <Footprints size={19} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-warm-gray-800">{workout.title}</p>
                  <p className="text-xs text-warm-gray-500">
                    {formatDateLong(workout.planned_date)} · {WORKOUT_LABELS[workout.workout_type]}
                    {workout.planned_distance_km ? ` · ${workout.planned_distance_km} km` : ''}
                    {workout.planned_duration_minutes ? ` · ${workout.planned_duration_minutes} min` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {workouts.length > 0 && (
          <p className="text-xs text-warm-gray-500 mt-3">
            Settimana: {completedKm.toFixed(1)} km completati su {plannedKm.toFixed(1)} km pianificati.
          </p>
        )}
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={18} className="text-orange-700" />
          <h2 className="font-semibold text-warm-gray-800">Tappe di preparazione</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['Estate 2026', 'Rendere 8 km una distanza comoda'],
            ['Autunno 2026', 'Consolidare 10-12 km senza difficoltà importanti'],
            ['Inverno 2026/27', 'Costruire forza, continuità e camminate su terreno vario'],
            ['Febbraio-Marzo 2027', 'Allenare giornate consecutive e lunghi progressivi'],
            ['Aprile 2027', 'Scarico, verifica equipaggiamento e partenza'],
          ].map(([period, goal]) => (
            <div key={period} className="flex gap-3">
              <Sparkles size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div><strong className="text-warm-gray-800">{period}:</strong> <span className="text-warm-gray-600">{goal}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-sage-50 border-sage-200">
        <div className="flex gap-3">
          <ShieldCheck size={19} className="text-sage-700 flex-shrink-0" />
          <p className="text-xs text-sage-800 leading-relaxed">
            Il piano è un supporto organizzativo personale. Dolore, affanno insolito o difficoltà persistenti sono segnali per fermarsi e confrontarsi con i professionisti sanitari.
          </p>
        </div>
      </div>
    </div>
  );
}
