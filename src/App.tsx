import { AppProvider, useApp } from './contexts/AppContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Onboarding } from './components/auth/Onboarding';
import { BottomNav } from './components/layout/BottomNav';
import { OggiPage } from './components/oggi/OggiPage';
import { SettimanaPage } from './components/settimana/SettimanaPage';
import { DiarioPage } from './components/diario/DiarioPage';
import { ProgressiPage } from './components/progressi/ProgressiPage';
import { AltroPage } from './components/altro/AltroPage';
import { ToastContainer } from './components/ui/Toast';

function AppContent() {
  const { user, profile, isDemo, isLoading, activeTab } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-sage-600 rounded-2xl mx-auto mb-4 animate-pulse" />
          <p className="text-warm-gray-500 text-sm">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) return <AuthScreen />;
  if (!profile) return <Onboarding />;

  return (
    <div className="min-h-screen bg-cream-50">
      <main className="max-w-lg mx-auto px-4 pt-6 pb-24">
        {activeTab === 'oggi' && <OggiPage />}
        {activeTab === 'settimana' && <SettimanaPage />}
        {activeTab === 'diario' && <DiarioPage />}
        {activeTab === 'progressi' && <ProgressiPage />}
        {activeTab === 'altro' && <AltroPage />}
      </main>
      <BottomNav />
      <ToastContainer />
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
