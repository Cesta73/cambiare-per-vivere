import { useState } from 'react';
import { Modal } from '../ui/Modal';

interface Props {
  onComplete: (mode: 'secular' | 'spiritual' | 'both') => void;
  onSkip: () => void;
}

export function OnboardingModal({ onComplete, onSkip }: Props) {
  const [selected, setSelected] = useState<'secular' | 'spiritual' | 'both' | null>(null);

  const options = [
    {
      id: 'secular' as const,
      icon: '🌱',
      title: 'Modalità laica',
      desc: 'Respirazione, presenza e riflessione. Linguaggio neutro, nessun contenuto religioso.',
    },
    {
      id: 'spiritual' as const,
      icon: '🪷',
      title: 'Modalità spirituale buddhista',
      desc: 'Include mantra, pratiche tradizionali, fasi lunari e corso completo (tradizione NgalSo).',
    },
    {
      id: 'both' as const,
      icon: '✨',
      title: 'Entrambe',
      desc: 'Accesso a tutte le pratiche. Puoi cambiare in qualsiasi momento.',
    },
  ];

  return (
    <Modal isOpen title="Benvenuto/a in Ritrova il Centro" onClose={onSkip} size="md">
      <div className="space-y-4">
        <p className="text-sm text-warm-gray-600 leading-relaxed">
          Questo modulo offre pratiche contemplative facoltative per ritrovare calma e presenza.
          Scegli l'esperienza che preferisci — potrai modificarla in qualsiasi momento.
        </p>

        <div className="space-y-3">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                selected === opt.id
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-warm-gray-200 hover:border-warm-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <p className="font-semibold text-warm-gray-800">{opt.title}</p>
                  <p className="text-sm text-warm-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-warm-gray-50 rounded-xl p-3 text-xs text-warm-gray-500 leading-relaxed">
          Le pratiche spirituali nel Buddismo Tibetano non sono scientificamente validate come metodo clinico. Questo modulo non fornisce indicazioni mediche, diagnosi o iniziazioni.
        </div>

        <button
          onClick={() => selected && onComplete(selected)}
          disabled={!selected}
          className="btn-primary w-full"
        >
          Inizia con questa modalità
        </button>

        <button onClick={onSkip} className="w-full text-center text-sm text-warm-gray-400 hover:text-warm-gray-600 py-1">
          Scegli più tardi (modalità laica)
        </button>
      </div>
    </Modal>
  );
}
