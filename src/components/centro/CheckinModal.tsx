import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { ScoreButtons } from '../ui/ScoreButtons';
import { CONTEMPLATIVE_STATES_BEFORE, CONTEMPLATIVE_STATES_AFTER } from '../../lib/contemplative-data';

interface CheckinData {
  state_label: string | null;
  stress_score: number | null;
  energy_score: number | null;
  helpful?: boolean | null;
  what_noticed?: string;
  reason_here?: string;
  notes: string;
}

interface CheckinModalProps {
  phase: 'before' | 'after';
  onSave: (data: CheckinData) => void;
  onSkip: () => void;
}

export function CheckinModal({ phase, onSave, onSkip }: CheckinModalProps) {
  const [stateLabel, setStateLabel] = useState<string | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [whatNoticed, setWhatNoticed] = useState('');
  const [reasonHere, setReasonHere] = useState('');
  const [notes, setNotes] = useState('');

  const states = phase === 'before' ? CONTEMPLATIVE_STATES_BEFORE : CONTEMPLATIVE_STATES_AFTER;

  const handleSave = () => {
    onSave({
      state_label: stateLabel,
      stress_score: stress,
      energy_score: energy,
      helpful: phase === 'after' ? helpful : undefined,
      what_noticed: whatNoticed || undefined,
      reason_here: reasonHere || undefined,
      notes,
    });
  };

  return (
    <Modal
      isOpen
      title={phase === 'before' ? 'Come stai prima della pratica?' : 'Come stai dopo la pratica?'}
      onClose={onSkip}
      size="md"
    >
      <div className="space-y-5">
        <p className="text-sm text-warm-gray-500">
          {phase === 'before'
            ? 'Tutte le domande sono facoltative.'
            : 'Come ti senti ora? Nessuna risposta è giusta o sbagliata.'}
        </p>

        {/* State buttons */}
        <div>
          <p className="label">Come mi sento {phase === 'before' ? 'in questo momento' : 'ora'}?</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {states.map(s => (
              <button
                key={s.id}
                onClick={() => setStateLabel(stateLabel === s.id ? null : s.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  stateLabel === s.id
                    ? 'bg-sage-600 text-white'
                    : 'bg-warm-gray-100 text-warm-gray-700 hover:bg-warm-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scores */}
        <ScoreButtons label="Stress percepito (1=molto, 5=poco)" value={stress} onChange={setStress} />
        <ScoreButtons label="Energia (1=poca, 5=tanta)" value={energy} onChange={setEnergy} colorScale />

        {phase === 'before' && (
          <div>
            <label className="label">Cosa mi ha portato qui? (facoltativo)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Es. Momento di stress, routine, voglia di calma..."
              value={reasonHere}
              onChange={e => setReasonHere(e.target.value)}
            />
          </div>
        )}

        {phase === 'after' && (
          <>
            <div>
              <p className="label">La pratica mi è stata utile?</p>
              <div className="flex gap-3 mt-1">
                {[{ v: true, l: 'Sì' }, { v: false, l: 'No' }, { v: null, l: 'Non so' }].map(({ v, l }) => (
                  <button
                    key={l}
                    onClick={() => setHelpful(v)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      helpful === v ? 'bg-sage-600 text-white' : 'bg-warm-gray-100 text-warm-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Cosa ho notato? (facoltativo)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Pensieri, sensazioni, osservazioni..."
                value={whatNoticed}
                onChange={e => setWhatNoticed(e.target.value)}
              />
            </div>
          </>
        )}

        <div>
          <label className="label">Nota libera (facoltativa)</label>
          <textarea
            className="input-field h-16 resize-none text-sm"
            placeholder="Qualsiasi pensiero..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onSkip} className="btn-secondary flex-1">Salta</button>
          <button onClick={handleSave} className="btn-primary flex-1">
            {phase === 'before' ? 'Inizia pratica' : 'Salva e chiudi'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
