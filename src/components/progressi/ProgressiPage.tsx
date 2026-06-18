import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, Plus, Scale, Ruler, Activity, Bell, Flame, HeartPulse } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { BodyMeasurement, ActivityEntry, HydrationEntry, SleepEntry, DailyCheckin, HungerSatietyEntry } from '../../lib/supabase';
import { formatDateShort, formatDate, calculateBMI, getWeekStart, dateToISO } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { QuickWeightModal } from '../oggi/QuickWeightModal';

type ProgressTab = 'misure' | 'calorie' | 'attivita' | 'abitudini';

export function ProgressiPage() {
  const { user, isDemo, profile, demoData, showToast, dataVersion } = useApp();
  const [tab, setTab] = useState<ProgressTab>('misure');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [meals, setMeals] = useState<HungerSatietyEntry[]>([]);
  const [caloriePeriod, setCaloriePeriod] = useState<'days' | 'weeks'>('days');
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
  }, [isDemo, user, dataVersion]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      setMeasurements(demoData.measurements);
      setActivities(demoData.activities);
      setCheckins([]);
    } else if (user) {
      const [measRes, actRes, checkinRes, mealRes] = await Promise.all([
        supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_at'),
        supabase.from('activity_entries').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(90),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('checkin_date').limit(30),
        supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id).order('entry_datetime', { ascending: false }).limit(300),
      ]);
      setMeasurements(measRes.data ?? []);
      setActivities(actRes.data ?? []);
      setCheckins(checkinRes.data ?? []);
      setMeals(mealRes.data ?? []);
    }
    setLoading(false);
  };

  const latestWeightMeas = [...measurements].reverse().find(m => m.weight_kg !== null) ?? null;
  const latestWaistMeas = [...measurements].reverse().find(m => m.waist_cm !== null) ?? null;
  const latestBloodPressure = [...measurements].reverse().find(m => m.systolic_bp !== null && m.diastolic_bp !== null) ?? null;
  const firstMeas = measurements[0] ?? { weight_kg: profile?.start_weight, waist_cm: profile?.start_waist, neck_cm: profile?.start_neck, measured_at: profile?.start_date };

  const weightChange = latestWeightMeas?.weight_kg && firstMeas?.weight_kg
    ? +(latestWeightMeas.weight_kg - firstMeas.weight_kg).toFixed(1)
    : null;

  const bmi = latestWeightMeas?.weight_kg && profile?.height_cm
    ? calculateBMI(latestWeightMeas.weight_kg, profile.height_cm)
    : null;

  const weightData = measurements
    .filter(m => m.weight_kg)
    .map(m => ({ date: formatDateShort(m.measured_at), kg: m.weight_kg, label: formatDate(m.measured_at) }));

  const circumferenceData = measurements
    .filter(m => m.waist_cm || m.neck_cm)
    .map(m => ({ date: formatDateShort(m.measured_at), addome: m.waist_cm, collo: m.neck_cm }));

  const bloodPressureData = measurements
    .filter(m => m.systolic_bp !== null && m.diastolic_bp !== null)
    .map(m => ({
      date: formatDateShort(m.measured_at),
      label: formatDate(m.measured_at),
      massima: m.systolic_bp,
      minima: m.diastolic_bp,
    }));

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

  const calorieTarget = profile?.daily_calorie_target ?? 2200;
  const calorieByDay = new Map<string, { eaten: number; burned: number }>();
  meals.forEach(meal => {
    const date = dateToISO(new Date(meal.entry_datetime));
    const current = calorieByDay.get(date) ?? { eaten: 0, burned: 0 };
    current.eaten += meal.calories_kcal ?? 0;
    calorieByDay.set(date, current);
  });
  activities.forEach(activity => {
    const current = calorieByDay.get(activity.activity_date) ?? { eaten: 0, burned: 0 };
    current.burned += activity.calories_burned_kcal ?? 0;
    calorieByDay.set(activity.activity_date, current);
  });
  const calorieDailyData = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = dateToISO(date);
    const values = calorieByDay.get(key) ?? { eaten: 0, burned: 0 };
    return { date: formatDateShort(key), label: formatDate(key), obiettivo: calorieTarget, mangiate: values.eaten, bruciate: values.burned };
  });
  const calorieWeeklyMap = calorieDailyData.reduce<Record<string, { obiettivo: number; mangiate: number; bruciate: number }>>((acc, day) => {
    const parts = day.label.split('/');
    const date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const key = dateToISO(getWeekStart(date));
    acc[key] ??= { obiettivo: 0, mangiate: 0, bruciate: 0 };
    acc[key].obiettivo += day.obiettivo;
    acc[key].mangiate += day.mangiate;
    acc[key].bruciate += day.bruciate;
    return acc;
  }, {});
  const calorieWeeklyData = Object.entries(calorieWeeklyMap).map(([date, values]) => ({ date: formatDateShort(date), ...values }));
  const calorieChartData = caloriePeriod === 'days' ? calorieDailyData : calorieWeeklyData;
  const todayCalories = calorieDailyData[calorieDailyData.length - 1];
  const todayKey = dateToISO(new Date());
  const todayMacros = meals
    .filter(meal => dateToISO(new Date(meal.entry_datetime)) === todayKey)
    .reduce((total, meal) => ({
      protein: total.protein + (meal.protein_g ?? 0),
      carbs: total.carbs + (meal.carbs_g ?? 0),
      fat: total.fat + (meal.fat_g ?? 0),
      fiber: total.fiber + (meal.fiber_g ?? 0),
    }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

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
          { id: 'calorie', label: 'Calorie' },
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
                <p className="text-2xl font-bold text-warm-gray-900">{latestWeightMeas?.weight_kg ?? '—'} <span className="text-sm font-normal text-warm-gray-500">kg</span></p>
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
              <p className="text-2xl font-bold text-warm-gray-900">{latestWaistMeas?.waist_cm ?? '—'} <span className="text-sm font-normal text-warm-gray-500">cm</span></p>
              {latestWaistMeas?.waist_cm && firstMeas?.waist_cm && (
                <p className={`text-sm font-medium mt-1 ${latestWaistMeas.waist_cm < firstMeas.waist_cm ? 'text-sage-600' : 'text-warm-gray-500'}`}>
                  {(latestWaistMeas.waist_cm - firstMeas.waist_cm).toFixed(1)} cm totali
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse size={17} className="text-rose-500" />
              <span className="text-xs text-warm-gray-500 font-medium">Ultima pressione</span>
            </div>
            <p className="text-2xl font-bold text-warm-gray-900">
              {latestBloodPressure ? `${latestBloodPressure.systolic_bp}/${latestBloodPressure.diastolic_bp}` : '—'}
              <span className="text-sm font-normal text-warm-gray-500"> mmHg</span>
            </p>
            {latestBloodPressure && <p className="text-xs text-warm-gray-500 mt-1">{formatDate(latestBloodPressure.measured_at)}</p>}
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
                {latestWeightMeas?.weight_kg && (
                  <div className="flex justify-between border-t border-warm-gray-100 pt-2 mt-2">
                    <span className="text-warm-gray-500">Oggi</span>
                    <span className="font-bold text-petrol-700">{latestWeightMeas.weight_kg} kg (−{(profile.start_weight - latestWeightMeas.weight_kg).toFixed(1)} kg)</span>
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

          {bloodPressureData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-4">Andamento pressione</h2>
              {bloodPressureData.length >= 2 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={bloodPressureData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8d877a' }} />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 11, fill: '#8d877a' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="massima" name="Massima" stroke="#d95f76" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="minima" name="Minima" stroke="#236874" strokeWidth={2} dot={{ r: 3 }} />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-warm-gray-600">Prima misurazione: {bloodPressureData[0].massima}/{bloodPressureData[0].minima} mmHg.</p>
              )}
              <p className="text-xs text-warm-gray-500 mt-3">Lo storico serve a osservare l'andamento; l'interpretazione clinica spetta al medico.</p>
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

      {tab === 'calorie' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-amber-50 to-sage-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={20} className="text-amber-600" />
              <h2 className="font-semibold text-warm-gray-800">Bilancio indicativo di oggi</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><p className="text-xs text-warm-gray-500">Obiettivo</p><p className="font-bold text-petrol-700">{todayCalories.obiettivo}</p></div>
              <div><p className="text-xs text-warm-gray-500">Mangiate</p><p className="font-bold text-amber-700">{todayCalories.mangiate}</p></div>
              <div><p className="text-xs text-warm-gray-500">Bruciate</p><p className="font-bold text-sage-700">{todayCalories.bruciate}</p></div>
            </div>
            <p className="text-xs text-warm-gray-500 mt-3">Calorie e attività sono stime informative, non prescrizioni mediche.</p>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-warm-gray-100 rounded-xl p-1">
            <button onClick={() => setCaloriePeriod('days')} className={`py-2 rounded-lg text-sm font-semibold ${caloriePeriod === 'days' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>Giorni</button>
            <button onClick={() => setCaloriePeriod('weeks')} className={`py-2 rounded-lg text-sm font-semibold ${caloriePeriod === 'weeks' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>Settimane</button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Macronutrienti di oggi</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-sage-50 rounded-xl p-2"><p className="text-xs text-warm-gray-500">Proteine</p><p className="font-bold text-sage-700">{todayMacros.protein.toFixed(1)}g</p></div>
              <div className="bg-amber-50 rounded-xl p-2"><p className="text-xs text-warm-gray-500">Carboidrati</p><p className="font-bold text-amber-700">{todayMacros.carbs.toFixed(1)}g</p></div>
              <div className="bg-petrol-50 rounded-xl p-2"><p className="text-xs text-warm-gray-500">Grassi</p><p className="font-bold text-petrol-700">{todayMacros.fat.toFixed(1)}g</p></div>
              <div className="bg-warm-gray-100 rounded-xl p-2"><p className="text-xs text-warm-gray-500">Fibre</p><p className="font-bold text-warm-gray-700">{todayMacros.fiber.toFixed(1)}g</p></div>
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-4">Obiettivo, mangiate e bruciate</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={calorieChartData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d877a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8d877a' }} unit=" kcal" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="obiettivo" name="Obiettivo" fill="#236874" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mangiate" name="Mangiate" fill="#d4a853" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bruciate" name="Bruciate" fill="#5B8B76" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                    {a.calories_burned_kcal && (
                      <span className="text-xs text-sage-700 bg-sage-50 px-2 py-1 rounded-lg">~{a.calories_burned_kcal} kcal</span>
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
