import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { todayISO, ACTIVITY_TYPE_LABELS } from '../../lib/utils';

interface Props { onClose: () => void; }

export function QuickActivityModal({ onClose }: Props) {
  const { user, profile, showToast } = useApp();
  const [type, setType] = useState('walking');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [effort, setEffort] = useState<string>('');
  const [pain, setPain] = useState('');
  const [loading, setLoading] = useState(false);
  const [weightKg, setWeightKg] = useState<number | null>(profile?.start_weight ?? null);

  useEffect(() => {
    if (!user) return;
    supabase.from('body_measurements').select('weight_kg').eq('user_id', user.id)
      .not('weight_kg', 'is', null).order('measured_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setWeightKg(data?.weight_kg ?? profile?.start_weight ?? null));
  }, [profile?.start_weight, user]);

  const estimatedCalories = useMemo(() => {
    if (!weightKg || !duration || parseInt(duration) <= 0) return null;
    const baseMet: Record<string, number> = { walking: 4, aerobic: 6, strength: 5, mobility: 2.5, daily: 3, other: 4 };
    const effortFactor = effort ? 0.7 + parseInt(effort) * 0.06 : 1;
    return Math.round((baseMet[type] ?? 4) * effortFactor * weightKg * (parseInt(duration) / 60));
  }, [duration, effort, type, weightKg]);

  const handleSave = async () => {
    if (!duration || parseInt(duration) <= 0) return;
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('activity_entries').insert({
        user_id: user.id,
        activity_date: todayISO(),
        activity_type: type,
        activity_name: name || null,
        duration_minutes: parseInt(duration),
        perceived_effort: effort ? parseInt(effort) : null,
        pain_or_difficulty: pain || null,
        notes: null,
        calories_burned_kcal: estimatedCalories,
        calories_source: estimatedCalories ? 'met_estimate' : null,
    });
    if (error) {
      showToast(`Attività non registrata: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast('Attività registrata!', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Registra attività" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Tipo di attività</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setType(val)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${type === val ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Nome attività (opzionale)</label>
          <input type="text" className="input-field" placeholder="Es. Passeggiata al parco" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Durata (minuti)</label>
          <input type="number" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} min="1" max="600" autoFocus />
        </div>
        <div>
          <label className="label">Sforzo percepito 1–10 (opzionale)</label>
          <input type="number" className="input-field" placeholder="1=lieve, 10=massimo" value={effort} onChange={e => setEffort(e.target.value)} min="1" max="10" />
        </div>
        <div>
          <label className="label">Dolore o difficoltà (opzionale)</label>
          <input type="text" className="input-field" placeholder="Es. Lieve fastidio al ginocchio" value={pain} onChange={e => setPain(e.target.value)} />
        </div>
        <div className="bg-sage-50 border border-sage-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-sage-800">Stima calorie bruciate: {estimatedCalories ?? '—'} kcal</p>
          <p className="text-xs text-sage-700 mt-1">Stima indicativa basata su peso, durata, tipo di attività e sforzo percepito.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          Segui le indicazioni ricevute dai tuoi professionisti, soprattutto in presenza di dolori articolari da carico.
        </div>
        <button onClick={handleSave} disabled={loading || !duration} className="btn-primary w-full">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </Modal>
  );
}
