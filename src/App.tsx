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
  HeartPulse,
  Dumbbell,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppTab } from './contexts/AppContext';
import { BrandMark } from './components/brand/BrandMark';
import { NutrizionePage } from './components/nutrizione/NutrizionePage';
import { NutritionPlanProvider } from './contexts/NutritionPlanContext';
import { CambusaApp } from './cambusa/CambusaApp';

const DESKTOP_NAV: { tab: AppTab; label: string; detail: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Jarvis', detail: 'Home e conversazione', Icon: Home },
  { tab: 'agenda', label: 'Agenda', detail: 'Caleb · Calendar', Icon: CalendarDays },
  { tab: 'salute', label: 'Salute', detail: 'Terapie e diario', Icon: HeartPulse },
  { tab: 'nutrizione', label: 'Nutrizione', detail: 'Piano e scelte quotidiane', Icon: Salad },
  { tab: 'cambusa', label: 'Cambusa', detail: 'Scorte, spesa e scadenze', Icon: Archive },
  { tab: 'movimento', label: 'Movimento', detail: 'Attività e progressi', Icon: Dumbbell },
  { tab: 'famiglia', label: 'Famiglia', detail: 'Persone e contesto', Icon: Users },
];

function DomainView({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div className="space-y-4 pb-4"><div className="page-intro"><p className="eyebrow text-sage-700">{eyebrow}</p><h1 className="section-title mt-1">{title}</h1><p className="text-sm text-warm-gray-500 mt-2">{description}</p></div>{children}</div>;
}

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
            {activeTab === 'salute' && <DomainView eyebrow="Cura personale" title="Salute" description="Terapie, diario e segnali restano separati dalle richieste generali."><AgendaPage /><DiarioPage /></DomainView>}
            {activeTab === 'movimento' && <DomainView eyebrow="Corpo e continuità" title="Movimento" description="Attività, andamento e preparazione fisica in un'unica vista."><ProgressiPage /></DomainView>}
            {activeTab === 'famiglia' && <DomainView eyebrow="Contesto personale" title="Famiglia" description="Una vista distinta dall'Agenda: Caleb resta esclusivamente Calendar."><div className="card"><p className="text-sm text-warm-gray-600">Per richieste familiari, parla con Jarvis dalla Home: identità e autorizzazioni restano gestite dal backend OpenJarvis.</p></div></DomainView>}
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
