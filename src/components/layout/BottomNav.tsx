import { Sun, CalendarDays, BookOpen, TrendingUp, MoreHorizontal, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp, type AppTab } from '../../contexts/AppContext';

const NAV_ITEMS: { tab: AppTab; label: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Oggi', Icon: Sun },
  { tab: 'diario', label: 'Diario', Icon: BookOpen },
  { tab: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { tab: 'progressi', label: 'Progressi', Icon: TrendingUp },
  { tab: 'altro', label: 'Altro', Icon: MoreHorizontal },
];

export function BottomNav() {
  const { activeTab, setActiveTab, openJarvisCore } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom px-3 pb-2 pointer-events-none lg:hidden">
      <div className="bottom-dock max-w-lg mx-auto flex items-stretch px-1 py-1 pointer-events-auto">
        {NAV_ITEMS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-item flex-1 ${activeTab === tab ? 'nav-item-active' : 'nav-item-inactive'}`}
            aria-label={label}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <span className="nav-icon-frame"><Icon size={20} strokeWidth={1.9} /></span>
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        ))}
        <button type="button" onClick={openJarvisCore} className="nav-item nav-item-jarvis flex-1" aria-label="Parla con Jarvis">
          <span className="nav-icon-frame"><Sparkles size={20} strokeWidth={1.9} /></span>
          <span className="text-[10px] font-semibold tracking-wide">Jarvis</span>
        </button>
      </div>
    </nav>
  );
}
