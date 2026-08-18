import {
  Bus,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';

import { Header } from './Header';
import { LineFilter } from './LineFilter';
import { LineList } from './LineList';
import { StopCard } from './StopCard';
import { TripPlanner } from './TripPlanner';

import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({
  mode = 'desktop',
}: SidebarProps) {
  const {
    language,
    lines,
    filteredStops,
    selectedStop,
    stopName,
  } = useBusData();

  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const setSelectedStopId = useAppStore(
    (s) => s.setSelectedStopId,
  );

  const requestFlyToStop = useAppStore(
    (s) => s.requestFlyToStop,
  );

  const setUserLocation = useAppStore(
    (s) => s.setUserLocation,
  );

  const activeTab = useAppStore(
    (s) => s.activeTab,
  );

  const setActiveTab = useAppStore(
    (s) => s.setActiveTab,
  );

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

        locate: 'Saját helyzet',
        locateError: 'Nem sikerült meghatározni a helyzetet',
      }
    : {
        tabStops: 'Stații',
        tabLines: 'Linii',
        tabPlanner: 'Traseu',

        searchStops: 'Caută stație…',
        searchLines: 'Caută linie…',

        all: 'Toate',

        stops: 'Stații',

        locate: 'Locația mea',
        locateError: 'Nu s-a putut determina locația',
      };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      window.alert(t.locateError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => window.alert(t.locateError),
      {
        enableHighAccuracy: true,
        timeout: 10_000,
      },
    );
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
            onClick={() => setActiveTab('stops')}
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

      {/* Search */}
      {activeTab !== 'planner' && (
        <div className="space-y-3 border-b border-[var(--border)] bg-white px-4 py-3.5">
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
            <>
              <LineFilter
                lines={lines}
                allLabel={t.all}
              />

              <button
                type="button"
                onClick={handleLocate}
                className="
                  inline-flex w-full items-center
                  justify-center gap-2
                  rounded-xl border
                  border-[var(--border)]
                  bg-white
                  px-3 py-2.5
                  text-xs font-bold
                  text-[var(--text-h)]
                  transition
                  hover:border-[var(--brand)]
                  hover:bg-[var(--brand-soft)]
                  hover:text-[var(--brand)]
                "
              >
                <LocateFixed className="h-4 w-4" />

                {t.locate}
              </button>
            </>
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
                const isLineActive = selectedLineId !== null;
                const isFirst = isLineActive && idx === 0;
                const isLast = isLineActive && idx === filteredStops.length - 1;
                const activeLine = selectedLineId ? lines.find((l) => l.id === selectedLineId) : null;

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
                      {/* Step number badge when line is filtered, or line dots */}
                      {isLineActive ? (
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs transition group-hover:scale-105 ${
                            isFirst
                              ? 'ring-2 ring-emerald-500'
                              : isLast
                                ? 'ring-2 ring-rose-500'
                                : ''
                          }`}
                          style={{
                            backgroundColor: activeLine?.color ?? 'var(--brand)',
                          }}
                        >
                          {idx + 1}
                        </span>
                      ) : (
                        <span
                          className="flex w-4 shrink-0 gap-1"
                          aria-hidden
                        >
                          {stop.lineIds.map((lid) => {
                            const line = lines.find(
                              (l) => l.id === lid,
                            );

                            if (!line) return null;

                            return (
                              <span
                                key={lid}
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    line.color,
                                }}
                              />
                            );
                          })}
                        </span>
                      )}

                      {/* Stop */}
                      <span
                        className={`
                          truncate text-sm font-semibold
                          ${
                            active
                              ? 'text-[var(--brand)]'
                              : 'text-[var(--text-h)]'
                          }
                        `}
                      >
                        {stopName(stop)}
                      </span>

                      {/* Endpoint badges */}
                      {isFirst && (
                        <span className="ml-auto rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0">
                          {language === 'hu' ? 'Start' : 'Plecare'}
                        </span>
                      )}
                      {isLast && (
                        <span className="ml-auto rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0">
                          {language === 'hu' ? 'Cél' : 'Sosire'}
                        </span>
                      )}

                      {active && !isFirst && !isLast && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
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
