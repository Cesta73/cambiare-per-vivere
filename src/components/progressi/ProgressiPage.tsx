import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, Plus, Scale, Ruler, Droplets, Activity, Moon, Bell } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { BodyMeasurement, ActivityEntry, HydrationEntry, SleepEntry, DailyCheckin } from '../../lib/supabase';
import { formatDateShort, formatDate, calculateBMI, getWeekStart, dateToISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { QuickWeightModal } from '../oggi/QuickWeightModal';

type ProgressTab = 'misure' | 'attivita' | 'abitudini';

export function ProgressiPage() {
  const { user, isDemo, profile, demoData, showToast } = useApp();
  const [tab, setTab] = useState<ProgressTab>('misure');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [addWeightModal, setAddWeightModal] = useState(false);

  const scheduleWeeklyMeasurement = async () => {
    if (!user) return;
    const next = new Date();
    next.setDate(next.getDate() + ((7 - next.getDay()) % 7 || 7));
    next.setHours(8, 0, 0, 0);
    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      title: 'Pesata e misure settimanali',
      entity_type: 'measurement',
      remind_at: next.toISOString(),
      repeat_rule: 'weekly',
    });
    showToast(error ? `Promemoria non salvato: ${error.message}` : 'Promemoria settimanale impostato per domenica alle 08:00.', error ? 'error' : 'success');
  };

  useEffect(() => {
    loadData();
  }, [isDemo, user]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setMeasurements(demoData.measurements);
      setActivities(demoData.activities);
      setCheckins([]);
    } else if (user) {
      const [measRes, actRes, checkinRes] = await Promise.all([
        supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_at'),
        supabase.from('activity_entries').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(90),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('checkin_date').limit(30),
      ]);
      setMeasurements(measRes.data ?? []);
      setActivities(actRes.data ?? []);
      setCheckins(checkinRes.data ?? []);
    }
    setLoading(false);
  };

  const latestMeas = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const firstMeas = measurements[0] ?? { weight_kg: profile?.start_weight, waist_cm: profile?.start_waist, neck_cm: profile?.start_neck, measured_at: profile?.start_date };

  const weightChange = latestMeas?.weight_kg && firstMeas?.weight_kg
    ? +(latestMeas.weight_kg - firstMeas.weight_kg).toFixed(1)
    : null;

  const bmi = latestMeas?.weight_kg && profile?.height_cm
    ? calculateBMI(latestMeas.weight_kg, profile.height_cm)
    : null;

  const weightData = measurements
    .filter(m => m.weight_kg)
    .map(m => ({ date: formatDateShort(m.measured_at), kg: m.weight_kg, label: formatDate(m.measured_at) }));

  const circumferenceData = measurements
    .filter(m => m.waist_cm || m.neck_cm)
    .map(m => ({ date: formatDateShort(m.measured_at), addome: m.waist_cm, collo: m.neck_cm }));

  const activityByWeek = activities.reduce<Record<string, number>>((acc, a) => {
    const d = new Date(a.activity_date + 'T12:00:00');
    const weekKey = dateToISO(getWeekStart(d));
    acc[weekKey] = (acc[weekKey] ?? 0) + a.duration_minutes;
    return acc;
  }, {});
  const activityData = Object.entries(activityByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([date, min]) => ({ date: formatDateShort(date), min }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-warm-gray-200 rounded-xl p-3 shadow-lg text-sm">
          <p className="font-semibold text-warm-gray-700 mb-1">{payload[0]?.payload?.label ?? label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-32 bg-warm-gray-100" />)}</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Progressi</h1>
        <button onClick={() => setAddWeightModal(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
          <Plus size={16} /> Misura
        </button>
      </div>
      <button onClick={scheduleWeeklyMeasurement} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
        <Bell size={16} /> Promemoria settimanale per peso e misure
      </button>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-gray-100 rounded-xl p-1">
        {([
          { id: 'misure', label: 'Misure' },
          { id: 'attivita', label: 'Attività' },
          { id: 'abitudini', label: 'Costanza' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'misure' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {!profile?.hide_weight_dashboard && (
              <div className="card">
                <div className="flex items-center gap-2 mb-1">
                  <Scale size={16} className="text-petrol-500" />
                  <span className="text-xs text-warm-gray-500 font-medium">Peso attuale</span>
                </div>
                <p className="text-2xl font-bold text-warm-gray-900">{latestMeas?.weight_kg ?? '—'} <span className="text-sm font-normal text-warm-gray-500">kg</span></p>
                {weightChange !== null && (
                  <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${weightChange < 0 ? 'text-sage-600' : weightChange > 0 ? 'text-amber-600' : 'text-warm-gray-500'}`}>
                    {weightChange < 0 ? <TrendingDown size={14} /> : weightChange > 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
                    {weightChange > 0 ? '+' : ''}{weightChange} kg totali
                  </div>
                )}
              </div>
            )}
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <Ruler size={16} className="text-sage-500" />
                <span className="text-xs text-warm-gray-500 font-medium">Addome</span>
              </div>
              <p className="text-2xl font-bold text-warm-gray-900">{latestMeas?.waist_cm ?? '—'} <span className="text-sm font-normal text-warm-gray-500">cm</span></p>
              {latestMeas?.waist_cm && firstMeas?.waist_cm && (
                <p className={`text-sm font-medium mt-1 ${latestMeas.waist_cm < firstMeas.waist_cm ? 'text-sage-600' : 'text-warm-gray-500'}`}>
                  {(latestMeas.waist_cm - firstMeas.waist_cm).toFixed(1)} cm totali
                </p>
              )}
            </div>
          </div>

          {/* BMI info (informativo) */}
          {bmi && !profile?.hide_bmi && (
            <div className="card bg-warm-gray-50 border-warm-gray-200">
              <p className="text-sm text-warm-gray-700">
                <span className="font-semibold">BMI calcolato: {bmi}</span> — Questo è un dato puramente indicativo.
                Discuti sempre il tuo peso e il tuo stato di salute con il tuo medico.
              </p>
            </div>
          )}

          {/* From start summary */}
          {(profile?.start_weight || profile?.start_waist) && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-3">Dall'inizio del percorso</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-warm-gray-500">Peso iniziale (17/09/2024)</span>
                  <span className="font-semibold text-warm-gray-800">{profile.start_weight} kg</span>
                </div>
                {profile.discharge_weight && (
                  <div className="flex justify-between">
                    <span className="text-warm-gray-500">Alla dimissione</span>
                    <span className="font-semibold text-sage-700">{profile.discharge_weight} kg (−{(profile.start_weight - profile.discharge_weight).toFixed(1)} kg)</span>
                  </div>
                )}
                {latestMeas?.weight_kg && (
                  <div className="flex justify-between border-t border-warm-gray-100 pt-2 mt-2">
                    <span className="text-warm-gray-500">Oggi</span>
                    <span className="font-bold text-petrol-700">{latestMeas.weight_kg} kg (−{(profile.start_weight - latestMeas.weight_kg).toFixed(1)} kg)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Weight chart */}
          {weightData.length >= 2 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-4">Andamento peso</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8d877a' }} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: '#8d877a' }} unit=" kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="kg" name="Peso (kg)" stroke="#4a7363" strokeWidth={2.5} dot={{ r: 4, fill: '#4a7363' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Circumference chart */}
          {circumferenceData.length >= 2 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-4">Circonferenze</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={circumferenceData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8d877a' }} />
                  <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 11, fill: '#8d877a' }} unit=" cm" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="addome" name="Addome (cm)" stroke="#236874" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="collo" name="Collo (cm)" stroke="#74aa95" strokeWidth={2} dot={{ r: 3 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {measurements.length === 0 && (
            <div className="text-center py-10 text-warm-gray-400">
              <Scale size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessuna misurazione ancora</p>
              <p className="text-sm mt-1">Registra la tua prima misurazione!</p>
              <button onClick={() => setAddWeightModal(true)} className="btn-primary mt-4 text-sm">Aggiungi misurazione</button>
            </div>
          )}
        </div>
      )}

      {tab === 'attivita' && (
        <div className="space-y-4">
          {activityData.length >= 2 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-4">Minuti di attività</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8d877a' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8d877a' }} unit=" min" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="min" name="Minuti" fill="#5B8B76" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activities.length > 0 ? (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-3">Ultime attività</h2>
              <div className="space-y-3">
                {activities.slice(0, 10).map(a => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Activity size={18} className="text-sage-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-warm-gray-800 text-sm">{a.activity_name ?? a.activity_type}</p>
                      <p className="text-xs text-warm-gray-500">{formatDate(a.activity_date)} · {a.duration_minutes} min</p>
                    </div>
                    {a.perceived_effort && (
                      <span className="text-xs text-warm-gray-500 bg-warm-gray-100 px-2 py-1 rounded-lg">Sforzo: {a.perceived_effort}/10</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-warm-gray-400">
              <Activity size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessuna attività registrata</p>
              <p className="text-sm mt-1">Registra le tue attività dalla sezione Oggi!</p>
            </div>
          )}

          <div className="card bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              Segui sempre le indicazioni ricevute dai tuoi professionisti sanitari, soprattutto in presenza di dolori articolari o limitazioni fisiche.
            </p>
          </div>
        </div>
      )}

      {tab === 'abitudini' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Costanza delle abitudini</h2>
            {checkins.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={checkins.map(c => ({
                  date: formatDateShort(c.checkin_date),
                  umore: c.mood_score,
                  energia: c.energy_score,
                  motivazione: c.motivation_score,
                }))} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="umore" name="Umore" stroke="#e07b7b" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="energia" name="Energia" stroke="#d4a853" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="motivazione" name="Motivazione" stroke="#5B8B76" strokeWidth={2} dot={{ r: 2 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-warm-gray-400 text-center py-6">Registra il tuo stato ogni giorno per vedere i grafici.</p>
            )}
          </div>

          {isDemo && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-3">Abitudini (demo)</h2>
              <div className="space-y-2">
                {demoData.habits.map(h => {
                  const logs = demoData.habitLogs.filter(l => l.habit_id === h.id && l.completed);
                  return (
                    <div key={h.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-sage-100 rounded-lg flex items-center justify-center">
                        <Activity size={14} className="text-sage-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-warm-gray-800">{h.name}</p>
                      </div>
                      <span className="text-xs text-sage-600 font-medium">{logs.length} giorni</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {addWeightModal && <QuickWeightModal onClose={() => { setAddWeightModal(false); loadData(); }} />}
    </div>
  );
}
