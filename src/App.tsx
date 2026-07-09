import { AppProvider, useApp } from './contexts/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Onboarding } from './components/auth/Onboarding';
import { BottomNav } from './components/layout/BottomNav';
import { OggiPage } from './components/oggi/OggiPage';
import { DiarioPage } from './components/diario/DiarioPage';
import { AgendaPage } from './components/agenda/AgendaPage';
import { RawDataPage } from './components/raw-data/RawDataPage';
import { ProgressiPage } from './components/progressi/ProgressiPage';
import { AltroPage } from './components/altro/AltroPage';
import { CamminoPage } from './components/cammino/CamminoPage';
import { RitrovaIlCentroPage } from './components/centro/RitrovaIlCentroPage';
import { ToastContainer } from './components/ui/Toast';
import { ReminderWatcher } from './components/reminders/ReminderWatcher';
import {
  BookOpen,
  CalendarDays,
  HeartPulse,
  Home,
  Database,
  MoreHorizontal,
  Moon,
  Route,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppTab } from './contexts/AppContext';

const DESKTOP_NAV: { tab: AppTab; label: string; detail: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Oggi', detail: 'Bussola quotidiana', Icon: Home },
  { tab: 'diario', label: 'Diario', detail: 'Riflessioni e continuità', Icon: BookOpen },
  { tab: 'agenda', label: 'Agenda', detail: 'Impegni, turni e terapie', Icon: CalendarDays },
  { tab: 'progressi', label: 'Progressi', detail: 'Andamento e segnali', Icon: TrendingUp },
  { tab: 'cammino', label: 'Cammino', detail: 'Verso Santiago 2027', Icon: Route },
  { tab: 'dharma', label: 'Dharma', detail: 'Pratica e presenza', Icon: Moon },
  { tab: 'raw-data', label: 'Dati grezzi', detail: 'Controllo registrazioni', Icon: Database },
  { tab: 'altro', label: 'Altro', detail: 'Strumenti e impostazioni', Icon: MoreHorizontal },
];

