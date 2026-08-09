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
  Archive,
  CalendarDays,
  Home,
  Database,
  MoreHorizontal,
  Moon,
  Route,
  Salad,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppTab } from './contexts/AppContext';
import { BrandMark } from './components/brand/BrandMark';
import { NutrizionePage } from './components/nutrizione/NutrizionePage';
import { NutritionPlanProvider } from './contexts/NutritionPlanContext';
import { CambusaApp } from './cambusa/CambusaApp';

const DESKTOP_NAV: { tab: AppTab; label: string; detail: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Oggi', detail: 'Bussola quotidiana', Icon: Home },
  { tab: 'nutrizione', label: 'Nutrizione', detail: 'Piano e scelte quotidiane', Icon: Salad },
  { tab: 'cambusa', label: 'Cambusa', detail: 'Scorte, spesa e scadenze', Icon: Archive },
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
    <aside className="desktop-sidebar hidden lg:flex sticky top-0 h-dvh flex-col overflow-hidden">
      <div className="jarvis-sidebar-brand">
        <div className="flex items-center gap-3">
          <BrandMark className="w-10 h-10" />
          <div className="min-w-0">
            <p className="jarvis-wordmark">JARVIS</p>
          </div>
        </div>
        <p className="jarvis-sidebar-person">{profile?.display_name ?? 'Gianluca'}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {DESKTOP_NAV.map(({ tab, label, detail, Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`jarvis-sidebar-link ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="jarvis-sidebar-icon"><Icon size={18} strokeWidth={1.45} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-[10px] jarvis-muted truncate">{detail}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="jarvis-sidebar-presence">
        <span className="jarvis-presence-dot" />
        <span>Jarvis è presente</span>
      </div>
    </aside>
  );
}

function AppContent() {
  const { user, profile, isDemo, isLoading, activeTab, setActiveTab } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen app-backdrop flex items-center justify-center">
        <div className="text-center">
          <BrandMark className="w-20 h-20 mx-auto mb-4" title="Jarvis" />
          <p className="jarvis-muted text-sm">Sto preparando il tuo spazio…</p>
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
      <div className="relative z-10 lg:grid lg:grid-cols-[13.5rem_minmax(0,64rem)] lg:justify-center lg:items-start">
        <DesktopSidebar />
        <main className="app-main w-full max-w-lg mx-auto px-0 pt-0 pb-24 lg:max-w-none lg:px-10 lg:py-10 lg:pb-10">
          <div className={`workspace-view workspace-view-${activeTab}`}>
            {activeTab === 'oggi' && <OggiPage />}
            {activeTab === 'nutrizione' && <NutrizionePage />}
            {activeTab === 'cambusa' && <CambusaApp embedded />}
            {activeTab === 'diario' && <DiarioPage />}
            {activeTab === 'agenda' && <AgendaPage />}
            {activeTab === 'raw-data' && <RawDataPage />}
            {activeTab === 'progressi' && <ProgressiPage />}
            {activeTab === 'altro' && <AltroPage />}
            {activeTab === 'cammino' && <CamminoPage onBack={() => setActiveTab('oggi')} />}
            {activeTab === 'dharma' && <RitrovaIlCentroPage onBack={() => setActiveTab('oggi')} />}
          </div>
        </main>
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
      <NutritionPlanProvider>
        <AppContent />
      </NutritionPlanProvider>
    </AppProvider>
  );
}
