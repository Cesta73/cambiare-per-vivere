import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, BookOpen, Moon, BarChart2, Sparkles, Zap, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { PRACTICE_TEMPLATES } from '../../lib/contemplative-data';
import { PracticeSession } from './PracticeSession';
import { StudyPage } from './StudyPage';
import { MoonPage } from './MoonPage';
import { ReflectionsPage } from './ReflectionsPage';
import { PreferencesModal } from './PreferencesModal';
import { OnboardingModal } from './OnboardingModal';

interface Props { onBack: () => void; }

export interface ContemplativePrefs {
  mode: 'secular' | 'spiritual' | 'both';
  sound_enabled: boolean;
  animations_enabled: boolean;
  breath_sync_enabled: boolean;
  mantra_enabled: boolean;
  guide_text_enabled: boolean;
  show_moon_calendar: boolean;
  streak_type: 'none' | 'consecutive_days' | 'weekly_count' | 'minutes';
}

const DEFAULT_PREFS: ContemplativePrefs = {
  mode: 'secular',
  sound_enabled: true,
  animations_enabled: true,
  breath_sync_enabled: true,
  mantra_enabled: true,
  guide_text_enabled: true,
  show_moon_calendar: false,
  streak_type: 'none',
};

type CentroSection = 'home' | 'practice' | 'study' | 'moon' | 'reflections';

const QUICK_PRACTICES = [
  { key: 'emergency1', icon: '🌀', label: '1 min', desc: 'Scarico rapido' },
  { key: 'emergency2', icon: '❤️', label: '2 min', desc: 'Ritorno al cuore' },
  { key: 'morningRapid', icon: '⚡', label: 'Mattina', desc: 'Versione veloce' },
  { key: 'eveningRapid', icon: '🌙', label: 'Sera', desc: 'Versione veloce' },
];

