import type { BreathState } from './usePracticeTimer';
import { MANTRA_DB } from '../../lib/contemplative-data';

interface MantraDisplayProps {
  mantraKey: string;
  words: string[];
  wordIndex: number;
  currentRep: number;
  targetReps: number;
  breathState: BreathState | null;
  breathSyncEnabled: boolean;
  showInfo?: boolean;
}

const BREATH_COLORS = {
  inhale: { bg: 'bg-sage-100', text: 'text-sage-800', arrow: '↓', label: 'Inspira' },
  hold: { bg: 'bg-amber-50', text: 'text-amber-800', arrow: '◌', label: 'Trattieni' },
  exhale: { bg: 'bg-petrol-100', text: 'text-petrol-800', arrow: '↑', label: 'Espira' },
};

export function MantraDisplay({
  mantraKey,
  words,
  wordIndex,
  currentRep,
  targetReps,
  breathState,
  breathSyncEnabled,
  showInfo = false,
}: MantraDisplayProps) {
  const mantraData = MANTRA_DB[mantraKey];
  const breath = breathState ? BREATH_COLORS[breathState.phase] : null;

  return (
    <div className="space-y-3">
      {/* Rep counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-warm-gray-500 font-medium">
          Ripetizioni: {currentRep} / {targetReps}
        </span>
        {targetReps > 0 && (
          <div className="flex gap-1">
            {Array.from({ length: Math.min(targetReps, 21) }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${i < currentRep ? 'bg-sage-500' : 'bg-warm-gray-200'}`}
              />
            ))}
            {targetReps > 21 && <span className="text-xs text-warm-gray-400">+{targetReps - 21}</span>}
          </div>
        )}
      </div>

      {/* Mantra text */}
      <div className={`rounded-2xl p-4 border transition-colors ${breath ? breath.bg : 'bg-warm-gray-50'} border-warm-gray-200`}>
        <p className="text-center text-lg font-semibold leading-relaxed font-mono tracking-wide">
          {words.map((word, i) => (
            <span key={i}>
              <span
                className={`inline-block px-1.5 py-0.5 rounded-lg mx-0.5 transition-all ${
                  i === wordIndex
                    ? 'bg-sage-600 text-white shadow-sm scale-110'
                    : 'text-warm-gray-700'
                }`}
              >
                {word}
              </span>
            </span>
          ))}
        </p>
      </div>

      {/* Breath sync */}
      {breathSyncEnabled && breathState && (
        <div className={`flex items-center gap-3 justify-center py-2 px-4 rounded-xl ${breath?.bg ?? 'bg-warm-gray-50'}`}>
          <span className="text-2xl transition-transform" style={{
            transform: breathState.phase === 'inhale' ? 'translateY(3px)' : breathState.phase === 'exhale' ? 'translateY(-3px)' : 'none',
            transition: 'transform 0.5s ease',
          }}>
            {breath?.arrow}
          </span>
          <span className={`font-semibold text-sm ${breath?.text}`}>{breath?.label}</span>
          {breathState.instruction && (
            <span className="text-xs text-warm-gray-500 max-w-[140px] leading-tight">{breathState.instruction}</span>
          )}
        </div>
      )}

      {/* Mantra info */}
      {showInfo && mantraData && (
        <div className="bg-cream-100 rounded-xl p-3 text-xs text-warm-gray-600 space-y-1">
          <p><span className="font-semibold">Pronuncia:</span> {mantraData.pronunciation}</p>
          <p><span className="font-semibold">Significato:</span> {mantraData.meaning}</p>
        </div>
      )}
    </div>
  );
}
