import { useState, useEffect } from 'react';
import {
  Scale, Utensils, Droplets, Dumbbell, Heart, BookOpen, Target,
  Check, Wind, Footprints, Sparkles, Route
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { DailyCheckin, HabitDefinition, HabitLog, WorkShift } from '../../lib/supabase';
import { todayISO, formatDateLong, getTodayPhrase, getGreeting, SHIFT_LABELS, SHIFT_COLORS } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { QuickWeightModal } from './QuickWeightModal';
import { QuickWaterModal } from './QuickWaterModal';
import { QuickMoodModal } from './QuickMoodModal';
import { QuickActivityModal } from './QuickActivityModal';
import { QuickMealModal } from './QuickMealModal';

const today = todayISO();

const HABIT_ICONS: Record<string, LucideIcon> = {
  droplets: Droplets,
  wind: Wind,
  footprints: Footprints,
  utensils: Utensils,
  check: Check,
};

export function OggiPage() {
  const { profile, isDemo, user, demoData, showToast, setActiveTab, dataVersion } = useApp();
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [habits, setHabits] = useState<HabitDefinition[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [shift, setShift] = useState<WorkShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'weight' | 'water' | 'mood' | 'activity' | 'meal' | 'priority' | null>(null);
  const [priorityText, setPriorityText] = useState('');

  useEffect(() => {
    loadData();
  }, [isDemo, user, dataVersion]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setCheckin(demoData.checkin);
      setHabits(demoData.habits);
      setHabitLogs(demoData.habitLogs.filter(l => l.log_date === today));
      setShift(demoData.workShifts.find(s => s.date === today) ?? null);
    } else if (user) {
      const [checkinRes, habitsRes, logsRes, shiftRes] = await Promise.all([
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', today).maybeSingle(),
        supabase.from('habit_definitions').select('*').eq('user_id', user.id).eq('is_active', true).order('display_order'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('log_date', today),
        supabase.from('work_shifts').select('*').eq('user_id', user.id).eq('date', today).maybeSingle(),
      ]);
      setCheckin(checkinRes.data);
      setHabits(habitsRes.data ?? []);
      setHabitLogs(logsRes.data ?? []);
      setShift(shiftRes.data);
    }
    setLoading(false);
  };

  const toggleHabit = async (habit: HabitDefinition) => {
    const existing = habitLogs.find(l => l.habit_id === habit.id);
    const newCompleted = !existing?.completed;

    if (isDemo) {
      setHabitLogs(prev => {
        const filtered = prev.filter(l => l.habit_id !== habit.id);
        return [...filtered, {
          id: habit.id + '_log',
          user_id: 'demo',
          habit_id: habit.id,
          log_date: today,
          completed: newCompleted,
          notes: null,
          created_at: new Date().toISOString(),
        }];
      });
      return;
    }

    if (!user) return;
    const { data } = await supabase.from('habit_logs').upsert({
      user_id: user.id,
      habit_id: habit.id,
      log_date: today,
      completed: newCompleted,
    }, { onConflict: 'user_id,habit_id,log_date' }).select().maybeSingle();

    if (data) {
      setHabitLogs(prev => {
        const filtered = prev.filter(l => l.habit_id !== habit.id);
        return [...filtered, data];
      });
    }
    showToast(newCompleted ? `"${habit.name}" completata!` : `"${habit.name}" deselezionata`, 'success');
  };

  const savePriority = async () => {
    if (!priorityText.trim()) { setModal(null); return; }
    if (isDemo) {
      setCheckin(prev => prev ? { ...prev, top_priority: priorityText } : null);
      setModal(null);
      showToast('Priorità salvata!', 'success');
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('daily_checkins').upsert({
      user_id: user.id,
      checkin_date: today,
      top_priority: priorityText,
    }, { onConflict: 'user_id,checkin_date' }).select().maybeSingle();
    if (data) setCheckin(data);
    setModal(null);
    showToast('Priorità salvata!', 'success');
  };

  const completedHabits = habits.filter(h => habitLogs.find(l => l.habit_id === h.id && l.completed));
  const waterMl = checkin?.water_ml ?? 0;
  const waterPct = Math.min((waterMl / 2000) * 100, 100);

  const quickActions = [
    { id: 'weight', icon: Scale, label: 'Peso', color: 'bg-petrol-50 text-petrol-700' },
    { id: 'meal', icon: Utensils, label: 'Pasto', color: 'bg-amber-50 text-amber-700' },
    { id: 'water', icon: Droplets, label: 'Acqua', color: 'bg-blue-50 text-blue-700' },
    { id: 'activity', icon: Dumbbell, label: 'Attività', color: 'bg-green-50 text-green-700' },
    { id: 'mood', icon: Heart, label: 'Come sto', color: 'bg-rose-50 text-rose-700' },
    { id: 'diary', icon: BookOpen, label: 'Diario', color: 'bg-warm-gray-50 text-warm-gray-700' },
    { id: 'dharma', icon: Sparkles, label: 'Dharma', color: 'bg-amber-50 text-amber-800' },
    { id: 'cammino', icon: Route, label: 'Mio Cammino', color: 'bg-orange-50 text-orange-800' },
  ] as const;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse h-24 bg-warm-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="card bg-gradient-to-br from-sage-600 to-petrol-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{getGreeting(profile?.display_name ?? null)}</h1>
            <p className="text-sage-200 text-sm mt-0.5 capitalize">{formatDateLong(today)}</p>
          </div>
          {shift && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white`}>
              {shift.custom_label || SHIFT_LABELS[shift.shift_type]}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-sage-100 italic leading-relaxed">"{getTodayPhrase()}"</p>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium">
          Modalità demo — i dati non vengono salvati permanentemente
        </div>
      )}

      {/* Daily state, immediately after the greeting */}
      <button onClick={() => setModal('mood')} className="card w-full text-left">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-warm-gray-800">Come mi sento oggi</h2>
          <span className="text-xs font-medium text-sage-600">{checkin?.mood_score ? 'Modifica' : 'Compila'}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Umore', value: checkin?.mood_score, color: 'text-rose-500' },
            { label: 'Energia', value: checkin?.energy_score, color: 'text-amber-500' },
            { label: 'Motivazione', value: checkin?.motivation_score, color: 'text-sage-500' },
            { label: 'Stress', value: checkin?.stress_score ? 6 - checkin.stress_score : null, color: 'text-petrol-500' },
          ].map(item => (
            <div key={item.label} className="bg-warm-gray-50 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${item.color}`}>{item.value ?? '—'}</div>
              <div className="text-xs text-warm-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </button>

      {/* Priority Card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-sage-600" />
          <h2 className="font-semibold text-warm-gray-800">La cosa più importante oggi</h2>
        </div>
        {checkin?.top_priority ? (
          <div className="flex items-start gap-3">
            <div className="flex-1 bg-sage-50 rounded-xl p-3">
              <p className="text-warm-gray-800 font-medium">{checkin.top_priority}</p>
            </div>
            <button
              onClick={() => { setPriorityText(checkin.top_priority ?? ''); setModal('priority'); }}
              className="text-sage-600 text-sm font-medium hover:underline"
            >
              Modifica
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setPriorityText(''); setModal('priority'); }}
            className="w-full text-left border-2 border-dashed border-warm-gray-200 rounded-xl p-3 text-warm-gray-400 hover:border-sage-300 hover:text-sage-600 transition-colors text-sm"
          >
            + Aggiungi la tua priorità di oggi...
          </button>
        )}
      </div>

      {/* Contemplative quick card */}
      <div className="card bg-gradient-to-br from-sage-50 to-petrol-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-sage-600" />
          <h2 className="font-semibold text-warm-gray-800 text-sm">Come stai in questo momento?</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'emergency1', label: 'Pausa 1 min', sub: 'Scarico rapido' },
            { key: 'emergency2', label: 'Ritorno al cuore', sub: '2 min' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setActiveTab('dharma')}
              className="bg-white/70 hover:bg-white text-left rounded-xl px-3 py-2.5 transition-all active:scale-98 border border-sage-100"
            >
              <p className="text-xs font-semibold text-warm-gray-800">{p.label}</p>
              <p className="text-xs text-warm-gray-400">{p.sub}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setActiveTab('dharma')}
          className="mt-2 w-full text-xs text-sage-600 hover:text-sage-800 font-medium text-center py-1"
        >
          Apri Ritrova il Centro →
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title mb-3 px-1">Azioni rapide</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ id, icon: Icon, label, color }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'diary') setActiveTab('diario');
                else if (id === 'dharma') setActiveTab('dharma');
                else if (id === 'cammino') setActiveTab('cammino');
                else setModal(id as typeof modal);
              }}
              className={`${color} rounded-2xl p-5 min-h-24 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform`}
            >
              <Icon size={24} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setActiveTab('registro')}
        className="card w-full text-left bg-gradient-to-br from-white to-sage-50 border-sage-200"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-warm-gray-800">Tutte le registrazioni</p>
            <p className="text-sm text-warm-gray-500 mt-1">Controlla subito cosa Jarvis ha salvato e cosa manca.</p>
          </div>
          <span className="text-sage-700 text-xl">→</span>
        </div>
      </button>

      {/* Water Tracker */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-blue-500" />
            <h2 className="font-semibold text-warm-gray-800">Acqua</h2>
          </div>
          <span className="text-sm text-warm-gray-500">{waterMl} / 2000 ml</span>
        </div>
        <div className="w-full bg-warm-gray-100 rounded-full h-3 mb-3">
          <div
            className="bg-gradient-to-r from-blue-400 to-petrol-400 h-3 rounded-full transition-all"
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <div className="flex gap-2">
          {[150, 250, 500].map(ml => (
            <button
              key={ml}
              onClick={() => setModal('water')}
              className="flex-1 bg-blue-50 text-blue-700 text-sm font-medium py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              +{ml} ml
            </button>
          ))}
        </div>
      </div>

      {/* Habits */}
      {habits.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-warm-gray-800">Abitudini di oggi</h2>
            <span className="text-sm text-warm-gray-500">{completedHabits.length}/{habits.length}</span>
          </div>
          <div className="space-y-2">
            {habits.map(habit => {
              const log = habitLogs.find(l => l.habit_id === habit.id);
              const done = log?.completed ?? false;
              const IconComp = HABIT_ICONS[habit.icon] ?? Check;
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleHabit(habit)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-98 ${done ? 'bg-sage-50 border border-sage-200' : 'bg-warm-gray-50 hover:bg-warm-gray-100'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${done ? 'bg-sage-500 text-white' : 'bg-warm-gray-200 text-warm-gray-500'}`}>
                    {done ? <Check size={18} /> : <IconComp size={18} />}
                  </div>
                  <span className={`text-sm font-medium ${done ? 'text-sage-700 line-through' : 'text-warm-gray-700'}`}>
                    {habit.name}
                  </span>
                </button>
              );
            })}
          </div>
          {completedHabits.length === habits.length && habits.length > 0 && (
            <div className="mt-3 text-center text-sm text-sage-600 font-medium">
              Tutte le abitudini completate! Ottimo lavoro
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="px-1 pb-2">
        <p className="text-xs text-warm-gray-400 text-center leading-relaxed">
          Questa applicazione è uno strumento personale di organizzazione e monitoraggio. Non sostituisce le indicazioni dei professionisti sanitari.
        </p>
      </div>

      {/* Modals */}
      {modal === 'priority' && (
        <Modal isOpen title="La cosa più importante oggi" onClose={() => setModal(null)} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-warm-gray-500">Scegli una sola priorità realistica per oggi.</p>
            <textarea
              className="input-field h-24 resize-none"
              placeholder="Es. Bere almeno 2 litri d'acqua..."
              value={priorityText}
              onChange={e => setPriorityText(e.target.value)}
              autoFocus
            />
            <button onClick={savePriority} className="btn-primary w-full">Salva</button>
          </div>
        </Modal>
      )}

      {modal === 'weight' && <QuickWeightModal onClose={() => { setModal(null); loadData(); }} />}
      {modal === 'water' && <QuickWaterModal checkin={checkin} onClose={() => { setModal(null); loadData(); }} />}
      {modal === 'mood' && <QuickMoodModal checkin={checkin} onClose={() => { setModal(null); loadData(); }} />}
      {modal === 'activity' && <QuickActivityModal onClose={() => { setModal(null); loadData(); }} />}
      {modal === 'meal' && <QuickMealModal onClose={() => setModal(null)} />}
    </div>
  );
}
