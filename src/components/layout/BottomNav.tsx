import { Sun, CalendarDays, BookOpen, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useApp, type AppTab } from '../../contexts/AppContext';

const NAV_ITEMS: { tab: AppTab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { tab: 'oggi', label: 'Oggi', Icon: Sun },
  { tab: 'settimana', label: 'Settimana', Icon: CalendarDays },
  { tab: 'diario', label: 'Diario', Icon: BookOpen },
  { tab: 'progressi', label: 'Progressi', Icon: TrendingUp },
  { tab: 'altro', label: 'Altro', Icon: MoreHorizontal },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-gray-100 z-40 safe-bottom">
      <div className="max-w-lg mx-auto flex justify-around px-1 py-1">
        {NAV_ITEMS.map(({ tab, label, Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`nav-item flex-1 ${activeTab === tab ? 'nav-item-active' : 'nav-item-inactive'}`}
            aria-label={label}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
