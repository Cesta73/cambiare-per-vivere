import { useState } from 'react';
import { Play, Pause, Square, RotateCcw, ChevronRight, Info } from 'lucide-react';
import type { PracticeTemplate } from '../../lib/contemplative-data';
import { getStepsForMode, MANTRA_DB } from '../../lib/contemplative-data';
import { usePracticeTimer, type TimerState } from './usePracticeTimer';
import { CircularTimer, formatSeconds } from './CircularTimer';
import { MantraDisplay } from './MantraDisplay';

interface PracticePlayerProps {
  template: PracticeTemplate;
  mode: 'secular' | 'spiritual';
  soundEnabled: boolean;
  breathSyncEnabled: boolean;
  mantraEnabled: boolean;
  guideTextEnabled: boolean;
  animationsEnabled: boolean;
  onComplete: (actualSec: number) => void;
  onStop: (actualSec: number) => void;
}

export function PracticePlayer({
  template,
  mode,
  soundEnabled,
  breathSyncEnabled,
  mantraEnabled,
  guideTextEnabled,
  animationsEnabled,
  onComplete,
  onStop,
}: PracticePlayerProps) {
  const steps = getStepsForMode(template, mode);
  const [showMantraInfo, setShowMantraInfo] = useState(false);
  const timer = usePracticeTimer(steps, soundEnabled);

  const currentStep = steps[timer.currentStepIndex];
  const nextStep = steps[timer.currentStepIndex + 1];
  const hasMantra = !!(currentStep?.mantra && mantraEnabled && mode === 'spiritual');

  const handleStop = () => {
    timer.stop();
    onStop(timer.totalElapsedSec);
  };

  if (timer.timerState === 'done') {
    return (
      <div className="text-center py-8 space-y-4 animate-fade-in">
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-4xl">🌿</span>
        </div>
        <h2 className="text-2xl font-bold text-sage-700">Pratica completata</h2>
        <p className="text-warm-gray-500 text-sm">Durata: {formatSeconds(timer.totalElapsedSec)}</p>
        {currentStep?.text && guideTextEnabled && (
          <div className="bg-sage-50 rounded-2xl p-4 text-sm text-sage-700 text-left leading-relaxed">
            {currentStep.text}
          </div>
        )}
        <p className="text-xs text-warm-gray-400 leading-relaxed italic">
          Le pratiche contemplative sono strumenti facoltativi di consapevolezza e cura personale. Non sostituiscono il supporto dei professionisti sanitari.
        </p>
        <button onClick={() => { timer.reset(); onComplete(timer.totalElapsedSec); }} className="btn-primary w-full">
          Chiudi e salva
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breath notice */}
      <div className="bg-warm-gray-100 border border-warm-gray-200 rounded-xl px-4 py-2 text-xs text-warm-gray-600 text-center">
        Respira naturalmente. Salta o interrompi qualsiasi passaggio che provochi disagio.
      </div>

      {/* Circular timer */}
      <div className="flex justify-center">
        <CircularTimer
          progress={timer.totalSec > 0 ? timer.totalElapsedSec / timer.totalSec : 0}
          timeDisplay={timer.timerState === 'idle' ? formatSeconds(timer.totalSec) : formatSeconds(timer.totalSec - timer.totalElapsedSec)}
          label={`${template.name}${timer.timerState !== 'idle' ? ` · passo ${timer.currentStepIndex + 1}/${timer.totalSteps}` : ''}`}
        />
      </div>

      {/* Step guide */}
      {currentStep && (
        <div className="bg-warm-gray-50 border-l-4 border-sage-400 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-warm-gray-400 font-medium">Passo {timer.currentStepIndex + 1} / {timer.totalSteps}</p>
              <h3 className="font-bold text-warm-gray-900 text-lg leading-tight">{currentStep.title}</h3>
            </div>
            {hasMantra && (
              <button
                onClick={() => setShowMantraInfo(!showMantraInfo)}
                className="p-2 rounded-xl hover:bg-warm-gray-100 text-warm-gray-400 transition-colors"
                title="Info mantra"
              >
                <Info size={16} />
              </button>
            )}
          </div>

          {guideTextEnabled && currentStep.text && (
            <p className="text-sm text-warm-gray-600 leading-relaxed">{currentStep.text}</p>
          )}

          {hasMantra && timer.timerState !== 'idle' && (
            <MantraDisplay
              mantraKey={currentStep.mantra!}
              words={timer.words}
              wordIndex={timer.wordIndex}
              currentRep={timer.currentRep}
              targetReps={timer.targetReps}
              breathState={timer.breathState}
              breathSyncEnabled={breathSyncEnabled}
              showInfo={showMantraInfo}
            />
          )}

          {!hasMantra && mode === 'secular' && timer.timerState === 'running' && breathSyncEnabled && (
            <div className="flex items-center justify-center gap-3 py-3 bg-sage-50 rounded-xl">
              <span className="text-warm-gray-500 text-sm">Respira naturalmente e osserva</span>
            </div>
          )}
        </div>
      )}

      {/* Next step preview */}
      {nextStep && timer.timerState === 'running' && (
        <div className="flex items-center gap-2 text-xs text-warm-gray-400 px-2">
          <ChevronRight size={12} />
          <span>Prossimo: <strong>{nextStep.title}</strong></span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {timer.timerState === 'idle' && (
          <button onClick={timer.start} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Play size={18} /> Avvia
          </button>
        )}
        {timer.timerState === 'running' && (
          <button onClick={timer.pause} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Pause size={18} /> Pausa
          </button>
        )}
        {timer.timerState === 'paused' && (
          <button onClick={timer.resume} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Play size={18} /> Riprendi
          </button>
        )}
        {timer.timerState !== 'idle' && (
          <button onClick={timer.reset} className="btn-secondary px-4 flex items-center justify-center gap-1" title="Reset">
            <RotateCcw size={16} />
          </button>
        )}
        {timer.timerState !== 'idle' && (
          <button onClick={handleStop} className="bg-red-50 text-red-500 hover:bg-red-100 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1" title="Interrompi">
            <Square size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
