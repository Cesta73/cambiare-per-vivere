import { useState } from 'react';
import { Database, CalendarRange } from 'lucide-react';
import { RegistroPage } from '../registro/RegistroPage';
import { SettimanaPage } from '../settimana/SettimanaPage';

type RawSection = 'registrazioni' | 'pianificazione';

export function RawDataPage() {
  const [section, setSection] = useState<RawSection>('registrazioni');

  return (
    <div className="space-y-4 pb-4">
      <div className="page-intro">
        <p className="eyebrow text-sage-700">Strumenti di controllo</p>
        <h1 className="section-title mt-1">Dati grezzi</h1>
        <p className="text-sm text-warm-gray-500 mt-2">
          Qui trovi ciò che Jarvis ha salvato e la pianificazione tecnica. L’esperienza quotidiana resta nelle pagine Oggi, Diario e Agenda.
        </p>
      </div>

      <div className="segmented-control grid grid-cols-2 gap-1 bg-warm-gray-100 rounded-xl p-1">
        <button onClick={() => setSection('registrazioni')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold ${section === 'registrazioni' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
          <Database size={16} /> Registrazioni
        </button>
        <button onClick={() => setSection('pianificazione')} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold ${section === 'pianificazione' ? 'bg-white text-sage-700 shadow-sm' : 'text-warm-gray-500'}`}>
          <CalendarRange size={16} /> Piano e turni
        </button>
      </div>

      <div className="raw-data-embedded">
        {section === 'registrazioni' ? <RegistroPage compact /> : <SettimanaPage compact />}
      </div>
    </div>
  );
}
