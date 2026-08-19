import { Bus, Calendar, Compass, LayoutDashboard, Map } from 'lucide-react';
import { useAppStore, type ActiveTab } from '../store/useAppStore';

export function BottomNavBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const language = useAppStore((s) => s.language);
  const hu = language === 'hu';

  const navItems: {
    id: ActiveTab;
    labelHu: string;
    labelRo: string;
    icon: typeof Bus;
  }[] = [
    {
      id: 'dashboard',
      labelHu: 'Kezdőlap',
      labelRo: 'Acasă',
      icon: LayoutDashboard,
    },
    {
      id: 'lines',
      labelHu: 'Járatok',
      labelRo: 'Linii',
      icon: Bus,
    },
    {
      id: 'schedules',
      labelHu: 'Menetrend',
      labelRo: 'Orar',
      icon: Calendar,
    },
    {
      id: 'planner',
      labelHu: 'Tervező',
      labelRo: 'Traseu',
      icon: Compass,
    },
    {
      id: 'map',
      labelHu: 'Térkép',
      labelRo: 'Hartă',
      icon: Map,
    },
  ];

  return (
    <nav
      aria-label="Mobil navigáció"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t-2 border-[#DDE1D6] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[calc(0.4rem+env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`
                flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer select-none min-h-[56px]
                ${
                  isActive
                    ? 'bg-[#657933] text-white shadow-sm font-black scale-102'
                    : 'text-[#505747] hover:text-[#191d15] hover:bg-[#ecefe2] font-bold'
                }
              `}
            >
              <Icon
                className={`h-5 w-5 mb-1 transition-transform ${
                  isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[2px]'
                }`}
              />
              <span className="text-[11px] leading-tight tracking-tight whitespace-nowrap">
                {hu ? item.labelHu : item.labelRo}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
