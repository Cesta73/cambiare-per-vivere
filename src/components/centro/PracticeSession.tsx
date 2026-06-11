import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { PracticeTemplate } from '../../lib/contemplative-data';
import type { ContemplativePrefs } from './RitrovaIlCentroPage';
import { PracticePlayer } from './PracticePlayer';
import { CheckinModal } from './CheckinModal';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';

interface Props {
  template: PracticeTemplate;
  prefs: ContemplativePrefs;
  effectiveMode: 'secular' | 'spiritual';
  onBack: () => void;
}

type SessionPhase = 'checkin_before' | 'practice' | 'checkin_after' | 'done';

export function PracticeSession({ template, prefs, effectiveMode, onBack }: Props) {
  const { user, isDemo, showToast } = useApp();
  const [phase, setPhase] = useState<SessionPhase>('checkin_before');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt] = useState(new Date().toISOString());

  const startSession = async () => {
    if (!user || isDemo) {
      setSessionId('demo_session_' + Date.now());
      return;
    }
    const { data } = await supabase.from('contemplative_sessions').insert({
      user_id: user.id,
      practice_key: template.key,
      practice_name: template.name,
      mode: effectiveMode,
      planned_duration_sec: Math.round(template.durationLabel === '~1 min' ? 60 : template.durationLabel === '~2 min' ? 120 : template.durationLabel === '~5 min' ? 300 : 600),
      started_at: startedAt,
    }).select().maybeSingle();
    if (data) setSessionId(data.id);
  };

  const saveCheckin = async (phase: 'before' | 'after', data: any) => {
    if (!user || isDemo || !sessionId) return;
    await supabase.from('contemplative_checkins').insert({
      user_id: user.id,
      session_id: sessionId,
      phase,
      state_label: data.state_label,
      stress_score: data.stress_score,
      energy_score: data.energy_score,
      helpful: data.helpful,
      what_noticed: data.what_noticed,
      reason_here: data.reason_here,
      notes: data.notes,
    });
  };

  const completeSession = async (actualSec: number, completed: boolean) => {
    if (!user || isDemo || !sessionId) return;
    await supabase.from('contemplative_sessions').update({
      actual_duration_sec: actualSec,
      completed,
      ended_at: new Date().toISOString(),
    }).eq('id', sessionId);
  };

  const handleBeforeCheckin = async (data: any) => {
    await startSession();
    await saveCheckin('before', data);
    setPhase('practice');
  };

  const handleSkipBefore = async () => {
    await startSession();
    setPhase('practice');
  };

  const handlePracticeComplete = async (actualSec: number) => {
    await completeSession(actualSec, true);
    setPhase('checkin_after');
    showToast('Ottima pratica!', 'success');
  };

  const handlePracticeStop = async (actualSec: number) => {
    await completeSession(actualSec, false);
    showToast('Pratica interrotta e salvata.', 'info');
    onBack();
  };

  const handleAfterCheckin = async (data: any) => {
    await saveCheckin('after', data);
    showToast('Sessione salvata nel diario!', 'success');
    onBack();
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <div>
          <h2 className="font-bold text-warm-gray-900">{template.name}</h2>
          <p className="text-xs text-warm-gray-400">{template.durationLabel}</p>
        </div>
      </div>

      {phase === 'checkin_before' && (
        <CheckinModal
          phase="before"
          onSave={handleBeforeCheckin}
          onSkip={handleSkipBefore}
        />
      )}

      {phase === 'practice' && (
        <PracticePlayer
          template={template}
          mode={effectiveMode}
          soundEnabled={prefs.sound_enabled}
          breathSyncEnabled={prefs.breath_sync_enabled}
          mantraEnabled={prefs.mantra_enabled}
          guideTextEnabled={prefs.guide_text_enabled}
          animationsEnabled={prefs.animations_enabled}
          onComplete={handlePracticeComplete}
          onStop={handlePracticeStop}
        />
      )}

      {phase === 'checkin_after' && (
        <CheckinModal
          phase="after"
          onSave={handleAfterCheckin}
          onSkip={() => { showToast('Sessione salvata!', 'success'); onBack(); }}
        />
      )}
    </div>
  );
}
