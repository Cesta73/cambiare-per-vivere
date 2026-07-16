import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, Plus, Scale, Ruler, Activity, Bell, Flame, HeartPulse, Pill, Trash2, Utensils } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ComposedChart
} from 'recharts';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { BodyMeasurement, ActivityEntry, DailyCheckin, HungerSatietyEntry, MedicationLog } from '../../lib/supabase';
import { formatDateShort, formatDate, calculateBMI, dateToISO, MEAL_TYPE_LABELS, ACTIVITY_TYPE_LABELS } from '../../lib/utils';
import { QuickWeightModal } from '../oggi/QuickWeightModal';
import { ageOnDate, DEFAULT_SEDENTARY_PAL, estimateRestingEnergy } from '../../lib/energy';
import { useNutritionPlan } from '../../contexts/NutritionPlanContext';

type ProgressTab = 'misure' | 'nutrizione' | 'attivita' | 'abitudini';

const CHART_DAYS = 7;
const SUMMARY_DAYS = 14;

const recentDateKeys = (days: number) => Array.from({ length: days }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1 - index));
  return dateToISO(date);
});

export function ProgressiPage() {
  const { user, isDemo, profile, demoData, showToast, dataVersion } = useApp();
  const { plan } = useNutritionPlan();
  const [tab, setTab] = useState<ProgressTab>('misure');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [meals, setMeals] = useState<HungerSatietyEntry[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
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

  const deleteMeasurement = async (measurement: BodyMeasurement) => {
    if (!user || isDemo) return;
    const values = [
      measurement.weight_kg !== null ? `${measurement.weight_kg} kg` : null,
      measurement.waist_cm !== null ? `addome ${measurement.waist_cm} cm` : null,
      measurement.systolic_bp !== null && measurement.diastolic_bp !== null
        ? `pressione ${measurement.systolic_bp}/${measurement.diastolic_bp}`
        : null,
    ].filter(Boolean).join(' · ');
    if (!confirm(`Eliminare la misurazione del ${formatDate(measurement.measured_at)}${values ? ` (${values})` : ''}?`)) return;
    const { error } = await supabase.from('body_measurements').delete().eq('id', measurement.id).eq('user_id', user.id);
    if (error) {
      showToast(`Misurazione non eliminata: ${error.message}`, 'error');
      return;
    }
    showToast('Misurazione eliminata.', 'success');
    await loadData();
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
      const [measRes, actRes, checkinRes, mealRes, medicationRes] = await Promise.all([
        supabase.from('body_measurements').select('*').eq('user_id', user.id).order('measured_at'),
        supabase.from('activity_entries').select('*').eq('user_id', user.id).order('activity_date', { ascending: false }).limit(90),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).order('checkin_date').limit(30),
        supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id).order('entry_datetime', { ascending: false }).limit(300),
        supabase.from('medication_logs').select('*').eq('user_id', user.id).order('log_date').limit(300),
      ]);
      setMeasurements(measRes.data ?? []);
      setActivities(actRes.data ?? []);
      setCheckins(checkinRes.data ?? []);
      setMeals(mealRes.data ?? []);
      setMedicationLogs(medicationRes.data ?? []);
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

  const chartDates = recentDateKeys(CHART_DAYS);
  const summaryDates = recentDateKeys(SUMMARY_DAYS);
  const chartMeasurements = measurements.filter(m => chartDates.includes(dateToISO(new Date(m.measured_at))));

  const weightData = chartMeasurements
    .filter(m => m.weight_kg)
    .map(m => ({ date: formatDateShort(m.measured_at), kg: m.weight_kg, label: formatDate(m.measured_at) }));

  const circumferenceData = chartMeasurements
    .filter(m => m.waist_cm || m.neck_cm)
    .map(m => ({ date: formatDateShort(m.measured_at), addome: m.waist_cm, collo: m.neck_cm }));

  const bloodPressureData = chartMeasurements
    .filter(m => m.systolic_bp !== null && m.diastolic_bp !== null)
    .map(m => ({
      date: formatDateShort(m.measured_at),
      label: formatDate(m.measured_at),
      massima: m.systolic_bp,
      minima: m.diastolic_bp,
    }));

  const activityData = chartDates
    .map(date => ({
      date: formatDateShort(date),
      label: formatDate(date),
      min: activities.filter(activity => activity.activity_date === date).reduce((sum, activity) => sum + activity.duration_minutes, 0),
    }))
    .filter(day => day.min > 0);

  const activityByType = Object.entries(activities.reduce<Record<string, { minutes: number; sessions: number; calories: number }>>((acc, activity) => {
    acc[activity.activity_type] ??= { minutes: 0, sessions: 0, calories: 0 };
    acc[activity.activity_type].minutes += activity.duration_minutes;
    acc[activity.activity_type].sessions += 1;
    acc[activity.activity_type].calories += activity.calories_burned_kcal ?? 0;
    return acc;
  }, {})).sort(([, a], [, b]) => b.minutes - a.minutes);

  const calorieTarget = profile?.daily_calorie_target ?? 2200;
  const measuredBmr = [...measurements].reverse().find(item => item.basal_metabolism_kcal)?.basal_metabolism_kcal ?? null;
  const currentWeight = latestWeightMeas?.weight_kg ?? profile?.start_weight ?? null;
  const currentAge = ageOnDate(profile?.birth_date, profile?.birth_year);
  const calculatedBmr = estimateRestingEnergy(currentWeight, profile?.height_cm ?? null, currentAge, profile?.biological_sex ?? null);
  const basalMetabolism = measuredBmr ?? calculatedBmr;
  const baselineExpenditure = basalMetabolism ? Math.round(basalMetabolism * DEFAULT_SEDENTARY_PAL) : null;
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
  const calorieDailyData = Array.from({ length: CHART_DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (CHART_DAYS - 1 - index));
    const key = dateToISO(date);
    const values = calorieByDay.get(key) ?? { eaten: 0, burned: 0 };
    const consumed = baselineExpenditure ? baselineExpenditure + values.burned : 0;
    const balance = values.eaten > 0 && consumed > 0 ? values.eaten - consumed : null;
    return { date: formatDateShort(key), label: formatDate(key), obiettivo: calorieTarget, mangiate: values.eaten, rimanenti: Math.max(0, calorieTarget - values.eaten), attivita: values.burned, consumate: consumed, bilancio: balance };
  });
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

  const mealTypes = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'night_snack'] as const;
  const mealTrackingData = chartDates.map(date => {
    const dayMeals = meals.filter(meal => dateToISO(new Date(meal.entry_datetime)) === date);
    return {
      date: formatDateShort(date),
      label: formatDate(date),
      ...Object.fromEntries(mealTypes.map(type => [type, dayMeals.filter(meal => meal.meal_type === type).length])),
    };
  });
  const mealSensationData = chartDates.flatMap(date => {
    const dayMeals = meals.filter(meal => dateToISO(new Date(meal.entry_datetime)) === date);
    if (!dayMeals.length) return [];
    const average = (key: 'pre_hunger' | 'post_satiety' | 'post_satisfaction') => {
      const values = dayMeals.map(meal => meal[key]).filter((value): value is number => value !== null);
      return values.length ? +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1) : null;
    };
    return [{
      date: formatDateShort(date),
      label: formatDate(date),
      fame: average('pre_hunger'),
      sazieta: average('post_satiety'),
      soddisfazione: average('post_satisfaction'),
    }];
  });
  const medicationDailyData = chartDates.map(date => {
    const logs = medicationLogs.filter(log => log.log_date === date);
    return {
      date: formatDateShort(date),
      label: formatDate(date),
      assunte: logs.filter(log => log.taken).length,
      nonAssunte: logs.filter(log => !log.taken).length,
    };
  });
  const medicationTaken = medicationLogs.filter(log => summaryDates.includes(log.log_date) && log.taken).length;
  const medicationTracked = medicationLogs.filter(log => summaryDates.includes(log.log_date)).length;
  const medicationAdherence = medicationTracked ? Math.round(medicationTaken / medicationTracked * 100) : null;
  const trackedMeals = meals.filter(meal => summaryDates.includes(dateToISO(new Date(meal.entry_datetime))));
  const trackedMealDays = new Set(trackedMeals.map(meal => dateToISO(new Date(meal.entry_datetime)))).size;
  const completeMindfulMeals = trackedMeals.filter(meal => meal.pre_hunger !== null && meal.post_satiety !== null && meal.post_satisfaction !== null);
  const mindfulCompletion = trackedMeals.length ? Math.round(completeMindfulMeals.length / trackedMeals.length * 100) : null;
  const satisfactionValues = trackedMeals.map(meal => meal.post_satisfaction).filter((value): value is number => value !== null);
  const averageSatisfaction = satisfactionValues.length ? (satisfactionValues.reduce((sum, value) => sum + value, 0) / satisfactionValues.length).toFixed(1) : null;
  const checkinsByDate = new Map(checkins.map(checkin => [checkin.checkin_date, checkin]));
  const hydrationDays = summaryDates.filter(date => (checkinsByDate.get(date)?.water_ml ?? 0) >= 2000).length;
  const stepsDailyData = chartDates.map(date => {
    const steps = checkinsByDate.get(date)?.steps ?? null;
    return {
      date: formatDateShort(date),
      label: formatDate(date),
      passi: steps,
    };
  });
  const stepsValues = stepsDailyData
    .map(day => day.passi)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const todaySteps = checkinsByDate.get(todayKey)?.steps ?? null;
  const averageSteps = stepsValues.length
    ? Math.round(stepsValues.reduce((sum, value) => sum + value, 0) / stepsValues.length)
    : null;
  const bestStepsDay = stepsDailyData.reduce<{ label: string; passi: number } | null>((best, day) => {
    if (day.passi === null) return best;
    if (!best || day.passi > best.passi) return { label: day.label, passi: day.passi };
    return best;
  }, null);
  const formatSteps = (value: number | null | undefined) =>
    value === null || value === undefined ? '—' : new Intl.NumberFormat('it-IT').format(value);

  const dynamicDomain = (values: Array<number | null | undefined>): [number, number] => {
    const finite = values.filter((value): value is number => Number.isFinite(value));
    if (!finite.length) return [0, 1];
    return [Math.floor(Math.min(...finite) - 1), Math.ceil(Math.max(...finite) + 1)];
  };
  const circumferenceDomain = dynamicDomain(circumferenceData.flatMap(item => [item.addome, item.collo]));
  const pressureDomain = dynamicDomain(bloodPressureData.flatMap(item => [item.massima, item.minima]));
  const chartCheckins = checkins.filter(item => chartDates.includes(item.checkin_date));
  const moodDomain = dynamicDomain(chartCheckins.flatMap(item => [item.mood_score, item.energy_score, item.motivation_score, item.stress_score]));
  const sensationDomain = dynamicDomain(mealSensationData.flatMap(item => [item.fame, item.sazieta, item.soddisfazione]));

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
      <div className="page-intro flex items-center justify-between gap-3">
        <div><p className="eyebrow text-sage-700">Segnali nel tempo</p><h1 className="section-title mt-1">Progressi</h1><p>Osserva tendenze, non singoli numeri.</p></div>
        <button onClick={() => setAddWeightModal(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1">
          <Plus size={16} /> Misura
        </button>
      </div>
      <button onClick={scheduleWeeklyMeasurement} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
        <Bell size={16} /> Promemoria settimanale per peso e misure
      </button>

      {/* Tabs */}
      <div className="segmented-control flex gap-1 bg-warm-gray-100 rounded-xl p-1">
        {([
          { id: 'misure', label: 'Misure' },
          { id: 'nutrizione', label: 'Nutrizione' },
          { id: 'attivita', label: 'Attività' },
          { id: 'abitudini', label: 'Benessere' },
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

          {measurements.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-3">Ultime misurazioni</h2>
              <div className="operational-list">
                {[...measurements].reverse().slice(0, 7).map(measurement => (
                  <div key={measurement.id} className="operational-row flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-warm-gray-800">{formatDate(measurement.measured_at)}</p>
                      <p className="text-xs text-warm-gray-500 mt-1">
                        {[
                          measurement.weight_kg !== null ? `${measurement.weight_kg} kg` : null,
                          measurement.waist_cm !== null ? `addome ${measurement.waist_cm} cm` : null,
                          measurement.neck_cm !== null ? `collo ${measurement.neck_cm} cm` : null,
                          measurement.systolic_bp !== null && measurement.diastolic_bp !== null ? `${measurement.systolic_bp}/${measurement.diastolic_bp} mmHg` : null,
                        ].filter(Boolean).join(' · ') || 'Altri parametri corporei'}
                      </p>
                    </div>
                    {!isDemo && (
                      <button
                        onClick={() => deleteMeasurement(measurement)}
                        className="p-2 text-rose-500 hover:bg-rose-50 transition-colors"
                        aria-label={`Elimina misurazione del ${formatDate(measurement.measured_at)}`}
                        title="Elimina misurazione"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                ))}
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
                  <YAxis domain={circumferenceDomain} tick={{ fontSize: 11, fill: '#8d877a' }} unit=" cm" />
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
                    <YAxis domain={pressureDomain} tick={{ fontSize: 11, fill: '#8d877a' }} />
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

      {tab === 'nutrizione' && (
        <div className="space-y-4">
          <div className="card border-sage-200 bg-sage-50">
            <p className="eyebrow text-sage-700">Piano ufficiale</p>
            <h2 className="font-semibold text-sage-900 mt-1">Continuità e segnali alimentari</h2>
            <p className="text-sm text-sage-800 mt-1">Le stime caloriche restano informative. La lettura principale segue il piano, la qualità della registrazione e le sensazioni.</p>
            {plan && <p className="text-xs text-sage-700 mt-3">Piano attivo dal {formatDate(plan.plan.issued_on)} · {plan.plan.author}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3"><p className="text-xs text-warm-gray-500">Pasti completi</p><p className="text-xl font-bold text-sage-700 mt-1">{mindfulCompletion !== null ? `${mindfulCompletion}%` : '—'}</p><p className="text-[11px] text-warm-gray-500 mt-1">fame, sazietà e soddisfazione</p></div>
            <div className="card p-3"><p className="text-xs text-warm-gray-500">Soddisfazione</p><p className="text-xl font-bold text-amber-700 mt-1">{averageSatisfaction ?? '—'}</p><p className="text-[11px] text-warm-gray-500 mt-1">media su 10</p></div>
            <div className="card p-3"><p className="text-xs text-warm-gray-500">Idratazione</p><p className="text-xl font-bold text-petrol-700 mt-1">{hydrationDays}/14</p><p className="text-[11px] text-warm-gray-500 mt-1">giorni da almeno 2 L</p></div>
          </div>
          <div className="card bg-gradient-to-br from-amber-50 to-sage-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={20} className="text-amber-600" />
              <h2 className="font-semibold text-warm-gray-800">Stima energetica secondaria</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div><p className="text-xs text-warm-gray-500">Obiettivo</p><p className="font-bold text-petrol-700">{todayCalories.obiettivo}</p></div>
              <div><p className="text-xs text-warm-gray-500">Assunte</p><p className="font-bold text-amber-700">{todayCalories.mangiate}</p></div>
              <div><p className="text-xs text-warm-gray-500">Rimanenti al target</p><p className="font-bold text-amber-700">{todayCalories.rimanenti}</p></div>
              <div><p className="text-xs text-warm-gray-500">Consumate stimate</p><p className="font-bold text-sage-700">{todayCalories.consumate || '—'}</p></div>
            </div>
            <div className="mt-3 rounded-xl bg-white/70 p-3 flex items-center justify-between gap-3">
              <span className="text-xs text-warm-gray-600">Deficit/surplus stimato finora</span>
              <strong className={todayCalories.bilancio === null ? 'text-warm-gray-500' : todayCalories.bilancio <= 0 ? 'text-sage-700' : 'text-rose-600'}>{todayCalories.bilancio === null ? 'dati alimentari insufficienti' : `${todayCalories.bilancio > 0 ? '+' : ''}${todayCalories.bilancio} kcal`}</strong>
            </div>
            <p className="text-xs text-warm-gray-500 mt-3">Basale: {basalMetabolism ?? '—'} kcal ({measuredBmr ? 'misurato' : 'Mifflin–St Jeor'}). Base quotidiana: {baselineExpenditure ?? '—'} kcal con PAL {DEFAULT_SEDENTARY_PAL}; attività nette aggiunte separatamente. Stime non mediche.</p>
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
            <h2 className="font-semibold text-warm-gray-800 mb-4">Calorie assunte e consumate</h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={calorieDailyData} margin={{ left: -15, right: 5, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d877a' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8d877a' }} unit=" kcal" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="mangiate" name="Assunte" fill="#d4a853" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="consumate" name="Consumate stimate" stroke="#236874" strokeWidth={3} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="rounded-xl bg-amber-50 p-2"><p className="text-[10px] text-warm-gray-500">Assunte</p><p className="font-bold text-amber-700">{todayCalories.mangiate}</p></div>
              <div className="rounded-xl bg-petrol-50 p-2"><p className="text-[10px] text-warm-gray-500">Consumate</p><p className="font-bold text-petrol-700">{todayCalories.consumate}</p></div>
              <div className={`rounded-xl p-2 ${todayCalories.bilancio !== null && todayCalories.bilancio <= 0 ? 'bg-sage-50' : 'bg-rose-50'}`}><p className="text-[10px] text-warm-gray-500">Bilancio</p><p className="font-bold text-warm-gray-800">{todayCalories.bilancio === null ? '—' : `${todayCalories.bilancio > 0 ? '+' : ''}${todayCalories.bilancio}`}</p></div>
            </div>
            <p className="text-[11px] text-warm-gray-400 mt-3">Consumate = basale × PAL sedentario + calorie nette delle attività registrate. Il bilancio resta provvisorio finché la giornata alimentare non è completa.</p>
          </div>
        </div>
      )}

      {tab === 'attivita' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-semibold text-warm-gray-800">Passi giornalieri</h2>
                <p className="text-xs text-warm-gray-500">Dati automatici da Connessione Salute / Google Fit quando sincronizzati.</p>
              </div>
              <div className="rounded-2xl bg-sage-50 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wide text-warm-gray-500">Oggi</p>
                <p className="text-xl font-bold text-sage-700">{formatSteps(todaySteps)}</p>
              </div>
            </div>

            {stepsValues.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl bg-warm-gray-50 p-3">
                    <p className="text-xs text-warm-gray-500">Media ultimi giorni</p>
                    <p className="text-lg font-bold text-petrol-700">{formatSteps(averageSteps)}</p>
                  </div>
                  <div className="rounded-xl bg-warm-gray-50 p-3">
                    <p className="text-xs text-warm-gray-500">Miglior giorno</p>
                    <p className="text-lg font-bold text-amber-700">{formatSteps(bestStepsDay?.passi)}</p>
                    {bestStepsDay && <p className="text-[11px] text-warm-gray-500">{bestStepsDay.label}</p>}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stepsDailyData} margin={{ left: -5, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d877a' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#8d877a' }} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="passi" name="Passi" fill="#236874" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-warm-gray-400 mt-3">
                  I passi mostrano movimento quotidiano automatico; le attività sotto restano le sessioni registrate a parte.
                </p>
              </>
            ) : (
              <div className="rounded-xl bg-warm-gray-50 p-4 text-sm text-warm-gray-500">
                Non vedo ancora passi sincronizzati nello storico. Appena il bridge Health Connect invia dati, comparirà qui l’andamento giornaliero.
              </div>
            )}
          </div>

          {activityByType.length > 0 && <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Attività per tipo</h2>
            <div className="grid sm:grid-cols-2 gap-2">{activityByType.map(([type, totals]) => <div key={type} className="rounded-xl bg-warm-gray-50 p-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-warm-gray-800">{ACTIVITY_TYPE_LABELS[type] ?? type}</p><p className="text-xs text-warm-gray-500">{totals.sessions} sessioni · {totals.calories ? `~${totals.calories} kcal` : 'calorie non disponibili'}</p></div><p className="text-xl font-bold text-sage-700">{totals.minutes}<span className="text-xs font-medium ml-1">min</span></p></div>)}</div>
          </div>}
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
            <h2 className="font-semibold text-warm-gray-800 mb-3">Umore, energia, motivazione e stress</h2>
            {chartCheckins.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartCheckins.map(c => ({
                  date: formatDateShort(c.checkin_date),
                  umore: c.mood_score,
                  energia: c.energy_score,
                  motivazione: c.motivation_score,
                  stress: c.stress_score,
                }))} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <YAxis domain={moodDomain} tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="umore" name="Umore" stroke="#e07b7b" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="energia" name="Energia" stroke="#d4a853" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="motivazione" name="Motivazione" stroke="#5B8B76" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="#236874" strokeWidth={2} dot={{ r: 2 }} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-warm-gray-400 text-center py-6">Registra il tuo stato ogni giorno per vedere i grafici.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Utensils size={17} className="text-amber-600" />
                <span className="text-xs text-warm-gray-500">Pasti tracciati</span>
              </div>
              <p className="text-2xl font-bold text-warm-gray-900">{trackedMeals.length}</p>
              <p className="text-xs text-warm-gray-500">in {trackedMealDays} giorni su 14</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <Pill size={17} className="text-sage-600" />
                <span className="text-xs text-warm-gray-500">Terapia registrata</span>
              </div>
              <p className="text-2xl font-bold text-warm-gray-900">{medicationAdherence !== null ? `${medicationAdherence}%` : '—'}</p>
              <p className="text-xs text-warm-gray-500">{medicationTracked} assunzioni verificate</p>
            </div>
          </div>

          {trackedMeals.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-1">Pasti registrati</h2>
              <p className="text-xs text-warm-gray-500 mb-4">La costanza conta più della perfezione.</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mealTrackingData} margin={{ left: -28, right: 4, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#8d877a' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="breakfast" name={MEAL_TYPE_LABELS.breakfast} stackId="meals" fill="#d4a853" />
                  <Bar dataKey="morning_snack" name={MEAL_TYPE_LABELS.morning_snack} stackId="meals" fill="#e6c879" />
                  <Bar dataKey="lunch" name={MEAL_TYPE_LABELS.lunch} stackId="meals" fill="#5B8B76" />
                  <Bar dataKey="afternoon_snack" name={MEAL_TYPE_LABELS.afternoon_snack} stackId="meals" fill="#8fb7a5" />
                  <Bar dataKey="dinner" name={MEAL_TYPE_LABELS.dinner} stackId="meals" fill="#236874" />
                  <Bar dataKey="night_snack" name={MEAL_TYPE_LABELS.night_snack} stackId="meals" fill="#6d8290" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-warm-gray-500">
                {mealTypes.map(type => <span key={type}>{MEAL_TYPE_LABELS[type]}</span>)}
              </div>
            </div>
          )}

          {mealSensationData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-1">Fame, sazietà e soddisfazione</h2>
              <p className="text-xs text-warm-gray-500 mb-4">Media giornaliera dei pasti registrati, scala 0–10.</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mealSensationData} margin={{ left: -18, right: 8, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#8d877a' }} />
                  <YAxis domain={sensationDomain} tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="fame" name="Fame prima" stroke="#d95f76" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="sazieta" name="Sazietà dopo" stroke="#236874" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="soddisfazione" name="Soddisfazione" stroke="#d4a853" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {medicationTracked > 0 && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-1">Terapia e integratori</h2>
              <p className="text-xs text-warm-gray-500 mb-4">Solo assunzioni esplicitamente registrate.</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={medicationDailyData} margin={{ left: -28, right: 4, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e3e0db" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#8d877a' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#8d877a' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="assunte" name="Assunte" stackId="therapy" fill="#5B8B76" />
                  <Bar dataKey="nonAssunte" name="Non assunte" stackId="therapy" fill="#d95f76" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

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
