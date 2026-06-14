import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { todayISO } from '../../lib/utils';
import type { DailyCheckin } from '../../lib/supabase';

interface Props { checkin: DailyCheckin | null; onClose: () => void; }

export function QuickWaterModal({ checkin, onClose }: Props) {
  const { user, showToast } = useApp();
  const [amount, setAmount] = useState('250');
  const [loading, setLoading] = useState(false);

  const currentMl = checkin?.water_ml ?? 0;

  const handleSave = async () => {
    const ml = parseInt(amount);
    if (!ml || ml <= 0) return;
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('daily_checkins').upsert({
        user_id: user.id,
        checkin_date: todayISO(),
        water_ml: currentMl + ml,
    }, { onConflict: 'user_id,checkin_date' });
    if (error) {
      showToast(`Acqua non registrata: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast(`+${ml} ml aggiunti! Totale: ${currentMl + ml} ml`, 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Aggiungi acqua" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="text-center text-warm-gray-500 text-sm">
          Attuale: <span className="font-semibold text-petrol-700">{currentMl} ml</span> / 2000 ml
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {[100, 150, 200, 250, 300, 500].map(ml => (
            <button
              key={ml}
              onClick={() => setAmount(ml.toString())}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${amount === ml.toString() ? 'bg-petrol-500 text-white' : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'}`}
            >
              {ml} ml
            </button>
          ))}
        </div>
        <div>
          <label className="label">Quantità personalizzata (ml)</label>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1"
            max="2000"
          />
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
          {loading ? 'Salvataggio...' : `Aggiungi ${amount} ml`}
        </button>
      </div>
    </Modal>
  );
}