function DesktopSidebar() {
  const { activeTab, setActiveTab, profile } = useApp();

  return (
    <aside className="hidden lg:flex sticky top-6 h-[calc(100dvh-3rem)] flex-col rounded-[2rem] bg-petrol-900/95 border border-amber-100/10 shadow-2xl shadow-petrol-900/20 overflow-hidden">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/jarvis-emblem.png" alt="" className="w-12 h-12 rounded-full ring-1 ring-amber-200/40 shadow-lg" />
          <div className="min-w-0">
            <p className="font-display text-xl text-cream-50 leading-none">Jarvis</p>
            <p className="eyebrow text-sage-300 mt-2">Cambiare per vivere</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-white/7 border border-white/10 p-3">
          <p className="text-xs text-sage-200">Spazio personale</p>
          <p className="text-sm font-semibold text-cream-50 mt-1 truncate">{profile?.display_name ?? 'Gianluca'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {DESKTOP_NAV.map(({ tab, label, detail, Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                active
                  ? 'bg-white/10 text-amber-100 shadow-inner'
                  : 'text-sage-200 hover:bg-white/6 hover:text-cream-50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                active ? 'bg-gradient-to-br from-amber-200 to-amber-500 text-petrol-900' : 'bg-white/7 text-sage-200'
              }`}>
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-[10px] text-sage-400 truncate">{detail}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="rounded-2xl bg-white/7 border border-white/10 p-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sage-300 shadow-[0_0_0_5px_rgba(161,199,183,0.13)]" />
            <p className="text-xs font-semibold text-cream-50">Jarvis è presente</p>
          </div>
          <p className="text-[11px] leading-relaxed text-sage-300 mt-2">
            La versione Mac ora respira di più: navigazione laterale, spazio largo e meno effetto “telefono gigante”.
          </p>
        </div>
      </div>
    </aside>
  );
}

function DesktopRightRail() {
  const { setActiveTab, openJarvisCore } = useApp();

  return (
    <aside className="hidden 2xl:block sticky top-6 h-[calc(100dvh-3rem)] overflow-y-auto space-y-4">
      <button
        type="button"
        onClick={openJarvisCore}
        className="card w-full text-left hover:border-sage-200 hover:shadow-xl transition-all active:scale-99"
        aria-label="Apri Jarvis Core"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-amber-600" />
          <h2 className="font-display text-xl text-petrol-900">Jarvis 3.0</h2>
        </div>
        <p className="text-sm text-warm-gray-600 leading-relaxed">
          Chat diretta con il Core: stessa memoria, stesso contesto, una sola voce.
        </p>
      </button>

      <section className="card bg-gradient-to-br from-white to-sage-50 border-sage-200">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse size={18} className="text-sage-700" />
          <h2 className="font-semibold text-warm-gray-800">Presenza quotidiana</h2>
        </div>
        <div className="space-y-3 text-sm">
          <button onClick={() => setActiveTab('raw-data')} className="w-full text-left rounded-2xl bg-white/70 border border-sage-100 p-3 hover:bg-white transition-colors">
            <p className="font-semibold text-warm-gray-800">Controlla i dati</p>
            <p className="text-xs text-warm-gray-500 mt-1">Vedi cosa è stato salvato da Jarvis.</p>
          </button>
          <button onClick={() => setActiveTab('cammino')} className="w-full text-left rounded-2xl bg-white/70 border border-sage-100 p-3 hover:bg-white transition-colors">
            <p className="font-semibold text-warm-gray-800">Cammino & attività</p>
            <p className="text-xs text-warm-gray-500 mt-1">Preparazione graduale a Compostela.</p>
          </button>
          <button onClick={() => setActiveTab('dharma')} className="w-full text-left rounded-2xl bg-white/70 border border-sage-100 p-3 hover:bg-white transition-colors">
            <p className="font-semibold text-warm-gray-800">Dharma</p>
            <p className="text-xs text-warm-gray-500 mt-1">Pratiche brevi quando serve.</p>
          </button>
        </div>
      </section>

      <section className="card bg-petrol-900 text-white border-white/10">
        <p className="eyebrow text-amber-200">Obiettivo lungo</p>
        <h2 className="font-display text-2xl mt-2">Compostela · Aprile 2027</h2>
        <p className="text-sm text-sage-200 leading-relaxed mt-3">
          Ogni camminata utile, ogni scelta alimentare sensata e ogni giorno registrato costruiscono il percorso.
        </p>
      </section>
    </aside>
  );
}

function AppContent() {
  const { user, profile, isDemo, isLoading, activeTab, setActiveTab } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen app-backdrop flex items-center justify-center">
        <div className="text-center">
          <img src="/jarvis-emblem.png" alt="" className="w-20 h-20 rounded-full mx-auto mb-4 animate-pulse shadow-2xl" />
          <p className="text-petrol-800 text-sm font-medium tracking-wide">Sto preparando il tuo spazio...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }
  if (!profile) {
    return (
      <>
        <Onboarding />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen app-backdrop app-shell">
      <div className="ambient-orb ambient-orb-one" aria-hidden="true" />
      <div className="ambient-orb ambient-orb-two" aria-hidden="true" />
      <div className="relative z-10 lg:grid lg:grid-cols-[15rem_minmax(0,48rem)] 2xl:grid-cols-[15rem_minmax(0,48rem)_19rem] lg:justify-center lg:items-start lg:gap-6 lg:px-6 lg:py-6">
        <DesktopSidebar />
        <main className="app-main max-w-lg mx-auto px-4 pt-5 pb-28 lg:max-w-none lg:w-full lg:px-0 lg:pt-0 lg:pb-6">
          {activeTab === 'oggi' && <OggiPage />}
          {activeTab === 'diario' && <DiarioPage />}
          {activeTab === 'agenda' && <AgendaPage />}
          {activeTab === 'raw-data' && <RawDataPage />}
          {activeTab === 'progressi' && <ProgressiPage />}
          {activeTab === 'altro' && <AltroPage />}
          {activeTab === 'cammino' && <CamminoPage onBack={() => setActiveTab('oggi')} />}
          {activeTab === 'dharma' && <RitrovaIlCentroPage onBack={() => setActiveTab('oggi')} />}
        </main>
        <DesktopRightRail />
      </div>
      <BottomNav />
      <ToastContainer />
      <ReminderWatcher />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
