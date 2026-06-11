import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Repeat, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { PRACTICE_TEMPLATES } from '../../lib/contemplative-data';

interface Props { onBack: () => void; }

interface SessionRow {
  id: string;
  practice_key: string;
  practice_name: string;
  mode: string;
  actual_duration_sec: number | null;
  planned_duration_sec: number;
  completed: boolean;
  started_at: string;
}

interface CheckinRow {
  session_id: string;
  phase: 'before' | 'after';
  state_label: string;
  stress_score: number | null;
  energy_score: number | null;
  helpful: string | null;
  what_noticed: string | null;
}

const STATE_LABELS_BEFORE: Record<string, string> = {
  calmo: 'Calmo/a', stanco: 'Stanco/a', agitato: 'Agitato/a',
  pesante: 'Pesante', triste: 'Triste', sopraffatto: 'Sopraffatto/a', presente: 'Presente',
};
const STATE_LABELS_AFTER: Record<string, string> = {
  leggero: 'Leggero/a', centrato: 'Centrato/a', calmo: 'Calmo/a', presente: 'Presente', invariato: 'Come prima',
};

export function ReflectionsPage({ onBack }: Props) {
  const { user, isDemo } = useApp();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, isDemo]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      // demo data: a couple of hardcoded sessions
      const now = Date.now();
      setSessions([
        { id: 's1', practice_key: 'emergency1', practice_name: 'Scarico rapido', mode: 'secular', actual_duration_sec: 62, planned_duration_sec: 60, completed: true, started_at: new Date(now - 86400000).toISOString() },
        { id: 's2', practice_key: 'morningFull', practice_name: 'Risveglio del mattino', mode: 'spiritual', actual_duration_sec: 280, planned_duration_sec: 300, completed: false, started_at: new Date(now - 172800000).toISOString() },
        { id: 's3', practice_key: 'eveningFull', practice_name: 'Serenità serale', mode: 'spiritual', actual_duration_sec: 600, planned_duration_sec: 600, completed: true, started_at: new Date(now - 259200000).toISOString() },
      ]);
      setCheckins([
        { session_id: 's1', phase: 'before', state_label: 'agitato', stress_score: 7, energy_score: 4, helpful: null, what_noticed: null },
        { session_id: 's1', phase: 'after', state_label: 'calmo', stress_score: 4, energy_score: 5, helpful: 'sì', what_noticed: 'Ho notato la respirazione rallentare.' },
        { session_id: 's3', phase: 'before', state_label: 'stanco', stress_score: 5, energy_score: 3, helpful: null, what_noticed: null },
        { session_id: 's3', phase: 'after', state_label: 'leggero', stress_score: 3, energy_score: 4, helpful: 'sì', what_noticed: null },
      ]);
      setLoading(false);
      return;
    }
    if (!user) { setLoading(false); return; }
    const [{ data: sessData }, { data: chkData }] = await Promise.all([
      supabase.from('contemplative_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(100),
      supabase.from('contemplative_checkins').select('*').eq('user_id', user.id).limit(200),
    ]);
    setSessions((sessData ?? []) as SessionRow[]);
    setCheckins((chkData ?? []) as CheckinRow[]);
    setLoading(false);
  };

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.actual_duration_sec ?? 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  // Most practiced
  const practiceCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.practice_key] = (acc[s.practice_key] ?? 0) + 1;
    return acc;
  }, {});
  const topPractice = Object.entries(practiceCounts).sort((a, b) => b[1] - a[1])[0];
  const topTemplate = topPractice ? PRACTICE_TEMPLATES.find(p => p.key === topPractice[0]) : null;

  // Checkin pairs
  const afterCheckins = checkins.filter(c => c.phase === 'after');
  const helpfulCount = afterCheckins.filter(c => c.helpful === 'sì').length;
  const helpfulPct = afterCheckins.length > 0 ? Math.round((helpfulCount / afterCheckins.length) * 100) : null;

  // State frequency after
  const afterStateCounts = afterCheckins.reduce<Record<string, number>>((acc, c) => {
    if (c.state_label) acc[c.state_label] = (acc[c.state_label] ?? 0) + 1;
    return acc;
  }, {});
  const topAfterState = Object.entries(afterStateCounts).sort((a, b) => b[1] - a[1])[0];

  // Stress avg before/after
  const beforeCheckins = checkins.filter(c => c.phase === 'before' && c.stress_score != null);
  const afterCheckinStress = checkins.filter(c => c.phase === 'after' && c.stress_score != null);
  const avgStressBefore = beforeCheckins.length > 0 ? (beforeCheckins.reduce((a, c) => a + (c.stress_score ?? 0), 0) / beforeCheckins.length).toFixed(1) : null;
  const avgStressAfter = afterCheckinStress.length > 0 ? (afterCheckinStress.reduce((a, c) => a + (c.stress_score ?? 0), 0) / afterCheckinStress.length).toFixed(1) : null;

  // Last 7 sessions (by day)
  const last7 = sessions.slice(0, 7);

  if (loading) return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100"><ArrowLeft size={20} /></button>
        <h1 className="section-title flex-1">Riflessioni</h1>
      </div>
      <div className="card text-center text-warm-gray-400 py-8">Caricamento...</div>
    </div>
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Riflessioni</h1>
      </div>

      {/* Cautious language notice */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 text-xs text-sage-700 leading-relaxed">
        Queste informazioni descrivono le tue sessioni. Non indicano efficacia clinica né sostituiscono il supporto di professionisti sanitari.
      </div>

      {totalSessions === 0 ? (
        <div className="card text-center py-10">
          <p className="text-warm-gray-400 text-sm">Nessuna sessione registrata ancora.</p>
          <p className="text-warm-gray-300 text-xs mt-1">Completa la tua prima pratica per vedere le riflessioni.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card text-center py-4">
              <Repeat size={18} className="text-sage-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-warm-gray-800">{totalSessions}</p>
              <p className="text-xs text-warm-gray-400">sessioni</p>
            </div>
            <div className="card text-center py-4">
              <Clock size={18} className="text-petrol-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-warm-gray-800">{totalMinutes}</p>
              <p className="text-xs text-warm-gray-400">minuti totali</p>
            </div>
            <div className="card text-center py-4">
              <Heart size={18} className="text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-warm-gray-800">{completedSessions}</p>
              <p className="text-xs text-warm-gray-400">completate</p>
            </div>
          </div>

          {/* Patterns */}
          <div className="card space-y-3">
            <h2 className="font-semibold text-warm-gray-800">Osservazioni</h2>

            {topTemplate && (
              <div className="flex justify-between items-center py-2 border-b border-warm-gray-100">
                <span className="text-sm text-warm-gray-600">Pratica più usata</span>
                <span className="text-sm font-semibold text-warm-gray-800">{topTemplate.name} ({topPractice![1]}×)</span>
              </div>
            )}

            {helpfulPct !== null && (
              <div className="flex justify-between items-center py-2 border-b border-warm-gray-100">
                <span className="text-sm text-warm-gray-600">Ti è sembrata utile</span>
                <span className="text-sm font-semibold text-sage-700">{helpfulPct}% delle volte</span>
              </div>
            )}

            {topAfterState && (
              <div className="flex justify-between items-center py-2 border-b border-warm-gray-100">
                <span className="text-sm text-warm-gray-600">Stato più frequente dopo</span>
                <span className="text-sm font-semibold text-warm-gray-800">
                  {STATE_LABELS_AFTER[topAfterState[0]] ?? topAfterState[0]}
                </span>
              </div>
            )}

            {avgStressBefore !== null && avgStressAfter !== null && (
              <div className="py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-warm-gray-600">Tensione media dichiarata</span>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 text-center bg-warm-gray-50 rounded-xl py-2">
                    <p className="text-xs text-warm-gray-400">Prima</p>
                    <p className="text-lg font-bold text-warm-gray-700">{avgStressBefore}</p>
                  </div>
                  <span className="text-warm-gray-300 text-lg">→</span>
                  <div className="flex-1 text-center bg-sage-50 rounded-xl py-2">
                    <p className="text-xs text-warm-gray-400">Dopo</p>
                    <p className="text-lg font-bold text-sage-700">{avgStressAfter}</p>
                  </div>
                </div>
                <p className="text-xs text-warm-gray-400 mt-2 italic text-center">
                  Valori auto-riportati — non hanno valore diagnostico
                </p>
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="card">
            <h2 className="font-semibold text-warm-gray-800 mb-3">Sessioni recenti</h2>
            <div className="space-y-2">
              {last7.map(s => {
                const dateStr = new Date(s.started_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
                const mins = s.actual_duration_sec ? Math.round(s.actual_duration_sec / 60) : null;
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 border-b border-warm-gray-50 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.completed ? 'bg-sage-500' : 'bg-warm-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-warm-gray-800 truncate">{s.practice_name}</p>
                      <p className="text-xs text-warm-gray-400">{dateStr}{mins != null ? ` · ${mins} min` : ''}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.completed ? 'bg-sage-100 text-sage-700' : 'bg-warm-gray-100 text-warm-gray-500'}`}>
                      {s.completed ? 'Completata' : 'Parziale'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Noted observations from checkins */}
          {afterCheckins.some(c => c.what_noticed) && (
            <div className="card">
              <h2 className="font-semibold text-warm-gray-800 mb-3">Cosa hai notato</h2>
              <div className="space-y-2">
                {afterCheckins.filter(c => c.what_noticed).slice(0, 5).map((c, i) => (
                  <div key={i} className="bg-warm-gray-50 rounded-xl px-3 py-2">
                    <p className="text-sm text-warm-gray-700 italic">"{c.what_noticed}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
