import { useState, useEffect } from 'react';
import { BookOpen, Plus, Heart, Search, Sunrise, Moon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import type { JournalEntry, DailyCheckin, PersonalGoal } from '../../lib/supabase';
import { todayISO, formatDateLong } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';

type DiaryTab = 'oggi' | 'storico' | 'ragioni';
type DayPhase = 'mattino' | 'sera';

const JOURNAL_QUESTIONS = [
  { key: 'feeling_today', label: 'Come mi sento oggi?', placeholder: 'Descrivi il tuo stato d\'animo...' },
  { key: 'small_victory', label: 'Qual è stata la mia piccola vittoria?', placeholder: 'Anche la cosa più piccola conta...' },
  { key: 'main_difficulty', label: 'Qual è stata la difficoltà principale?', placeholder: 'Cosa è stato difficile oggi...' },
  { key: 'what_helped', label: 'Cosa mi ha aiutato?', placeholder: 'Cosa ha reso la giornata più gestibile...' },
  { key: 'tomorrow_intention', label: 'Cosa desidero fare diversamente domani?', placeholder: 'Un piccolo cambiamento per domani...' },
  { key: 'current_need', label: 'Di cosa ho bisogno in questo momento?', placeholder: 'Riposo, connessione, movimento...' },
] as const;

type JournalKey = typeof JOURNAL_QUESTIONS[number]['key'];

const MORNING_QUESTIONS = JOURNAL_QUESTIONS.filter(q =>
  ['feeling_today', 'current_need', 'tomorrow_intention'].includes(q.key)
);
const EVENING_QUESTIONS = JOURNAL_QUESTIONS.filter(q =>
  ['small_victory', 'main_difficulty', 'what_helped'].includes(q.key)
);

export function DiarioPage() {
  const { user, isDemo, demoData, showToast } = useApp();
  const [tab, setTab] = useState<DiaryTab>('oggi');
  const [phase, setPhase] = useState<DayPhase>(() => new Date().getHours() < 15 ? 'mattino' : 'sera');
  const [entry, setEntry] = useState<Partial<JournalEntry>>({});
  const [checkin, setCheckin] = useState<Partial<DailyCheckin>>({});
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [goalModal, setGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [saveError, setSaveError] = useState('');

  const today = todayISO();

  useEffect(() => {
    loadData();
  }, [isDemo, user, tab]);

  const loadData = async () => {
    setLoading(true);
    if (isDemo) {
      const todayEntry = demoData.journalEntries.find(e => e.entry_date === today);
      setEntry(todayEntry ?? {});
      setHistory(demoData.journalEntries);
      setGoals(demoData.goals);
    } else if (user) {
      const [entryRes, checkinRes, goalsRes] = await Promise.all([
        supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('entry_date', today).maybeSingle(),
        supabase.from('daily_checkins').select('*').eq('user_id', user.id).eq('checkin_date', today).maybeSingle(),
        supabase.from('personal_goals').select('*').eq('user_id', user.id).eq('is_active', true).order('display_order'),
      ]);
      setEntry(entryRes.data ?? {});
      setCheckin(checkinRes.data ?? {});
      setGoals(goalsRes.data ?? []);

      if (tab === 'storico') {
        const { data } = await supabase.from('journal_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(50);
        setHistory(data ?? []);
      }
    }
    setLoading(false);
  };

  const saveEntry = async () => {
    setSaveError('');
    setSaving(true);
    if (isDemo) {
      showToast('Diario salvato! (modalità demo)', 'success');
      setSaving(false);
      return;
    }
    if (!user) {
      setSaving(false);
      return;
    }
    const { data, error } = await supabase.from('journal_entries').upsert({
      user_id: user.id,
      entry_date: today,
      ...entry,
    }, { onConflict: 'user_id,entry_date' }).select().maybeSingle();
    if (error) {
      const message = `Diario non salvato: ${error.message}`;
      setSaveError(message);
      showToast(message, 'error');
    } else {
      if (data) setEntry(data);
      showToast(`${phase === 'mattino' ? 'Intenzioni del mattino' : 'Riflessione della sera'} salvata!`, 'success');
    }
    setSaving(false);
  };

  const saveCheckin = async (updates: Partial<DailyCheckin>) => {
    const newCheckin = { ...checkin, ...updates };
    setCheckin(newCheckin);
    if (isDemo) return;
    if (!user) return;
    await supabase.from('daily_checkins').upsert({
      user_id: user.id,
      checkin_date: today,
      ...newCheckin,
    }, { onConflict: 'user_id,checkin_date' });
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    if (isDemo) {
      setGoals(prev => [...prev, {
        id: Math.random().toString(36),
        user_id: 'demo',
        title: newGoalTitle,
        description: newGoalDesc || null,
        is_active: true,
        display_order: prev.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
      setGoalModal(false);
      setNewGoalTitle('');
      setNewGoalDesc('');
      return;
    }
    if (!user) return;
    const { data } = await supabase.from('personal_goals').insert({
      user_id: user.id,
      title: newGoalTitle,
      description: newGoalDesc || null,
      is_active: true,
      display_order: goals.length,
    }).select().maybeSingle();
    if (data) setGoals(prev => [...prev, data]);
    setGoalModal(false);
    setNewGoalTitle('');
    setNewGoalDesc('');
    showToast('Motivazione aggiunta!', 'success');
  };

  const filteredHistory = history.filter(e =>
    !searchQuery || Object.values(e).some(v => typeof v === 'string' && v.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 pb-4">
      <h1 className="section-title">Diario</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-warm-gray-100 rounded-xl p-1">
        {([
          { id: 'oggi', label: 'Oggi' },
          { id: 'storico', label: 'Storico' },
          { id: 'ragioni', label: 'Le mie ragioni' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'oggi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPhase('mattino')} className={`rounded-2xl p-4 text-left ${phase === 'mattino' ? 'bg-amber-100 border-2 border-amber-400' : 'bg-white border border-warm-gray-100'}`}>
              <Sunrise size={22} className="text-amber-700 mb-2" />
              <p className="font-semibold text-warm-gray-800">Mattino</p>
              <p className="text-xs text-warm-gray-500">Intenzioni e buoni propositi</p>
            </button>
            <button onClick={() => setPhase('sera')} className={`rounded-2xl p-4 text-left ${phase === 'sera' ? 'bg-petrol-100 border-2 border-petrol-400' : 'bg-white border border-warm-gray-100'}`}>
              <Moon size={22} className="text-petrol-700 mb-2" />
              <p className="font-semibold text-warm-gray-800">Sera</p>
              <p className="text-xs text-warm-gray-500">Vittorie e difficoltà</p>
            </button>
          </div>

          {/* Scores */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-warm-gray-800">Come sto oggi</h2>
            <div className="grid grid-cols-2 gap-4">
              <ScoreButtons label="Umore" value={checkin.mood_score ?? null} onChange={v => saveCheckin({ mood_score: v })} colorScale />
              <ScoreButtons label="Energia" value={checkin.energy_score ?? null} onChange={v => saveCheckin({ energy_score: v })} colorScale />
              <ScoreButtons label="Motivazione" value={checkin.motivation_score ?? null} onChange={v => saveCheckin({ motivation_score: v })} colorScale />
              <ScoreButtons label="Stress (1=alto)" value={checkin.stress_score ?? null} onChange={v => saveCheckin({ stress_score: v })} />
            </div>
          </div>

          {/* Journal questions */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-warm-gray-800">{phase === 'mattino' ? 'Intenzioni del mattino' : 'Riflessione della sera'}</h2>
            {(phase === 'mattino' ? MORNING_QUESTIONS : EVENING_QUESTIONS).map(q => (
              <div key={q.key}>
                <label className="label">{q.label}</label>
                <textarea
                  className="input-field h-20 resize-none text-sm"
                  placeholder={q.placeholder}
                  value={(entry as Record<string, string>)[q.key] ?? ''}
                  onChange={e => setEntry(prev => ({ ...prev, [q.key]: e.target.value }))}
                />
              </div>
            ))}
            {phase === 'sera' && <div>
              <label className="label">Note libere</label>
              <textarea
                className="input-field h-24 resize-none text-sm"
                placeholder="Qualsiasi pensiero, evento, osservazione..."
                value={entry.free_notes ?? ''}
                onChange={e => setEntry(prev => ({ ...prev, free_notes: e.target.value }))}
              />
            </div>}
            <button onClick={saveEntry} disabled={saving} className="btn-primary w-full">
              {saving ? 'Salvataggio...' : phase === 'mattino' ? 'Salva il mattino' : 'Concludi la giornata'}
            </button>
            {saveError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {saveError}
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'storico' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Cerca nel diario..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-pulse h-24 bg-warm-gray-100" />)}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-warm-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nessuna voce trovata</p>
              <p className="text-sm mt-1">Inizia a scrivere nel diario oggi!</p>
            </div>
          ) : (
            filteredHistory.map(e => (
              <div key={e.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-warm-gray-800 capitalize">{formatDateLong(e.entry_date)}</h3>
                </div>
                <div className="space-y-2">
                  {JOURNAL_QUESTIONS.map(q => {
                    const val = e[q.key];
                    if (!val) return null;
                    return (
                      <div key={q.key}>
                        <p className="text-xs font-medium text-warm-gray-500">{q.label}</p>
                        <p className="text-sm text-warm-gray-700 mt-0.5">{val}</p>
                      </div>
                    );
                  })}
                  {e.free_notes && (
                    <div>
                      <p className="text-xs font-medium text-warm-gray-500">Note libere</p>
                      <p className="text-sm text-warm-gray-700 mt-0.5">{e.free_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'ragioni' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-sage-50 to-cream-100 border-sage-200">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={18} className="text-sage-600" />
              <h2 className="font-semibold text-sage-800">Le mie ragioni per cambiare</h2>
            </div>
            <p className="text-sm text-warm-gray-600">Conserva qui le motivazioni personali che ti sostengono nel percorso.</p>
          </div>

          <button onClick={() => setGoalModal(true)} className="w-full card border-2 border-dashed border-warm-gray-200 text-sage-600 hover:border-sage-300 hover:bg-sage-50 transition-all flex items-center gap-2 justify-center py-4">
            <Plus size={18} />
            <span className="font-medium">Aggiungi una motivazione</span>
          </button>

          {goals.length === 0 ? (
            <div className="text-center py-6 text-warm-gray-400">
              <p className="text-sm">Nessuna motivazione ancora.<br />Aggiungi le tue ragioni personali al cambiamento.</p>
            </div>
          ) : (
            goals.map((g, i) => (
              <div key={g.id} className="card border-l-4 border-sage-400">
                <p className="font-semibold text-warm-gray-800">{g.title}</p>
                {g.description && <p className="text-sm text-warm-gray-600 mt-1">{g.description}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {goalModal && (
        <Modal isOpen title="Aggiungi motivazione" onClose={() => setGoalModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Titolo</label>
              <input type="text" className="input-field" placeholder="Es. Voglio giocare con i miei figli senza stancarmi..." value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Descrizione (opzionale)</label>
              <textarea className="input-field h-20 resize-none" value={newGoalDesc} onChange={e => setNewGoalDesc(e.target.value)} />
            </div>
            <button onClick={addGoal} disabled={!newGoalTitle.trim()} className="btn-primary w-full">Aggiungi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
