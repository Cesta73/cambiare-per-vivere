import { useState } from 'react';
import { ArrowLeft, Save, Plus, Bell } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { calculateBMI } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface Props { onBack: () => void; }

export function ProfilePage({ onBack }: Props) {
  const { profile, user, isDemo, updateProfile, showToast } = useApp();
  const [saving, setSaving] = useState(false);
  const [habitModal, setHabitModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? '');
  const [goalDesc, setGoalDesc] = useState(profile?.goal_description ?? '');
  const [hideWeight, setHideWeight] = useState(profile?.hide_weight_dashboard ?? false);
  const [hideBmi, setHideBmi] = useState(profile?.hide_bmi ?? false);
  const [calorieTarget, setCalorieTarget] = useState(profile?.daily_calorie_target?.toString() ?? '2200');

  const bmi = profile?.height_cm && profile?.discharge_weight
    ? calculateBMI(profile.discharge_weight, profile.height_cm)
    : null;

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      display_name: displayName || null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      goal_description: goalDesc || null,
      hide_weight_dashboard: hideWeight,
      hide_bmi: hideBmi,
      daily_calorie_target: calorieTarget ? parseInt(calorieTarget) : 2200,
    });
    showToast(error ? `Profilo non aggiornato: ${error}` : 'Profilo aggiornato!', error ? 'error' : 'success');
    setSaving(false);
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    if (!isDemo && user) {
      await supabase.from('habit_definitions').insert({
        user_id: user.id,
        name: newHabitName,
        frequency: 'daily',
        is_active: true,
        display_order: 100,
      });
    }
    showToast(`Abitudine "${newHabitName}" aggiunta!`, 'success');
    setHabitModal(false);
    setNewHabitName('');
  };

  const exportData = () => {
    const data = {
      profile,
      exportedAt: new Date().toISOString(),
      note: 'Esportazione dati personali da Cambiare per Vivere',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpv-profilo-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Dati esportati!', 'success');
  };

  const deleteAccount = async () => {
    if (!confirm('Sei sicuro di voler eliminare definitivamente il tuo account e tutti i dati? Questa operazione è irreversibile.')) return;
    if (!confirm('Ultima conferma: eliminare TUTTI i tuoi dati?')) return;
    if (isDemo) { showToast('In modalità demo non è necessario eliminare l\'account.', 'info'); return; }
    showToast('Contatta il supporto per eliminare il tuo account.', 'info');
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Le notifiche non sono supportate da questo browser.', 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    showToast(permission === 'granted' ? 'Notifiche attivate.' : 'Permesso notifiche non concesso.', permission === 'granted' ? 'success' : 'info');
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Profilo e impostazioni</h1>
      </div>

      {/* Personal Info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-warm-gray-800">Informazioni personali</h2>
        <div>
          <label className="label">Nome o soprannome</label>
          <input type="text" className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Come ti chiami?" />
        </div>
        <div>
          <label className="label">Altezza (cm)</label>
          <input type="number" className="input-field" value={heightCm} onChange={e => setHeightCm(e.target.value)} placeholder="Es. 175" />
          {bmi && !hideBmi && (
            <p className="text-xs text-warm-gray-500 mt-1">BMI indicativo: {bmi} — Dato puramente informativo, discutilo con il tuo medico.</p>
          )}
        </div>
        <div>
          <label className="label">Obiettivo personale</label>
          <textarea className="input-field h-20 resize-none" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} placeholder="Concordato con i tuoi professionisti..." />
        </div>
        <div>
          <label className="label">Obiettivo calorico giornaliero</label>
          <input type="number" className="input-field" min="800" max="6000" step="50" value={calorieTarget} onChange={e => setCalorieTarget(e.target.value)} />
          <p className="text-xs text-warm-gray-400 mt-1">Valore indicativo concordato: 2200 kcal. Modificalo solo su indicazione del professionista.</p>
        </div>
      </div>

      {/* Display options */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-gray-800">Visualizzazione</h2>
        {[
          { label: 'Nascondi peso dalla dashboard', value: hideWeight, set: setHideWeight },
          { label: 'Nascondi BMI', value: hideBmi, set: setHideBmi },
        ].map(({ label, value, set }) => (
          <div key={label} className="flex items-center justify-between py-1">
            <span className="text-sm text-warm-gray-700">{label}</span>
            <button onClick={() => set(!value)}
              className={`w-12 h-6 rounded-full transition-all relative ${value ? 'bg-sage-500' : 'bg-warm-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Start data */}
      {profile && (
        <div className="card">
          <h2 className="font-semibold text-warm-gray-800 mb-3">Dati iniziali percorso</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-gray-500">Inizio percorso</span>
              <span className="text-warm-gray-800 font-medium">{profile.start_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray-500">Peso iniziale</span>
              <span className="text-warm-gray-800 font-medium">{profile.start_weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray-500">Addome iniziale</span>
              <span className="text-warm-gray-800 font-medium">{profile.start_waist} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-gray-500">Collo iniziale</span>
              <span className="text-warm-gray-800 font-medium">{profile.start_neck} cm</span>
            </div>
          </div>
          <p className="text-xs text-warm-gray-400 mt-3">I dati iniziali sono stati impostati alla creazione del profilo e non sono modificabili dall'app.</p>
        </div>
      )}

      {/* Habits */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-warm-gray-800">Abitudini da tracciare</h2>
          <button onClick={() => setHabitModal(true)} className="text-sage-600 hover:bg-sage-50 p-1.5 rounded-lg transition-colors">
            <Plus size={18} />
          </button>
        </div>
        <p className="text-sm text-warm-gray-500">Aggiungi nuove abitudini da monitorare nella dashboard.</p>
      </div>

      <button onClick={saveProfile} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={18} /> {saving ? 'Salvataggio...' : 'Salva modifiche'}
      </button>

      {/* Data & Privacy */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-gray-800">Promemoria</h2>
        <p className="text-sm text-warm-gray-500">Le notifiche funzionano quando l’app è aperta o attiva nel browser. Gli eventi importanti potranno anche essere esportati nel calendario.</p>
        <button onClick={enableNotifications} className="btn-secondary w-full text-sm flex items-center justify-center gap-2"><Bell size={16} /> Attiva notifiche</button>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-warm-gray-800">Privacy e dati</h2>
        <p className="text-sm text-warm-gray-500">I tuoi dati sono privati e accessibili solo a te tramite il tuo account protetto.</p>
        <button onClick={exportData} className="btn-secondary w-full text-sm">Esporta i miei dati (JSON)</button>
        <button onClick={deleteAccount} className="w-full text-sm text-red-500 hover:text-red-600 py-2 transition-colors">
          Elimina account e tutti i dati
        </button>
      </div>

      {habitModal && (
        <Modal isOpen title="Aggiungi abitudine" onClose={() => setHabitModal(false)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Nome abitudine</label>
              <input type="text" className="input-field" placeholder="Es. Meditazione mattutina" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} autoFocus />
            </div>
            <button onClick={addHabit} disabled={!newHabitName.trim()} className="btn-primary w-full">Aggiungi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
