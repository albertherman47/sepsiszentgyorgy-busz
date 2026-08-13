import { Bus, LocateFixed, MapPin, Navigation, Search } from 'lucide-react';
import { Header } from './Header';
import { LineFilter } from './LineFilter';
import { LineList } from './LineList';
import { StopCard } from './StopCard';
import { TripPlanner } from './TripPlanner';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

interface SidebarProps {
  /** Compact mobile sheet vs full desktop sidebar */
  mode?: 'desktop' | 'mobile';
}

export function Sidebar({ mode = 'desktop' }: SidebarProps) {
  const {
    language,
    lines,
    filteredStops,
    selectedStop,
    stopName,
  } = useBusData();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const t =
    language === 'hu'
      ? {
          tabStops: 'Megállók',
          tabLines: 'Buszjáratok',
          tabPlanner: 'Tervezés',
          searchStops: 'Megálló keresése…',
          searchLines: 'Járat keresése (pl. 1, 2, Simeria)…',
          all: 'Összes',
          stops: 'Megállók',
          locate: 'Saját helyzet',
          locateError: 'Nem sikerült meghatározni a helyzetet',
        }
      : {
          tabStops: 'Stații',
          tabLines: 'Linii autobuz',
          tabPlanner: 'Traseu',
          searchStops: 'Caută stație…',
          searchLines: 'Caută linie (ex. 1, 2, Simeria)…',
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
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const handleStopClick = (stopId: string) => {
    setSelectedStopId(stopId);
    requestFlyToStop(stopId);
  };

  return (
    <aside
      className={`flex h-full min-h-0 flex-col bg-[var(--panel)] ${
        mode === 'desktop' ? 'w-[400px] shrink-0 border-r border-[var(--border)]' : 'w-full'
      }`}
    >
      <Header />

      {/* Main Tab Switcher */}
      <div className="flex border-b border-[var(--border)] bg-[var(--surface)] p-1.5 gap-1.5 px-3">
        <button
          type="button"
          onClick={() => setActiveTab('stops')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'stops'
              ? 'bg-[var(--panel)] text-[var(--brand)] shadow-sm ring-1 ring-[var(--border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {t.tabStops}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lines')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'lines'
              ? 'bg-[var(--panel)] text-[var(--brand)] shadow-sm ring-1 ring-[var(--border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
          }`}
        >
          <Bus className="h-3.5 w-3.5" aria-hidden />
          {t.tabLines}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === 'planner'
              ? 'bg-[var(--panel)] text-[var(--brand)] shadow-sm ring-1 ring-[var(--border)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
          }`}
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          {t.tabPlanner}
        </button>
      </div>

      {/* Search & controls bar (only for stops & lines tabs) */}
      {activeTab !== 'planner' && (
        <div className="space-y-3 border-b border-[var(--border)] px-4 py-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'stops' ? t.searchStops : t.searchLines}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-h)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            />
          </div>

          {activeTab === 'stops' && (
            <>
              <LineFilter lines={lines} allLabel={t.all} />
              <button
                type="button"
                onClick={handleLocate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-h)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                <LocateFixed className="h-4 w-4" aria-hidden />
                {t.locate}
              </button>
            </>
          )}
        </div>
      )}

      {/* Main content area depending on active tab */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto ${
          mode === 'mobile' && selectedStop && activeTab !== 'planner' ? 'hidden' : ''
        }`}
      >
        {activeTab === 'planner' ? (
          <TripPlanner />
        ) : activeTab === 'lines' ? (
          <LineList />
        ) : (
          <>
            <p className="px-4 pb-1 pt-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t.stops} ({filteredStops.length})
            </p>
            <ul className="pb-3">
              {filteredStops.map((stop) => {
                const active = selectedStop?.id === stop.id;
                return (
                  <li key={stop.id}>
                    <button
                      type="button"
                      onClick={() => handleStopClick(stop.id)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        active
                          ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                          : 'text-[var(--text-h)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <span className="flex gap-1" aria-hidden>
                        {stop.lineIds.map((lid) => {
                          const line = lines.find((l) => l.id === lid);
                          if (!line) return null;
                          return (
                            <span
                              key={lid}
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: line.color }}
                            />
                          );
                        })}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {stopName(stop)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Desktop: show stop card area for stops/lines tabs */}
      {activeTab !== 'planner' && (mode === 'desktop' || selectedStop) && (
        <div
          className={`shrink-0 border-t border-[var(--border)] bg-[var(--panel)] ${
            mode === 'desktop' ? 'h-[42%]' : ''
          }`}
        >
          <StopCard variant={mode === 'mobile' ? 'drawer' : 'panel'} />
        </div>
      )}
    </aside>
  );
}
