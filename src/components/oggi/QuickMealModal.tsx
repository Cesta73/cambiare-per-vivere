import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { MEAL_TYPE_LABELS } from '../../lib/utils';

interface Props { onClose: () => void; }

export function QuickMealModal({ onClose }: Props) {
  const { user, showToast } = useApp();
  const [step, setStep] = useState<'pre' | 'post'>('pre');
  const [mealType, setMealType] = useState('lunch');
  const [preHunger, setPreHunger] = useState<number | null>(null);
  const [preEmotional, setPreEmotional] = useState('');
  const [preReason, setPreReason] = useState('');
  const [preCraving, setPreCraving] = useState('');
  const [postSatiety, setPostSatiety] = useState<number | null>(null);
  const [postSatisfaction, setPostSatisfaction] = useState<number | null>(null);
  const [postCalmly, setPostCalmly] = useState<boolean | null>(null);
  const [postStopped, setPostStopped] = useState<boolean | null>(null);
  const [postNotes, setPostNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('hunger_satiety_entries').insert({
        user_id: user.id,
        entry_datetime: new Date().toISOString(),
        meal_type: mealType,
        pre_hunger: preHunger,
        pre_emotional_state: preEmotional || null,
        pre_eating_reason: preReason || null,
        pre_craving: preCraving || null,
        post_satiety: postSatiety,
        post_satisfaction: postSatisfaction,
        post_ate_calmly: postCalmly,
        post_stopped_at_right_time: postStopped,
        post_notes: postNotes || null,
    });
    if (error) {
      showToast(`Pasto non registrato: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast('Registrazione pasto salvata!', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Registra pasto" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Tipo di pasto</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MEAL_TYPE_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => setMealType(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mealType === val ? 'bg-amber-500 text-white' : 'bg-warm-gray-100 text-warm-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {(['pre', 'post'] as const).map(s => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${step === s ? 'bg-amber-500 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
              {s === 'pre' ? 'Prima del pasto' : 'Dopo il pasto'}
            </button>
          ))}
        </div>

        {step === 'pre' && (
          <div className="space-y-4">
            <ScoreButtons label="Fame fisica (0=nessuna, 10=intensa)" value={preHunger} onChange={setPreHunger} min={0} max={10} colorScale />
            <div>
              <label className="label">Stato emotivo</label>
              <input type="text" className="input-field" placeholder="Es. Tranquillo, stressato, annoiato..." value={preEmotional} onChange={e => setPreEmotional(e.target.value)} />
            </div>
            <div>
              <label className="label">Perché sto mangiando?</label>
              <input type="text" className="input-field" placeholder="Es. Fame fisica, orario, noia..." value={preReason} onChange={e => setPreReason(e.target.value)} />
            </div>
            <div>
              <label className="label">Voglia specifica (se presente)</label>
              <input type="text" className="input-field" placeholder="Es. dolci, salato..." value={preCraving} onChange={e => setPreCraving(e.target.value)} />
            </div>
            <button onClick={() => setStep('post')} className="btn-primary w-full">Continua</button>
          </div>
        )}

        {step === 'post' && (
          <div className="space-y-4">
            <ScoreButtons label="Sazietà (0=ancora fame, 10=pieno)" value={postSatiety} onChange={setPostSatiety} min={0} max={10} colorScale />
            <ScoreButtons label="Soddisfazione (0=per nulla, 10=molto)" value={postSatisfaction} onChange={setPostSatisfaction} min={0} max={10} colorScale />
            <div>
              <label className="label">Ho mangiato con calma?</label>
              <div className="flex gap-3">
                {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <button key={l} onClick={() => setPostCalmly(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${postCalmly === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Mi sono fermato quando ero sazio?</label>
              <div className="flex gap-3">
                {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <button key={l} onClick={() => setPostStopped(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${postStopped === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Note</label>
              <textarea className="input-field h-20 resize-none" value={postNotes} onChange={e => setPostNotes(e.target.value)} placeholder="Opzionale..." />
            </div>
            <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
              {loading ? 'Salvataggio...' : 'Salva registrazione'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