export function RitrovaIlCentroPage({ onBack }: Props) {
  const { user, isDemo, showToast } = useApp();
  const [section, setSection] = useState<CentroSection>('home');
  const [prefs, setPrefs] = useState<ContemplativePrefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [selectedPracticeKey, setSelectedPracticeKey] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, [user, isDemo]);

  const loadPrefs = async () => {
    if (isDemo) {
      const saved = localStorage.getItem('cpv_demo_centro_prefs');
      if (saved) {
        try { setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) }); } catch {}
      }
      setPrefsLoaded(true);
      return;
    }
    if (!user) { setPrefsLoaded(true); return; }
    const { data } = await supabase.from('contemplative_preferences').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setPrefs({
        mode: data.mode ?? 'secular',
        sound_enabled: data.sound_enabled ?? true,
        animations_enabled: data.animations_enabled ?? true,
        breath_sync_enabled: data.breath_sync_enabled ?? true,
        mantra_enabled: data.mantra_enabled ?? true,
        guide_text_enabled: data.guide_text_enabled ?? true,
        show_moon_calendar: data.show_moon_calendar ?? false,
        streak_type: data.streak_type ?? 'none',
      });
    } else {
      setShowOnboarding(true);
    }
    setPrefsLoaded(true);
  };

  const savePrefs = async (newPrefs: ContemplativePrefs) => {
    setPrefs(newPrefs);
    if (isDemo) {
      localStorage.setItem('cpv_demo_centro_prefs', JSON.stringify(newPrefs));
      return;
    }
    if (!user) return;
    await supabase.from('contemplative_preferences').upsert({ user_id: user.id, ...newPrefs }, { onConflict: 'user_id' });
    showToast('Preferenze salvate!', 'success');
  };

  const handleOnboardingComplete = async (mode: ContemplativePrefs['mode']) => {
    const newPrefs: ContemplativePrefs = { ...DEFAULT_PREFS, mode, show_moon_calendar: mode !== 'secular', mantra_enabled: mode !== 'secular' };
    await savePrefs(newPrefs);
    setShowOnboarding(false);
  };

  const startPractice = (key: string) => {
    setSelectedPracticeKey(key);
    setSection('practice');
  };

  const effectiveMode = prefs.mode === 'both' ? 'spiritual' : prefs.mode;

  if (section === 'practice' && selectedPracticeKey) {
    const template = PRACTICE_TEMPLATES.find(p => p.key === selectedPracticeKey);
    if (!template) return null;
    return (
      <PracticeSession
        template={template}
        prefs={prefs}
        effectiveMode={effectiveMode}
        onBack={() => setSection('home')}
      />
    );
  }

  if (section === 'study') return <StudyPage onBack={() => setSection('home')} />;
  if (section === 'moon') return <MoonPage onBack={() => setSection('home')} />;
  if (section === 'reflections') return <ReflectionsPage onBack={() => setSection('home')} />;

  const fullPractices = PRACTICE_TEMPLATES.filter(p => !['emergency1', 'emergency2'].includes(p.key));

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="section-title">Ritrova il centro</h1>
          <p className="text-xs text-warm-gray-400">
            Modalità: {prefs.mode === 'secular' ? 'Laica' : prefs.mode === 'spiritual' ? 'Spirituale' : 'Entrambe'}
          </p>
        </div>
        <button onClick={() => setShowPrefs(true)} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors text-warm-gray-500">
          <Settings size={20} />
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Modalità demo — i dati delle sessioni non vengono salvati permanentemente
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 text-xs text-sage-700 leading-relaxed">
        Le pratiche contemplative sono strumenti facoltativi di consapevolezza e cura personale. Non sostituiscono il supporto dei professionisti sanitari.
      </div>

      {/* Quick practices */}
      <div>
        <h2 className="font-semibold text-warm-gray-800 mb-3 px-1">Pratiche rapide</h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_PRACTICES.map(p => (
            <button
              key={p.key}
              onClick={() => startPractice(p.key)}
              className="card text-left hover:bg-sage-50 hover:border-sage-200 transition-all active:scale-98"
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <p className="font-semibold text-warm-gray-800 text-sm">{p.desc}</p>
              <p className="text-xs text-warm-gray-400 mt-0.5">{p.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Full practices */}
      <div>
        <h2 className="font-semibold text-warm-gray-800 mb-3 px-1">Pratiche guidate</h2>
        <div className="space-y-2">
          {fullPractices.map(p => (
            <button
              key={p.key}
              onClick={() => startPractice(p.key)}
              className="w-full card flex items-center gap-4 text-left hover:bg-warm-gray-50 hover:border-warm-gray-200 transition-all active:scale-99"
            >
              <div className="w-11 h-11 bg-sage-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-sage-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-warm-gray-800">
                  {prefs.mode === 'secular' && p.nameLaica ? p.nameLaica : p.name}
                </p>
                <p className="text-xs text-warm-gray-400 mt-0.5">{p.durationLabel} · {p.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation to sub-sections */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSection('reflections')}
          className="card flex flex-col items-center gap-2 hover:bg-warm-gray-50 transition-all py-4"
        >
          <BarChart2 size={22} className="text-petrol-500" />
          <span className="text-xs font-semibold text-warm-gray-700">Riflessioni</span>
        </button>
        {(prefs.mode === 'spiritual' || prefs.mode === 'both') && (
          <>
            <button
              onClick={() => setSection('study')}
              className="card flex flex-col items-center gap-2 hover:bg-warm-gray-50 transition-all py-4"
            >
              <BookOpen size={22} className="text-amber-600" />
              <span className="text-xs font-semibold text-warm-gray-700">Studio</span>
            </button>
            {prefs.show_moon_calendar && (
              <button
                onClick={() => setSection('moon')}
                className="card flex flex-col items-center gap-2 hover:bg-warm-gray-50 transition-all py-4"
              >
                <Moon size={22} className="text-petrol-600" />
                <span className="text-xs font-semibold text-warm-gray-700">Calendario</span>
              </button>
            )}
          </>
        )}
      </div>

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} onSkip={() => setShowOnboarding(false)} />
      )}
      {showPrefs && (
        <PreferencesModal
          prefs={prefs}
          onSave={newPrefs => { savePrefs(newPrefs); setShowPrefs(false); }}
          onClose={() => setShowPrefs(false)}
        />
      )}
    </div>
  );
}
