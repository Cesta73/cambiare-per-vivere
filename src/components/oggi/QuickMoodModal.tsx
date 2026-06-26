import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { todayISO } from '../../lib/utils';
import type { DailyCheckin } from '../../lib/supabase';

interface Props { checkin: DailyCheckin | null; onClose: () => void; }

export function QuickMoodModal({ checkin, onClose }: Props) {
  const { user, showToast } = useApp();
  const [mood, setMood] = useState<number | null>(checkin?.mood_score ?? null);
  const [energy, setEnergy] = useState<number | null>(checkin?.energy_score ?? null);
  const [motivation, setMotivation] = useState<number | null>(checkin?.motivation_score ?? null);
  const [stress, setStress] = useState<number | null>(checkin?.stress_score ?? null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    if (!user) {
      showToast('Sessione non disponibile.', 'error');
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('daily_checkins').upsert({
        user_id: user.id,
        checkin_date: todayISO(),
        mood_score: mood,
        energy_score: energy,
        motivation_score: motivation,
        stress_score: stress,
    }, { onConflict: 'user_id,checkin_date' });
    if (error) {
      showToast(`Stato non salvato: ${error.message}`, 'error');
      setLoading(false);
      return;
    }
    showToast('Come stai salvato!', 'success');
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen title="Come mi sento oggi?" onClose={onClose} size="sm">
      <div className="space-y-5">
        <ScoreButtons label="Umore (1=basso, 5=alto)" value={mood} onChange={setMood} colorScale />
        <ScoreButtons label="Energia (1=poca, 5=tanta)" value={energy} onChange={setEnergy} colorScale />
        <ScoreButtons label="Motivazione (1=bassa, 5=alta)" value={motivation} onChange={setMotivation} colorScale />
        <ScoreButtons label="Stress (1=basso, 5=alto)" value={stress} onChange={setStress} />
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
          {loading ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </Modal>
  );
}
