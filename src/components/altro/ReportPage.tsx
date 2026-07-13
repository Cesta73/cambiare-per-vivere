import { useState } from 'react';
import { ArrowLeft, Download, Printer, CheckSquare, Square, Copy, Apple, Stethoscope, Brain } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { formatDate, ACTIVITY_TYPE_LABELS, MEAL_TYPE_LABELS } from '../../lib/utils';
import { useNutritionPlan } from '../../contexts/NutritionPlanContext';

interface Props { onBack: () => void; }

type ReportSection = 'measurements' | 'pressure' | 'activity' | 'sleep' | 'medications' | 'mood' | 'meals';
type Audience = 'nutritionist' | 'doctor' | 'psychologist';

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const escapeCsvCell = (value: unknown) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

export function ReportPage({ onBack }: Props) {
  const { user, isDemo, profile, demoData, showToast } = useApp();
  const { plan } = useNutritionPlan();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [audience, setAudience] = useState<Audience>('nutritionist');
  const [sections, setSections] = useState<Set<ReportSection>>(new Set(['measurements', 'pressure', 'activity', 'sleep', 'medications', 'mood', 'meals']));
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const toggleSection = (s: ReportSection) => {
    setSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const chooseAudience = (next: Audience) => {
    setAudience(next);
    const start = new Date();
    start.setDate(start.getDate() - (next === 'nutritionist' ? 7 : next === 'psychologist' ? 10 : 30));
    setDateFrom(start.toISOString().split('T')[0]);
    setSections(new Set(next === 'nutritionist'
      ? ['measurements', 'meals']
      : next === 'doctor'
        ? ['measurements', 'pressure', 'medications']
        : ['mood', 'activity']));
    setReportData(null);
  };

  const generateReport = async () => {
    setLoading(true);
    const data: any = {
      profile: { name: profile?.display_name, start_date: profile?.start_date, start_weight: profile?.start_weight },
      period: { from: dateFrom, to: dateTo },
      generated_at: new Date().toISOString(),
      questions: questions || null,
      audience,
      nutritionPlan: plan ? { id: plan.plan.id, issued_on: plan.plan.issued_on, author: plan.plan.author } : null,
    };

    if (isDemo) {
      if (sections.has('measurements') || sections.has('pressure')) {
        data.measurements = demoData.measurements.filter(m => m.measured_at >= dateFrom && m.measured_at <= dateTo);
      }
      if (sections.has('activity')) {
        data.activities = demoData.activities.filter(a => a.activity_date >= dateFrom && a.activity_date <= dateTo);
      }
    } else if (user) {
      if (sections.has('measurements') || sections.has('pressure')) {
        const { data: measData } = await supabase.from('body_measurements').select('*').eq('user_id', user.id).gte('measured_at', dateFrom).lte('measured_at', dateTo).order('measured_at');
        data.measurements = measData ?? [];
      }
      if (sections.has('activity')) {
        const { data: actData } = await supabase.from('activity_entries').select('*').eq('user_id', user.id).gte('activity_date', dateFrom).lte('activity_date', dateTo).order('activity_date');
        data.activities = actData ?? [];
      }
      if (sections.has('sleep')) {
        const { data: sleepData } = await supabase.from('sleep_entries').select('*').eq('user_id', user.id).gte('sleep_date', dateFrom).lte('sleep_date', dateTo).order('sleep_date');
        data.sleep = sleepData ?? [];
      }
      if (sections.has('medications')) {
        const [{ data: medData }, { data: remindersData }] = await Promise.all([
          supabase.from('medication_logs').select('*').eq('user_id', user.id).gte('log_date', dateFrom).lte('log_date', dateTo).order('log_date'),
          supabase.from('medication_reminders').select('*').eq('user_id', user.id),
        ]);
        data.medications = medData ?? [];
        data.medicationReminders = remindersData ?? [];
      }
      if (sections.has('mood')) {
        const { data: moodData } = await supabase.from('daily_checkins').select('*').eq('user_id', user.id).gte('checkin_date', dateFrom).lte('checkin_date', dateTo).order('checkin_date');
        data.mood = moodData ?? [];
      }
      if (sections.has('meals')) {
        const fromTimestamp = `${dateFrom}T00:00:00`;
        const toTimestamp = `${dateTo}T23:59:59`;
        const { data: mealData } = await supabase.from('hunger_satiety_entries').select('*').eq('user_id', user.id).gte('entry_datetime', fromTimestamp).lte('entry_datetime', toTimestamp).order('entry_datetime');
        data.meals = mealData ?? [];
        const { data: hydrationData } = await supabase.from('hydration_entries').select('*').eq('user_id', user.id).gte('entry_date', dateFrom).lte('entry_date', dateTo).order('entry_date');
        data.hydration = hydrationData ?? [];
      }
      if (audience === 'psychologist') {
        const [{ data: journalData }, { data: practiceData }] = await Promise.all([
          supabase.from('journal_entries').select('*').eq('user_id', user.id).gte('entry_date', dateFrom).lte('entry_date', dateTo).order('entry_date', { ascending: false }).limit(10),
          supabase.from('contemplative_sessions').select('*').eq('user_id', user.id).gte('started_at', `${dateFrom}T00:00:00`).lte('started_at', `${dateTo}T23:59:59`).eq('completed', true).order('started_at'),
        ]);
        data.journal = journalData ?? [];
        data.practices = practiceData ?? [];
      }
    }

    setReportData(data);
    setLoading(false);
    showToast('Report generato!', 'success');
  };

  const printReport = () => {
    if (!reportData) return;
    const lines: string[] = [
      `CAMBIARE PER VIVERE — REPORT PERSONALE`,
      ``,
      `Nome: ${reportData.profile?.name ?? '—'}`,
      `Periodo: ${formatDate(reportData.period.from)} – ${formatDate(reportData.period.to)}`,
      `Generato il: ${new Date(reportData.generated_at).toLocaleDateString('it-IT')}`,
      reportData.nutritionPlan ? `Piano alimentare di riferimento: ${reportData.nutritionPlan.author}, ${formatDate(reportData.nutritionPlan.issued_on)}` : '',
      ``,
      `NOTA: Questi dati sono stati generati dall'applicazione personale "Cambiare per Vivere".`,
      `Sono dati di auto-monitoraggio e non costituiscono documentazione clinica.`,
      ``,
    ];

    if (sections.has('measurements') && reportData.measurements?.some((m: any) => m.weight_kg !== null || m.waist_cm !== null || m.neck_cm !== null)) {
      lines.push('MISURAZIONI CORPOREE');
      reportData.measurements.filter((m: any) => m.weight_kg !== null || m.waist_cm !== null || m.neck_cm !== null).forEach((m: any) => {
        lines.push(`${formatDate(m.measured_at)}: Peso ${m.weight_kg ?? '—'} kg, Addome ${m.waist_cm ?? '—'} cm, Collo ${m.neck_cm ?? '—'} cm${m.notes ? ` — ${m.notes}` : ''}`);
      });
      lines.push('');
    }

    if (sections.has('pressure') && reportData.measurements?.some((m: any) => m.systolic_bp !== null && m.diastolic_bp !== null)) {
      lines.push('PRESSIONE ARTERIOSA');
      reportData.measurements.filter((m: any) => m.systolic_bp !== null && m.diastolic_bp !== null).forEach((m: any) => {
        lines.push(`${formatDate(m.measured_at)}: ${m.systolic_bp}/${m.diastolic_bp} mmHg${m.notes ? ` — ${m.notes}` : ''}`);
      });
      lines.push('');
    }

    if (reportData.activities?.length) {
      lines.push('ATTIVITÀ FISICA');
      reportData.activities.forEach((a: any) => {
        lines.push(`${formatDate(a.activity_date)}: ${a.activity_name ?? ACTIVITY_TYPE_LABELS[a.activity_type]} — ${a.duration_minutes} min${a.perceived_effort ? `, sforzo ${a.perceived_effort}/10` : ''}${a.pain_or_difficulty ? ` — ${a.pain_or_difficulty}` : ''}`);
      });
      lines.push('');
    }

    if (reportData.mood?.length) {
      lines.push('UMORE, ENERGIA, MOTIVAZIONE E STRESS');
      reportData.mood.forEach((c: any) => {
        const stress = c.stress_score !== null ? 6 - c.stress_score : '—';
        lines.push(`${formatDate(c.checkin_date)}: Umore ${c.mood_score ?? '—'}/5, Energia ${c.energy_score ?? '—'}/5, Motivazione ${c.motivation_score ?? '—'}/5, Stress ${stress}/5`);
      });
      lines.push('');
    }

    if (reportData.sleep?.length) {
      lines.push('SONNO');
      reportData.sleep.forEach((s: any) => {
        lines.push(`${formatDate(s.sleep_date)}: ${s.duration_hours ?? '—'} ore, qualità ${s.quality ?? '—'}/5${s.notes ? ` — ${s.notes}` : ''}`);
      });
      lines.push('');
    }

    if (reportData.medications?.length) {
      lines.push('TERAPIA, INTEGRATORI E ALTRE ASSUNZIONI');
      reportData.medications.forEach((m: any) => {
        const reminder = reportData.medicationReminders?.find((r: any) => r.id === m.reminder_id);
        const category = reminder?.category === 'supplement' ? 'Integratore' : reminder?.category === 'medication' ? 'Farmaco' : 'Altro';
        lines.push(`${formatDate(m.log_date)}${m.log_time ? ` ore ${m.log_time.slice(0, 5)}` : ''}: ${m.reminder_name} (${category}) — ${m.taken ? 'PRESO' : 'NON PRESO'}${m.notes ? ` — ${m.notes}` : ''}`);
      });
      lines.push('');
    }

    if (reportData.meals?.length) {
      lines.push('PASTI, FAME, SAZIETÀ E SODDISFAZIONE');
      reportData.meals.forEach((m: any) => {
        const mealDate = new Date(m.entry_datetime);
        const date = mealDate.toLocaleDateString('it-IT');
        const time = mealDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        lines.push(`${date} ore ${time}: ${MEAL_TYPE_LABELS[m.meal_type] ?? m.meal_type ?? 'Pasto'}${m.meal_name ? ` — ${m.meal_name}` : ''}; fame prima ${m.pre_hunger ?? '—'}/10, sazietà ${m.post_satiety ?? '—'}/10, soddisfazione ${m.post_satisfaction ?? '—'}/10`);
      });
      lines.push('');
    }

    if (reportData.hydration?.length) {
      lines.push('IDRATAZIONE');
      const totals = reportData.hydration.reduce((acc: Record<string, number>, item: any) => ({ ...acc, [item.entry_date]: (acc[item.entry_date] ?? 0) + item.amount_ml }), {});
      Object.entries(totals).forEach(([date, ml]) => lines.push(`${formatDate(date)}: ${ml} ml`));
      lines.push('');
    }

    if (reportData.journal?.length) {
      lines.push('DIARIO — ULTIMI GIORNI');
      reportData.journal.forEach((entry: any) => lines.push(`${formatDate(entry.entry_date)}: mattino ${entry.feeling_today ?? '—'}; vittoria ${entry.small_victory ?? '—'}; difficoltà ${entry.main_difficulty ?? '—'}; intenzione ${entry.tomorrow_intention ?? '—'}`));
      lines.push('');
    }

    if (reportData.practices?.length) {
      lines.push('MEDITAZIONE E PRATICHE');
      reportData.practices.forEach((item: any) => lines.push(`${new Date(item.started_at).toLocaleDateString('it-IT')}: ${item.practice_name}, ${Math.round((item.actual_duration_sec ?? 0) / 60)} min`));
      lines.push('');
    }

    if (reportData.questions) {
      lines.push('DOMANDE PER I PROFESSIONISTI');
      lines.push(reportData.questions);
      lines.push('');
    }

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(`<pre style="font-family:sans-serif;padding:2rem;max-width:700px;line-height:1.6;">${escapeHtml(lines.join('\n'))}</pre>`);
      w.document.close();
      w.print();
    }
  };

  const exportCSV = () => {
    if (!reportData) return;
    const rows: string[][] = [[
      'Data', 'Tipo', 'Dettaglio', 'Peso (kg)', 'Addome (cm)', 'Collo (cm)',
      'Pressione massima', 'Pressione minima', 'Durata attività (min)',
      'Umore', 'Energia', 'Motivazione', 'Stress', 'Preso', 'Fame prima',
      'Sazietà dopo', 'Soddisfazione',
    ]];

    const allDates = new Set([
      ...(reportData.measurements?.map((m: any) => m.measured_at) ?? []),
      ...(reportData.activities?.map((a: any) => a.activity_date) ?? []),
      ...(reportData.mood?.map((c: any) => c.checkin_date) ?? []),
      ...(reportData.sleep?.map((s: any) => s.sleep_date) ?? []),
      ...(reportData.medications?.map((m: any) => m.log_date) ?? []),
      ...(reportData.meals?.map((m: any) => new Date(m.entry_datetime).toISOString().split('T')[0]) ?? []),
    ]);

    Array.from(allDates).sort().forEach(date => {
      const meas = reportData.measurements?.find((m: any) => m.measured_at === date);
      const act = reportData.activities?.filter((a: any) => a.activity_date === date);
      const mood = reportData.mood?.find((c: any) => c.checkin_date === date);
      const totalActMin = act?.reduce((s: number, a: any) => s + a.duration_minutes, 0) ?? '';
      const meds = reportData.medications?.filter((m: any) => m.log_date === date) ?? [];
      const dayMeals = reportData.meals?.filter((m: any) => new Date(m.entry_datetime).toISOString().split('T')[0] === date) ?? [];
      const stress = mood?.stress_score !== null && mood?.stress_score !== undefined ? 6 - mood.stress_score : '';
      rows.push([
        formatDate(date),
        'giornata',
        '',
        meas?.weight_kg ?? '',
        meas?.waist_cm ?? '',
        meas?.neck_cm ?? '',
        meas?.systolic_bp ?? '',
        meas?.diastolic_bp ?? '',
        totalActMin,
        mood?.mood_score ?? '',
        mood?.energy_score ?? '',
        mood?.motivation_score ?? '',
        stress,
        '',
        '',
        '',
        '',
      ]);
      meds.forEach((med: any) => rows.push([
        formatDate(date), 'terapia/integratore', med.reminder_name, '', '', '', '', '', '', '', '', '', '', med.taken ? 'Sì' : 'No', '', '', '',
      ]));
      dayMeals.forEach((meal: any) => rows.push([
        formatDate(date), MEAL_TYPE_LABELS[meal.meal_type] ?? meal.meal_type ?? 'pasto', meal.meal_name ?? '', '', '', '', '', '', '', '', '', '', '', '',
        meal.pre_hunger ?? '', meal.post_satiety ?? '', meal.post_satisfaction ?? '',
      ]));
    });

    const csv = rows.map(r => r.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpv-report-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV esportato!', 'success');
  };

  const copySummary = async () => {
    if (!reportData) return;
    const label = audience === 'nutritionist' ? 'Nutrizionista' : audience === 'doctor' ? 'Medico specialista' : 'Psicologa';
    const hydration = reportData.hydration?.reduce((sum: number, item: any) => sum + item.amount_ml, 0) ?? 0;
    const completeMeals = reportData.meals?.filter((item: any) => item.pre_hunger !== null && item.post_satiety !== null && item.post_satisfaction !== null).length ?? 0;
    const text = [
      `CAMBIARE PER VIVERE — REPORT ${label.toUpperCase()}`,
      `Periodo: ${formatDate(reportData.period.from)} – ${formatDate(reportData.period.to)}`,
      reportData.nutritionPlan ? `Piano di riferimento: ${reportData.nutritionPlan.author}, ${formatDate(reportData.nutritionPlan.issued_on)}` : '',
      reportData.meals ? `Pasti: ${reportData.meals.length}; registrazioni complete: ${completeMeals}; acqua: ${hydration} ml` : '',
      reportData.measurements ? `Misurazioni: ${reportData.measurements.length}` : '',
      reportData.medicationReminders ? `Terapie previste: ${reportData.medicationReminders.filter((item: any) => item.is_active).map((item: any) => `${item.name}${item.dosage_text ? ` (${item.dosage_text})` : ''}`).join(', ') || '—'}` : '',
      reportData.mood ? `Check-in emotivi: ${reportData.mood.length}` : '',
      reportData.journal ? `Voci di diario: ${reportData.journal.length}; pratiche: ${reportData.practices?.length ?? 0}` : '',
      'Dati auto-riferiti e stime non mediche.',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(text);
    showToast('Report copiato negli appunti.', 'success');
  };

  const SECTION_OPTIONS: { id: ReportSection; label: string }[] = [
    { id: 'measurements', label: 'Peso e circonferenze' },
    { id: 'pressure', label: 'Pressione arteriosa' },
    { id: 'activity', label: 'Attività fisica' },
    { id: 'sleep', label: 'Sonno' },
    { id: 'medications', label: 'Terapia, integratori e altre assunzioni' },
    { id: 'mood', label: 'Umore, energia, motivazione e stress' },
    { id: 'meals', label: 'Pasti, fame, sazietà e soddisfazione' },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Report per i professionisti</h1>
      </div>

      <div className="card bg-petrol-50 border-petrol-200">
        <p className="text-sm text-petrol-700">Genera un report dei tuoi dati da condividere col tuo team sanitario. Scegli tu cosa includere.</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([
          { id: 'nutritionist', label: 'Nutrizionista', Icon: Apple },
          { id: 'doctor', label: 'Medico', Icon: Stethoscope },
          { id: 'psychologist', label: 'Psicologa', Icon: Brain },
        ] as const).map(item => <button key={item.id} onClick={() => chooseAudience(item.id)} className={`rounded-2xl border p-3 text-center ${audience === item.id ? 'bg-petrol-900 text-white border-petrol-900' : 'bg-white text-warm-gray-600 border-warm-gray-100'}`}><item.Icon size={20} className="mx-auto mb-1" /><span className="text-[11px] font-semibold">{item.label}</span></button>)}
      </div>

      {/* Date range */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-gray-800">Periodo</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Dal</label>
            <input type="date" className="input-field" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Al</label>
            <input type="date" className="input-field" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-gray-800">Dati da includere</h2>
        {SECTION_OPTIONS.map(s => (
          <button key={s.id} onClick={() => toggleSection(s.id)}
            className="w-full flex items-center gap-3 py-1 text-left">
            {sections.has(s.id)
              ? <CheckSquare size={20} className="text-sage-600 flex-shrink-0" />
              : <Square size={20} className="text-warm-gray-300 flex-shrink-0" />}
            <span className="text-sm text-warm-gray-700">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-2">Domande per i professionisti</h2>
        <textarea
          className="input-field h-24 resize-none text-sm"
          placeholder="Es. Ho notato più fame nei giorni di turno notturno. Cosa mi consigliate?"
          value={questions}
          onChange={e => setQuestions(e.target.value)}
        />
      </div>

      <button onClick={generateReport} disabled={loading} className="btn-primary w-full">
        {loading ? 'Generazione...' : 'Genera report'}
      </button>

      {/* Preview + Export */}
      {reportData && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-warm-gray-800">Anteprima report</h2>

          <div className="bg-warm-gray-50 rounded-xl p-4 text-sm space-y-2">
            <p><strong>Periodo:</strong> {formatDate(reportData.period.from)} – {formatDate(reportData.period.to)}</p>
            {reportData.measurements?.length > 0 && (
              <p><strong>Misurazioni:</strong> {reportData.measurements.length} registrazioni</p>
            )}
            {reportData.activities?.length > 0 && (
              <p><strong>Attività:</strong> {reportData.activities.length} sessioni, {reportData.activities.reduce((s: number, a: any) => s + a.duration_minutes, 0)} min totali</p>
            )}
            {reportData.mood?.length > 0 && (
              <p><strong>Check-in:</strong> {reportData.mood.length} giornate tracciate</p>
            )}
            {reportData.medications?.length > 0 && (
              <p><strong>Terapia e integratori:</strong> {reportData.medications.filter((m: any) => m.taken).length} presi, {reportData.medications.filter((m: any) => !m.taken).length} non presi</p>
            )}
            {reportData.meals?.length > 0 && (
              <p><strong>Pasti:</strong> {reportData.meals.length} registrazioni con fame, sazietà e soddisfazione</p>
            )}
            {reportData.questions && (
              <div>
                <p className="font-semibold">Domande:</p>
                <p className="text-warm-gray-600">{reportData.questions}</p>
              </div>
            )}
          </div>

          <p className="text-xs text-warm-gray-400">
            Nota: questi dati sono auto-riferiti. Non costituiscono documentazione clinica.
          </p>

          <div className="flex gap-3">
            <button onClick={copySummary} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm">
              <Copy size={16} /> Copia
            </button>
            <button onClick={printReport} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm">
              <Printer size={16} /> Stampa
            </button>
            <button onClick={exportCSV} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm">
              <Download size={16} /> CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
