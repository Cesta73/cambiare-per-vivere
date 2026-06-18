import { AppProvider, useApp } from './contexts/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Onboarding } from './components/auth/Onboarding';
import { BottomNav } from './components/layout/BottomNav';
import { OggiPage } from './components/oggi/OggiPage';
import { SettimanaPage } from './components/settimana/SettimanaPage';
import { DiarioPage } from './components/diario/DiarioPage';
import { ProgressiPage } from './components/progressi/ProgressiPage';
import { AltroPage } from './components/altro/AltroPage';
import { CamminoPage } from './components/cammino/CamminoPage';
import { RitrovaIlCentroPage } from './components/centro/RitrovaIlCentroPage';
import { ToastContainer } from './components/ui/Toast';
import { ReminderWatcher } from './components/reminders/ReminderWatcher';
import { RegistroPage } from './components/registro/RegistroPage';

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
      <main className="app-main max-w-lg mx-auto px-4 pt-5 pb-28 relative z-10">
        {activeTab === 'oggi' && <OggiPage />}
        {activeTab === 'registro' && <RegistroPage />}
        {activeTab === 'settimana' && <SettimanaPage />}
        {activeTab === 'diario' && <DiarioPage />}
        {activeTab === 'progressi' && <ProgressiPage />}
        {activeTab === 'altro' && <AltroPage />}
        {activeTab === 'cammino' && <CamminoPage onBack={() => setActiveTab('oggi')} />}
        {activeTab === 'dharma' && <RitrovaIlCentroPage onBack={() => setActiveTab('oggi')} />}
      </main>
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
