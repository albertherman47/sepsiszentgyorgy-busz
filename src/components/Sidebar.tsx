import { useState } from 'react';
import {
  ArrowLeft,
  Bus,
  ChevronDown,
  ChevronUp,
  Filter,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';

import { Header } from './Header';
import { LineList } from './LineList';
import { StopCard } from './StopCard';
import { TripPlanner } from './TripPlanner';

import { useBusData } from '../hooks/useBusData';
import { useLocateUser } from '../hooks/useLocateUser';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({
  mode = 'desktop',
}: SidebarProps) {
  const {
    language,
    filteredStops,
    selectedStop,
    stopName,
  } = useBusData();

  const { isLocating, locateUser } = useLocateUser();

  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const setSelectedStopId = useAppStore(
    (s) => s.setSelectedStopId,
  );

  const setSelectedLineId = useAppStore(
    (s) => s.setSelectedLineId,
  );

  const requestFlyToStop = useAppStore(
    (s) => s.requestFlyToStop,
  );

  const activeTab = useAppStore(
    (s) => s.activeTab,
  );

  const setActiveTab = useAppStore(
    (s) => s.setActiveTab,
  );

  const [mobileFilterCollapsed, setMobileFilterCollapsed] = useState(false);

  const hu = language === 'hu';

  const t = hu
    ? {
        tabStops: 'Megállók',
        tabLines: 'Járatok',
        tabPlanner: 'Tervezés',

        searchStops: 'Megálló keresése…',
        searchLines: 'Járat keresése…',

        all: 'Összes',

        stops: 'Megállók',

        locate: isLocating ? 'Helyzet meghatározása…' : 'Saját helyzet',
        filterToggleShow: 'Keresés megjelenítése',
        filterToggleHide: 'Keresés elrejtése',
        backToList: 'Vissza a megállókhoz',
      }
    : {
        tabStops: 'Stații',
        tabLines: 'Linii',
        tabPlanner: 'Traseu',

        searchStops: 'Caută stație…',
        searchLines: 'Caută linie…',

        all: 'Toate',

        stops: 'Stații',

        locate: isLocating ? 'Determinare locație…' : 'Locația mea',
        filterToggleShow: 'Afișează căutarea',
        filterToggleHide: 'Ascunde căutarea',
        backToList: 'Înapoi la stații',
      };

  const handleStopClick = (stopId: string) => {
    setSelectedStopId(stopId);
    requestFlyToStop(stopId);
  };

  return (
    <aside
      className={`
        flex h-full min-h-0 flex-col bg-[var(--panel)]
        ${
          mode === 'desktop'
            ? 'w-[370px] shrink-0 border-r border-[var(--border)] shadow-[10px_0_30px_rgba(15,35,55,0.05)]'
            : 'w-full'
        }
      `}
    >
      <Header />

      {/* Navigation */}
      <div className="border-b border-[var(--border)] px-4 pb-3 pt-3">
        <div className="flex rounded-xl bg-[var(--surface)] p-1">
          {/* Stops */}
          <button
            type="button"
            onClick={() => {
              setSelectedLineId(null);
              setActiveTab('stops');
            }}
            className={`
              flex flex-1 items-center justify-center gap-1.5
              rounded-lg py-2.5 text-xs font-bold
              transition-all
              ${
                activeTab === 'stops'
                  ? 'bg-white text-[var(--text-h)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }
            `}
          >
            <MapPin className="h-3.5 w-3.5" />

            {t.tabStops}
          </button>

          {/* Lines */}
          <button
            type="button"
            onClick={() => setActiveTab('lines')}
            className={`
              flex flex-1 items-center justify-center gap-1.5
              rounded-lg py-2.5 text-xs font-bold
              transition-all
              ${
                activeTab === 'lines'
                  ? 'bg-white text-[var(--text-h)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }
            `}
          >
            <Bus className="h-3.5 w-3.5" />

            {t.tabLines}
          </button>

          {/* Planner */}
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`
              flex flex-1 items-center justify-center gap-1.5
              rounded-lg py-2.5 text-xs font-bold
              transition-all
              ${
                activeTab === 'planner'
                  ? 'bg-white text-[var(--text-h)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }
            `}
          >
            <Navigation className="h-3.5 w-3.5" />

            {t.tabPlanner}
          </button>
        </div>
      </div>

      {/* Mobile back bar when stop is selected */}
      {mode === 'mobile' && selectedStop && activeTab !== 'planner' && (
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--brand-soft)]/50 px-3.5 py-2">
          <button
            type="button"
            onClick={() => setSelectedStopId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[var(--brand)] active:scale-95 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.backToList}</span>
          </button>

          <span className="truncate text-[10px] font-bold text-[var(--text-muted)] max-w-[150px]">
            {stopName(selectedStop)}
          </span>
        </div>
      )}

      {/* Search & Filters */}
      {activeTab !== 'planner' && (!selectedStop || mode === 'desktop') && (
        <div className="border-b border-[var(--border)] bg-white">
          {/* Mobile Collapsible Header */}
          {mode === 'mobile' && (
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface)]/70 border-b border-[var(--border)]/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {hu ? 'Keresés' : 'Căutare'}
              </span>

              <button
                type="button"
                onClick={() => setMobileFilterCollapsed((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand)]"
              >
                <span>{mobileFilterCollapsed ? t.filterToggleShow : t.filterToggleHide}</span>
                {mobileFilterCollapsed ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}

          {(!mobileFilterCollapsed || mode === 'desktop') && (
            <div className="space-y-3 px-4 py-3.5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden
                />

                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder={
                    activeTab === 'stops'
                      ? t.searchStops
                      : t.searchLines
                  }
                  className="
                    w-full rounded-xl
                    border border-transparent
                    bg-[var(--surface)]
                    py-2.5 pl-10 pr-3
                    text-sm font-medium
                    text-[var(--text-h)]
                    placeholder:text-[var(--text-muted)]
                    outline-none
                    transition
                    focus:border-[var(--brand)]
                    focus:bg-white
                    focus:ring-4
                    focus:ring-[var(--brand)]/10
                  "
                />
              </div>

              {activeTab === 'stops' && (
                <button
                  type="button"
                  onClick={locateUser}
                  disabled={isLocating}
                  className={`
                    inline-flex w-full items-center
                    justify-center gap-2
                    rounded-xl border
                    border-[var(--border)]
                    bg-white
                    px-3 py-2.5
                    text-xs font-bold
                    transition active:scale-[0.99]
                    ${
                      isLocating
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]'
                        : 'text-[var(--text-h)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]'
                    }
                  `}
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
                  ) : (
                    <LocateFixed className="h-4 w-4 text-[var(--brand)]" />
                  )}

                  {t.locate}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={`
          min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]
          ${
            mode === 'mobile' &&
            selectedStop &&
            activeTab !== 'planner'
              ? 'hidden'
              : ''
          }
        `}
      >
        {activeTab === 'planner' ? (
          <TripPlanner />
        ) : activeTab === 'lines' ? (
          <LineList />
        ) : (
          <>
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t.stops}
              </span>

              <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[10px] font-bold tabular-nums text-[var(--text-muted)]">
                {filteredStops.length}
              </span>
            </div>

            <ul className="pb-3">
              {filteredStops.map((stop, idx) => {
                const active =
                  selectedStop?.id === stop.id;

                return (
                  <li key={`${stop.id}-${idx}`}>
                    <button
                      type="button"
                      onClick={() =>
                        handleStopClick(stop.id)
                      }
                      className={`
                        group flex w-full items-center
                        gap-3 px-4 py-2.5 text-left
                        transition
                        ${
                          active
                            ? 'bg-[var(--brand-soft)]'
                            : 'hover:bg-[var(--surface)]'
                        }
                      `}
                    >
                      <div
                        className={`
                          flex h-7 w-7 shrink-0 items-center justify-center
                          rounded-xl transition-all
                          ${
                            active
                              ? 'bg-[var(--brand)] text-white shadow-xs'
                              : 'bg-[var(--surface)] text-[var(--text-muted)] group-hover:bg-white group-hover:text-[var(--brand)]'
                          }
                        `}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </div>

                      {/* Stop */}
                      <span
                        className={`
                          truncate text-sm font-semibold
                          ${
                            active
                              ? 'text-[var(--brand)] font-bold'
                              : 'text-[var(--text-h)]'
                          }
                        `}
                      >
                        {stopName(stop)}
                      </span>

                      {active && (
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Stop detail */}
      {activeTab !== 'planner' &&
        (mode === 'desktop' || selectedStop) && (
          <div
            className={`
              shrink-0 border-t border-[var(--border)]
              bg-white
              ${
                mode === 'desktop'
                  ? 'h-[43%]'
                  : 'min-h-0 flex-1 overflow-hidden'
              }
            `}
          >
            <StopCard
              variant={
                mode === 'mobile'
                  ? 'drawer'
                  : 'panel'
              }
            />
          </div>
        )}
    </aside>
  );
}
