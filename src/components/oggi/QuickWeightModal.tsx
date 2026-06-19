import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { todayISO } from '../../lib/utils';

interface Props { onClose: () => void; }

export function QuickWeightModal({ onClose }: Props) {
  const { user, showToast } = useApp();
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!weight && !waist && !neck && !systolic && !diastolic) return;
    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      showToast('Inserisci sia la pressione massima sia la minima.', 'error');
      return;
    }
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('body_measurements').insert({
        user_id: user.id,
        measured_at: todayISO(),
        weight_kg: weight ? parseFloat(weight) : null,
        waist_cm: waist ? parseFloat(waist) : null,
        neck_cm: neck ? parseFloat(neck) : null,
        systolic_bp: systolic ? parseInt(systolic) : null,
        diastolic_bp: diastolic ? parseInt(diastolic) : null,
        notes: notes || null,
    });
    if (error) {
      showToast(`Misurazione non salvata: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast('Misurazione salvata!', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Registra misurazione" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Peso (kg)</label>
          <input type="number" step="0.1" className="input-field" placeholder="Es. 145.5" value={weight} onChange={e => setWeight(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Addome (cm)</label>
            <input type="number" step="0.5" className="input-field" placeholder="Es. 154" value={waist} onChange={e => setWaist(e.target.value)} />
          </div>
          <div>
            <label className="label">Collo (cm)</label>
            <input type="number" step="0.5" className="input-field" placeholder="Es. 50" value={neck} onChange={e => setNeck(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Pressione arteriosa (mmHg)</label>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" inputMode="numeric" className="input-field" placeholder="Massima" value={systolic} onChange={e => setSystolic(e.target.value)} />
            <input type="number" inputMode="numeric" className="input-field" placeholder="Minima" value={diastolic} onChange={e => setDiastolic(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Note</label>
          <input type="text" className="input-field" placeholder="Opzionale..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={handleSave} disabled={loading || (!weight && !waist && !neck && !systolic && !diastolic)} className="btn-primary w-full">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </Modal>
  );
}
