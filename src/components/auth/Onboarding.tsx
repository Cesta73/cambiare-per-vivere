import { useState } from 'react';
import { Leaf, ChevronRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

const SHIFT_OPTIONS = [
  { value: 'morning', label: 'Mattina' },
  { value: 'afternoon', label: 'Pomeriggio' },
  { value: 'night', label: 'Notte' },
  { value: 'rest', label: 'Riposo' },
];

const DAY_OPTIONS = [
  { value: 'monday', label: 'Lun' },
  { value: 'tuesday', label: 'Mar' },
  { value: 'wednesday', label: 'Mer' },
  { value: 'thursday', label: 'Gio' },
  { value: 'friday', label: 'Ven' },
  { value: 'saturday', label: 'Sab' },
  { value: 'sunday', label: 'Dom' },
];

export function Onboarding() {
  const { user, updateProfile, showToast } = useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [preferredWeighDays, setPreferredWeighDays] = useState<string[]>(['monday']);
  const [usesCpap, setUsesCpap] = useState(false);
  const [usedShifts, setUsedShifts] = useState<string[]>([]);

  const steps = [
    { title: 'Benvenuto/a!', subtitle: 'Iniziamo conoscendoci un po\'' },
    { title: 'Il tuo percorso', subtitle: 'Alcune informazioni sul tuo cammino' },
    { title: 'Le tue abitudini', subtitle: 'Aiutami a personalizzare l\'app per te' },
  ];

  const toggleDay = (day: string) => {
    setPreferredWeighDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleShift = (shift: string) => {
    setUsedShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName || null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        goal_description: goalDescription || null,
        preferred_weigh_days: preferredWeighDays,
        uses_cpap: usesCpap,
        start_date: '2024-09-17',
        start_weight: 149.8,
        discharge_weight: 145.5,
        start_waist: 155.5,
        discharge_waist: 154.0,
        start_neck: 52.0,
        discharge_neck: 50.0,
        is_demo: false,
      });

      if (goalDescription) {
        await supabase.from('personal_goals').insert({
          user_id: user.id,
          title: goalDescription.slice(0, 60),
          description: goalDescription,
          is_active: true,
          display_order: 0,
        });
      }

      await updateProfile({ display_name: displayName || null });
      showToast('Profilo creato! Benvenuto/a nell\'app.', 'success');
    } catch {
      showToast('Errore nel salvataggio del profilo', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-cream-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-sage-600 rounded-2xl mb-4 shadow-lg">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-warm-gray-900">{steps[step].title}</h1>
          <p className="text-warm-gray-500 mt-1 text-sm">{steps[step].subtitle}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-sage-500 w-8' : 'bg-warm-gray-200 w-4'}`} />
          ))}
        </div>

        <div className="card space-y-5">
          {step === 0 && (
            <>
              <div>
                <label className="label">Come ti chiami? (nome o soprannome)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Es. Marco, Mari, ..."
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Altezza (cm) — facoltativa</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Es. 175"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  min="100"
                  max="250"
                />
                <p className="text-xs text-warm-gray-400 mt-1">Usata per mostrare il BMI come dato informativo. Discuti sempre il tuo peso con il medico.</p>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="label">Qual è il tuo obiettivo principale? (facoltativo)</label>
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="Es. Migliorare la mia salute seguendo le indicazioni dei professionisti..."
                  value={goalDescription}
                  onChange={e => setGoalDescription(e.target.value)}
                />
                <p className="text-xs text-warm-gray-400 mt-1">Inserisci solo obiettivi concordati con i tuoi professionisti di riferimento.</p>
              </div>
              <div>
                <label className="label">Giorni preferiti per la pesata</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => toggleDay(d.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        preferredWeighDays.includes(d.value)
                          ? 'bg-sage-600 text-white'
                          : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="label">Tipologie di turno che utilizzi</label>
                <div className="flex flex-wrap gap-2">
                  {SHIFT_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => toggleShift(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        usedShifts.includes(s.value)
                          ? 'bg-petrol-600 text-white'
                          : 'bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-warm-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-warm-gray-800">Utilizzo CPAP</p>
                  <p className="text-sm text-warm-gray-500">Ricevi promemoria per l'uso notturno</p>
                </div>
                <button
                  onClick={() => setUsesCpap(!usesCpap)}
                  className={`w-12 h-6 rounded-full transition-all relative ${usesCpap ? 'bg-sage-500' : 'bg-warm-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${usesCpap ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-1">
                <ChevronLeft size={18} /> Indietro
              </button>
            )}
            <button
              onClick={step < steps.length - 1 ? () => setStep(s => s + 1) : handleComplete}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-1"
            >
              {loading ? 'Salvataggio...' : step < steps.length - 1 ? (
                <><span>Continua</span><ChevronRight size={18} /></>
              ) : 'Inizia il percorso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
