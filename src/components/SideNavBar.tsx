import {
  CalendarClock,
  ChevronLeft,
  Compass,
  Globe,
  LayoutDashboard,
  Map as MapIcon,
  QrCode,
  Route as RouteIcon,
} from 'lucide-react';
import { useAppStore, type ActiveTab } from '../store/useAppStore';
import { SepsiBusLogo } from './SepsiBusLogo';

interface SideNavBarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function SideNavBar({ mobileOpen = false, onCloseMobile }: SideNavBarProps) {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const language = useAppStore((s) => s.language);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  const hu = language === 'hu';

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'lines',
      label: hu ? 'Járatok' : 'Linii',
      icon: RouteIcon,
    },
    {
      id: 'schedules',
      label: hu ? 'Menetrendek' : 'Orare',
      icon: CalendarClock,
    },
    {
      id: 'stops',
      label: hu ? 'Megállók' : 'Stații',
      icon: QrCode,
    },
    {
      id: 'map',
      label: hu ? 'Térkép' : 'Hartă',
      icon: MapIcon,
    },
    {
      id: 'planner',
      label: hu ? 'Útvonaltervező' : 'Planificator',
      icon: Compass,
    },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <nav
      className={`
        fixed left-0 top-0 h-full w-[280px] bg-white border-r border-[#DDE1D6]
        flex flex-col py-5 px-4 z-40 transition-transform duration-300 shadow-sm
        ${
          mobileOpen
            ? 'translate-x-0'
            : sidebarCollapsed
            ? '-translate-x-full'
            : '-translate-x-full md:translate-x-0'
        }
      `}
    >
      {/* Brand Header & Collapse Toggle */}
      <div className="flex items-center justify-between gap-2 mb-6 px-1">
        <button
          type="button"
          onClick={() => handleNavClick('dashboard')}
          className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F7F8F4] border border-[#DDE1D6] flex items-center justify-center p-1 shadow-2xs shrink-0">
            <SepsiBusLogo variant="mark" className="w-8 h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-[#657933] leading-tight truncate tracking-tight">
              Sepsi Busz
            </h1>
            <p className="text-[11px] text-[#73796D] font-bold truncate">
              {hu ? 'Sepsiszentgyörgy' : 'Sfântu Gheorghe'}
            </p>
          </div>
        </button>

        {/* Close/Collapse button */}
        <button
          type="button"
          onClick={mobileOpen && onCloseMobile ? onCloseMobile : toggleSidebar}
          className="p-1.5 rounded-lg text-[#73796D] hover:bg-[#ecefe2] hover:text-[#191d15] transition-colors cursor-pointer"
          title={hu ? 'Oldalsáv elrejtése' : 'Ascunde meniul'}
          aria-label="Oldalsáv bezárása"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold
                  transition-all duration-200 cursor-pointer active:scale-98 text-left
                  ${
                    isActive
                      ? 'bg-[#657933] text-white font-extrabold shadow-2xs hover:bg-[#526428]'
                      : 'text-[#73796D] hover:bg-[#ecefe2] hover:text-[#191d15]'
                  }
                `}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Info / Language */}
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-[#DDE1D6]">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center justify-between px-3.5 py-2.5 text-[#191d15] bg-[#ecefe2]/50 hover:bg-[#ecefe2] transition-colors rounded-xl text-xs font-bold cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#657933]" />
            <span>{hu ? 'Nyelv / Limbă' : 'Limbă / Nyelv'}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-[#657933] text-white text-[10px] font-black">
            {language.toUpperCase()}
          </span>
        </button>
      </div>
    </nav>
  );
}
