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
  const [bodyFat, setBodyFat] = useState('');
  const [bodyWater, setBodyWater] = useState('');
  const [muscle, setMuscle] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [basalMetabolism, setBasalMetabolism] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!weight && !waist && !neck && !systolic && !diastolic && !bodyFat && !bodyWater && !muscle && !boneMass && !basalMetabolism) return;
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
        body_fat_percent: bodyFat ? parseFloat(bodyFat) : null,
        body_water_percent: bodyWater ? parseFloat(bodyWater) : null,
        muscle_percent: muscle ? parseFloat(muscle) : null,
        bone_mass_kg: boneMass ? parseFloat(boneMass) : null,
        basal_metabolism_kcal: basalMetabolism ? parseInt(basalMetabolism) : null,
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
        <details className="rounded-xl bg-warm-gray-50 border border-warm-gray-100 p-3">
          <summary className="text-sm font-semibold text-warm-gray-700 cursor-pointer">Dati bilancia avanzati</summary>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className="label">Grasso (%)</label><input type="number" step="0.1" className="input-field" value={bodyFat} onChange={e => setBodyFat(e.target.value)} /></div>
            <div><label className="label">Acqua (%)</label><input type="number" step="0.1" className="input-field" value={bodyWater} onChange={e => setBodyWater(e.target.value)} /></div>
            <div><label className="label">Muscolo (%)</label><input type="number" step="0.1" className="input-field" value={muscle} onChange={e => setMuscle(e.target.value)} /></div>
            <div><label className="label">Ossa (kg)</label><input type="number" step="0.1" className="input-field" value={boneMass} onChange={e => setBoneMass(e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Metabolismo basale (kcal)</label><input type="number" className="input-field" value={basalMetabolism} onChange={e => setBasalMetabolism(e.target.value)} /></div>
          </div>
        </details>
        <div>
          <label className="label">Note</label>
          <input type="text" className="input-field" placeholder="Opzionale..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button onClick={handleSave} disabled={loading || (!weight && !waist && !neck && !systolic && !diastolic && !bodyFat && !bodyWater && !muscle && !boneMass && !basalMetabolism)} className="btn-primary w-full">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </Modal>
  );
}
