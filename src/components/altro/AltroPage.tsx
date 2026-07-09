import { useState } from 'react';
import {
  ShoppingCart, Pill, User, FileText, ChevronRight,
  Leaf, Info, Database
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ShoppingPage } from './ShoppingPage';
import { MedicationsPage } from './MedicationsPage';
import { ProfilePage } from './ProfilePage';
import { ReportPage } from './ReportPage';
import { JarvisCorePage } from './JarvisCorePage';

type AltroSection = null | 'jarvis-core' | 'shopping' | 'medications' | 'profile' | 'report';

export function AltroPage() {
  const { profile, isDemo, signOut, setActiveTab } = useApp();
  const [section, setSection] = useState<AltroSection>(null);

  if (section === 'jarvis-core') return <JarvisCorePage onBack={() => setSection(null)} />;
  if (section === 'shopping') return <ShoppingPage onBack={() => setSection(null)} />;
  if (section === 'medications') return <MedicationsPage onBack={() => setSection(null)} />;
  if (section === 'profile') return <ProfilePage onBack={() => setSection(null)} />;
  if (section === 'report') return <ReportPage onBack={() => setSection(null)} />;

  const menuItems = [
    {
      id: 'jarvis-core' as const,
      icon: Leaf,
      label: 'Jarvis Core',
      description: 'Conversazione diretta con Jarvis',
      color: 'bg-petrol-50 text-petrol-700',
    },
    {
      id: 'shopping' as const,
      icon: ShoppingCart,
      label: 'Lista della spesa',
      description: 'Genera e gestisci la lista settimanale',
      color: 'bg-green-50 text-green-700',
    },
    {
      id: 'medications' as const,
      icon: Pill,
      label: 'Terapie e supplementi',
      description: 'Promemoria e registro assunzioni',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'report' as const,
      icon: FileText,
      label: 'Report per i professionisti',
      description: 'Esporta i dati per il tuo team sanitario',
      color: 'bg-amber-50 text-amber-700',
    },
    {
      id: 'profile' as const,
      icon: User,
      label: 'Profilo e impostazioni',
      description: 'Personalizza l\'app',
      color: 'bg-warm-gray-50 text-warm-gray-700',
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Altro</h1>
        {profile?.display_name && (
          <div className="flex items-center gap-2 text-sage-600 text-sm font-medium">
            <Leaf size={16} />
            <span>{profile.display_name}</span>
          </div>
        )}
      </div>

      {isDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Modalità demo — Alcuni dati sono precaricati a scopo dimostrativo.
        </div>
      )}

      <div className="space-y-2">
        <button onClick={() => setActiveTab('raw-data')} className="w-full card flex items-center gap-4 hover:bg-warm-gray-50 text-left">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-petrol-50 text-petrol-700"><Database size={22} /></div>
          <div className="flex-1"><p className="font-semibold text-warm-gray-800">Dati grezzi</p><p className="text-sm text-warm-gray-500 mt-0.5">Registro Jarvis, errori, pasti e pianificazione</p></div><ChevronRight size={18} className="text-warm-gray-300" />
        </button>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className="w-full card flex items-center gap-4 hover:bg-warm-gray-50 hover:border-warm-gray-200 transition-all active:scale-99 text-left"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-warm-gray-800">{item.label}</p>
              <p className="text-sm text-warm-gray-500 mt-0.5">{item.description}</p>
            </div>
            <ChevronRight size={18} className="text-warm-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="card bg-sage-50 border-sage-200">
        <div className="flex gap-3">
          <Info size={18} className="text-sage-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-sage-700 leading-relaxed">
            Questa applicazione è uno strumento personale di organizzazione e monitoraggio. Non sostituisce le indicazioni dei professionisti sanitari.
          </p>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full text-center text-sm text-warm-gray-400 hover:text-warm-gray-600 py-3 transition-colors"
      >
        {isDemo ? 'Esci dalla modalità demo' : 'Disconnetti'}
      </button>
    </div>
  );
}
