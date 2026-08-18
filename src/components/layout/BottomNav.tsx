import { Home, CalendarDays, HeartPulse, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp, type AppTab } from '../../contexts/AppContext';

const NAV_ITEMS: { tab: AppTab; label: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Home', Icon: Home },
  { tab: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { tab: 'salute', label: 'Salute', Icon: HeartPulse },
  { tab: 'nutrizione', label: 'Altro', Icon: MoreHorizontal },
];

export function BottomNav() {
  const { activeTab, setActiveTab, openJarvisCore } = useApp();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 pointer-events-none lg:hidden">
      <div className="bottom-dock w-full mx-auto flex items-stretch px-1 py-1 pointer-events-auto">
        <button onClick={() => setActiveTab('oggi')} className={`nav-item flex-1 ${activeTab === 'oggi' ? 'nav-item-active' : 'nav-item-inactive'}`} aria-label="Home" aria-current={activeTab === 'oggi' ? 'page' : undefined}>
          <span className="nav-icon-frame"><Home size={20} strokeWidth={1.5} /></span>
          <span>Home</span>
        </button>
        <button onClick={openJarvisCore} className="nav-item nav-item-talk flex-1 nav-item-inactive" aria-label="Parla con Jarvis">
          <span className="nav-icon-frame"><MessageCircle size={20} strokeWidth={1.5} /></span>
          <span>Parla</span>
        </button>
        {NAV_ITEMS.map(({ tab, label, Icon }) => (
          tab !== 'oggi' &&
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-item flex-1 ${activeTab === tab ? 'nav-item-active' : 'nav-item-inactive'}`}
            aria-label={label}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <span className="nav-icon-frame"><Icon size={20} strokeWidth={1.5} /></span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
