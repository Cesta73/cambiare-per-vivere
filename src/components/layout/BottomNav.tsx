import { Sun, CalendarDays, BookOpen, TrendingUp, MoreHorizontal, Salad, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp, type AppTab } from '../../contexts/AppContext';

const NAV_ITEMS: { tab: AppTab; label: string; Icon: LucideIcon }[] = [
  { tab: 'oggi', label: 'Oggi', Icon: Sun },
  { tab: 'nutrizione', label: 'Piano', Icon: Salad },
  { tab: 'cambusa', label: 'Cambusa', Icon: Archive },
  { tab: 'diario', label: 'Diario', Icon: BookOpen },
  { tab: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { tab: 'progressi', label: 'Progressi', Icon: TrendingUp },
  { tab: 'altro', label: 'Altro', Icon: MoreHorizontal },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 pointer-events-none lg:hidden">
      <div className="bottom-dock w-full mx-auto flex items-stretch px-1 py-1 pointer-events-auto">
        {NAV_ITEMS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-item flex-1 ${activeTab === tab ? 'nav-item-active' : 'nav-item-inactive'}`}
            aria-label={label}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <span className="nav-icon-frame"><Icon size={20} strokeWidth={1.9} /></span>
            <span className="min-w-0 max-w-full truncate text-[9px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
