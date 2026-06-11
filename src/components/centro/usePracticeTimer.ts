import { useState, useRef, useEffect, useCallback } from 'react';
import type { PracticeStep } from '../../lib/contemplative-data';
import { getMantraPattern, getStepDurationSec, getPracticeTotalSec } from '../../lib/contemplative-data';

export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export interface BreathState {
  phase: 'inhale' | 'hold' | 'exhale';
  instruction: string;
}

export interface PracticeTimerState {
  timerState: TimerState;
  currentStepIndex: number;
  totalSteps: number;
  stepElapsedSec: number;
  stepTotalSec: number;
  totalElapsedSec: number;
  totalSec: number;
  currentRep: number;
  targetReps: number;
  wordIndex: number;
  words: string[];
  breathState: BreathState | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function usePracticeTimer(steps: PracticeStep[], soundEnabled: boolean): PracticeTimerState {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalElapsedSec, setTotalElapsedSec] = useState(0);
  const [stepElapsedSec, setStepElapsedSec] = useState(0);
  const [currentRep, setCurrentRep] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [breathState, setBreathState] = useState<BreathState | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalElapsedRef = useRef(0);
  const stepElapsedRef = useRef(0);
  const currentStepRef = useRef(0);

  const totalSec = getPracticeTotalSec(steps);

  const playBell = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 528;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    } catch {}
  }, [soundEnabled]);

  const getBreathForMantra = useCallback((mantraKey: string, elapsed: number): BreathState => {
    const p = getMantraPattern(mantraKey);
    const cycleLen = p.inhale + p.hold + p.exhale;
    const t = elapsed % cycleLen;
    if (t < p.inhale) return { phase: 'inhale', instruction: 'Inspira' };
    if (t < p.inhale + p.hold) return { phase: 'hold', instruction: 'Trattieni' };
    return { phase: 'exhale', instruction: 'Espira' };
  }, []);

  const tick = useCallback(() => {
    totalElapsedRef.current += 1;
    stepElapsedRef.current += 1;
    const step = steps[currentStepRef.current];
    const stepTotal = getStepDurationSec(step);

    setTotalElapsedSec(totalElapsedRef.current);
    setStepElapsedSec(stepElapsedRef.current);

    if (step.mantra && step.reps) {
      const p = getMantraPattern(step.mantra);
      const cycleLen = p.inhale + p.hold + p.exhale;
      const words = step.mantra.split(/\s+/).filter(Boolean);
      const wordDuration = cycleLen / words.length;
      const repElapsed = stepElapsedRef.current % cycleLen;
      const newWordIndex = Math.min(Math.floor(repElapsed / wordDuration), words.length - 1);
      const newRep = Math.floor(stepElapsedRef.current / cycleLen);
      setWordIndex(newWordIndex);
      setCurrentRep(newRep);
      setBreathState(getBreathForMantra(step.mantra, stepElapsedRef.current));

      if (stepElapsedRef.current >= stepTotal) {
        advanceStep();
      }
    } else {
      // Non-mantra step: use fixed 10s
      if (stepElapsedRef.current >= 10) {
        advanceStep();
      }
    }

    if (totalElapsedRef.current >= totalSec) {
      finishPractice();
    }
  }, [steps, totalSec]);

  const advanceStep = () => {
    const nextIdx = currentStepRef.current + 1;
    if (nextIdx < steps.length) {
      currentStepRef.current = nextIdx;
      stepElapsedRef.current = 0;
      setCurrentStepIndex(nextIdx);
      setStepElapsedSec(0);
      setCurrentRep(0);
      setWordIndex(0);
      setBreathState(null);
    }
  };

  const finishPractice = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState('done');
    playBell();
  };

  const start = useCallback(() => {
    totalElapsedRef.current = 0;
    stepElapsedRef.current = 0;
    currentStepRef.current = 0;
    setTotalElapsedSec(0);
    setStepElapsedSec(0);
    setCurrentStepIndex(0);
    setCurrentRep(0);
    setWordIndex(0);
    setTimerState('running');
    playBell();
    intervalRef.current = setInterval(tick, 1000);
  }, [tick, playBell]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState('paused');
  }, []);

  const resume = useCallback(() => {
    setTimerState('running');
    intervalRef.current = setInterval(tick, 1000);
  }, [tick]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState('idle');
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    totalElapsedRef.current = 0;
    stepElapsedRef.current = 0;
    currentStepRef.current = 0;
    setTotalElapsedSec(0);
    setStepElapsedSec(0);
    setCurrentStepIndex(0);
    setCurrentRep(0);
    setWordIndex(0);
    setBreathState(null);
    setTimerState('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const step = steps[currentStepIndex];
  const words = step?.mantra ? step.mantra.split(/\s+/).filter(Boolean) : [];
  const stepTotalSec = getStepDurationSec(step ?? { title: '' });

  return {
    timerState,
    currentStepIndex,
    totalSteps: steps.length,
    stepElapsedSec,
    stepTotalSec,
    totalElapsedSec,
    totalSec,
    currentRep,
    targetReps: step?.reps ?? 0,
    wordIndex,
    words,
    breathState,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
