import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';
import { MapView } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { FullScheduleModal } from './components/FullScheduleModal';
import { ToastNotification } from './components/ToastNotification';
import { useAppStore } from './store/useAppStore';
import { useBusData } from './hooks/useBusData';

function useIsDesktop(breakpoint = 900) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches
      : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);

    const onChange = () => {
      setIsDesktop(mq.matches);
    };

    onChange();
    mq.addEventListener('change', onChange);

    return () => {
      mq.removeEventListener('change', onChange);
    };
  }, [breakpoint]);

  return isDesktop;
}

export default function App() {
  const isDesktop = useIsDesktop();

  const selectedStopId = useAppStore((s) => s.selectedStopId);
  const activeTab = useAppStore((s) => s.activeTab);
  const { language, selectedStop, stopName, upcomingByLine } = useBusData();

  // Mobile sheet height snap states: 'min' (~56px peek), 'half' (~50dvh), 'full' (~88dvh)
  const [sheetState, setSheetState] = useState<'min' | 'half' | 'full'>('half');

  // When a stop is selected on map/list, automatically bring up the sheet to half or full
  useEffect(() => {
    if (selectedStopId) {
      setSheetState((prev) => (prev === 'min' ? 'half' : prev));
    }
  }, [selectedStopId]);

  if (isDesktop) {
    return (
      <div className="app-shell flex h-dvh w-full overflow-hidden bg-[var(--bg)]">
        <Sidebar mode="desktop" />

        <main className="relative min-h-0 min-w-0 flex-1 p-3 lg:p-4">
          <div className="map-stage relative h-full overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,35,55,0.12)]">
            <MapView />

            {/* Live indicator */}
            <div className="absolute bottom-5 right-5 z-10 hidden items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2 text-[10px] font-bold text-[var(--text-h)] shadow-[0_8px_24px_rgba(15,35,55,0.12)] backdrop-blur-md md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>

              <Radio className="h-3.5 w-3.5 text-[var(--brand)]" />

              {language === 'hu'
                ? 'Valós idejű adatok'
                : 'Date în timp real'}
            </div>
          </div>
        </main>

        <FullScheduleModal />
        <ToastNotification />
      </div>
    );
  }

  // Next upcoming bus summary for mobile peek bar
  const firstUpcoming = upcomingByLine[0]?.upcoming[0];
  const firstUpcomingLine = upcomingByLine[0]?.line;

  const hu = language === 'hu';

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bg)] select-none">
      {/* Toast feedback */}
      <ToastNotification />

      {/* Map layer */}
      <main className="absolute inset-0">
        <MapView />
      </main>

      {/* Mobile Multi-Height Collapsible Bottom Sheet */}
      <div
        className={`
          absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden
          rounded-t-[28px] border-t-2 border-x border-[var(--border)]
          bg-[var(--panel)] shadow-[0_-14px_45px_rgba(15,23,42,0.22)]
          transition-all duration-300 ease-out
          ${
            sheetState === 'min'
              ? 'h-16 max-h-16'
              : sheetState === 'half'
                ? 'h-[52dvh] max-h-[52dvh]'
                : 'h-[88dvh] max-h-[88dvh]'
          }
        `}
      >
        {/* Interactive Handle & Snap Control Header */}
        <div
          onClick={() => {
            if (sheetState === 'min') setSheetState('half');
          }}
          className="
            flex w-full shrink-0 items-center justify-between
            border-b border-[var(--border)] bg-white px-3.5 py-2
            cursor-pointer
          "
        >
          {/* Left summary / stop indicator in peek mode */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSheetState((prev) => (prev === 'min' ? 'half' : 'min'));
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--brand)] hover:bg-[var(--brand-soft)]"
              aria-label={sheetState === 'min' ? 'Kinyitás' : 'Összecsukás'}
            >
              {sheetState === 'min' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {selectedStop ? (
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5 truncate text-xs font-black text-[var(--text-h)]">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand)] animate-pulse" />
                  <span className="truncate">{stopName(selectedStop)}</span>
                </div>
                {firstUpcoming && firstUpcomingLine && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 truncate">
                    <span
                      className="px-1 rounded text-[9px] text-white"
                      style={{ backgroundColor: firstUpcomingLine.color }}
                    >
                      {firstUpcomingLine.number}
                    </span>
                    <Clock className="h-2.5 w-2.5 shrink-0" />
                    <span>{firstUpcoming.timeLabel} ({firstUpcoming.minutesUntil} p)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="min-w-0 truncate">
                <span className="text-xs font-bold text-[var(--text-h)] uppercase tracking-wider">
                  {activeTab === 'stops'
                    ? (hu ? 'Megállók listája' : 'Listă stații')
                    : activeTab === 'lines'
                      ? (hu ? 'Buszjáratok' : 'Linii autobuz')
                      : (hu ? 'Útvonaltervező' : 'Planificator')}
                </span>
              </div>
            )}
          </div>

          {/* Center drag pill */}
          <div
            className="flex flex-col items-center justify-center px-2 py-1"
            onClick={(e) => {
              e.stopPropagation();
              setSheetState((prev) =>
                prev === 'min' ? 'half' : prev === 'half' ? 'full' : 'min',
              );
            }}
          >
            <span className="h-1.2 w-10 rounded-full bg-[var(--border-strong)]" />
          </div>

          {/* Right snap state quick toggles */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Peek / Map View */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSheetState('min');
              }}
              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                sheetState === 'min'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }`}
              title={hu ? 'Térkép nézet (Összecsukás)' : 'Hartă (Restrânge)'}
            >
              {hu ? 'Térkép' : 'Hartă'}
            </button>

            {/* Half View */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSheetState('half');
              }}
              className={`rounded-lg p-1.5 transition ${
                sheetState === 'half'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }`}
              title={hu ? 'Fél nézet' : 'Vizualizare jumătate'}
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>

            {/* Full View */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSheetState('full');
              }}
              className={`rounded-lg p-1.5 transition ${
                sheetState === 'full'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }`}
              title={hu ? 'Teljes képernyő' : 'Ecran complet'}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Sheet Content Area */}
        <div className="min-h-0 flex-1 overflow-hidden bg-[var(--panel)]">
          <Sidebar mode="mobile" />
        </div>
      </div>

      <FullScheduleModal />
    </div>
  );
}

