import { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { ContemplativePrefs } from './RitrovaIlCentroPage';

interface Props {
  prefs: ContemplativePrefs;
  onSave: (prefs: ContemplativePrefs) => void;
  onClose: () => void;
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-warm-gray-800">{label}</p>
        {desc && <p className="text-xs text-warm-gray-400">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ml-4 ${value ? 'bg-sage-500' : 'bg-warm-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export function PreferencesModal({ prefs, onSave, onClose }: Props) {
  const [local, setLocal] = useState<ContemplativePrefs>({ ...prefs });

  const set = <K extends keyof ContemplativePrefs>(key: K, value: ContemplativePrefs[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const modeOptions: { id: ContemplativePrefs['mode']; label: string }[] = [
    { id: 'secular', label: 'Laica' },
    { id: 'spiritual', label: 'Spirituale' },
    { id: 'both', label: 'Entrambe' },
  ];

  return (
    <Modal isOpen title="Preferenze — Ritrova il Centro" onClose={onClose} size="md">
      <div className="space-y-5">
        {/* Mode */}
        <div>
          <p className="label">Modalità di pratica</p>
          <div className="flex gap-2">
            {modeOptions.map(m => (
              <button
                key={m.id}
                onClick={() => set('mode', m.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${local.mode === m.id ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-0 divide-y divide-warm-gray-100">
          <Toggle label="Suoni" desc="Campana di inizio/fine pratica" value={local.sound_enabled} onChange={v => set('sound_enabled', v)} />
          <Toggle label="Animazioni" desc="Effetti visivi durante la pratica" value={local.animations_enabled} onChange={v => set('animations_enabled', v)} />
          <Toggle label="Sincronizzazione del respiro" desc="Indicatori visivi durante i mantra" value={local.breath_sync_enabled} onChange={v => set('breath_sync_enabled', v)} />
          {(local.mode === 'spiritual' || local.mode === 'both') && (
            <Toggle label="Mantra" desc="Mostra testo e sincronizzazione del mantra" value={local.mantra_enabled} onChange={v => set('mantra_enabled', v)} />
          )}
          <Toggle label="Guida testuale" desc="Istruzioni per ogni passo della pratica" value={local.guide_text_enabled} onChange={v => set('guide_text_enabled', v)} />
          {(local.mode === 'spiritual' || local.mode === 'both') && (
            <Toggle label="Calendario lunare" desc="Mostra fasi lunari e giorni favorevoli" value={local.show_moon_calendar} onChange={v => set('show_moon_calendar', v)} />
          )}
        </div>

        {/* Streak type */}
        <div>
          <p className="label">Indicatore di continuità (facoltativo)</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'none', label: 'Nessuno' },
              { id: 'consecutive_days', label: 'Giorni consecutivi' },
              { id: 'weekly_count', label: 'Pratiche settimanali' },
              { id: 'minutes', label: 'Minuti totali' },
            ] as const).map(s => (
              <button
                key={s.id}
                onClick={() => set('streak_type', s.id)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${local.streak_type === s.id ? 'bg-petrol-500 text-white' : 'bg-warm-gray-100 text-warm-gray-600'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => onSave(local)} className="btn-primary w-full">Salva preferenze</button>
      </div>
    </Modal>
  );
}
