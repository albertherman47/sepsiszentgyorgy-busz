import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { MapView } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { FullScheduleModal } from './components/FullScheduleModal';
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
  const { language } = useBusData();

  const [sheetOpen, setSheetOpen] = useState(true);

  useEffect(() => {
    if (selectedStopId) {
      setSheetOpen(true);
    }
  }, [selectedStopId]);

  if (isDesktop) {
    return (
      <div className="app-shell flex h-dvh w-full overflow-hidden bg-[var(--bg)]">
        <Sidebar mode="desktop" />

        <main className="relative min-h-0 min-w-0 flex-1 p-3 lg:p-4">
          <div className="map-stage relative h-full overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_20px_60px_rgba(15,35,55,0.12)]">
            <MapView />

            {/* Top map information */}
           
          

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
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[var(--bg)]">
      <main className="absolute inset-0">
        <MapView />
      </main>

      {/* Mobile bottom sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex h-[82dvh] max-h-[82dvh] flex-col overflow-hidden rounded-t-[24px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_-12px_40px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out ${
          sheetOpen
            ? 'translate-y-0'
            : 'translate-y-[calc(100%-3.75rem)]'
        }`}
      >
        {/* Drag handle */}
        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          className="flex w-full flex-col items-center gap-1 px-4 pb-2 pt-2.5"
          aria-expanded={sheetOpen}
          aria-label={
            language === 'hu'
              ? sheetOpen
                ? 'Lista összecsukása'
                : 'Lista kinyitása'
              : sheetOpen
                ? 'Restrânge lista'
                : 'Extinde lista'
          }
        >
          <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {language === 'hu' ? 'Menetrend' : 'Orar'}
          </span>
        </button>

        <div className="min-h-0 flex-1 overflow-hidden">
          <Sidebar mode="mobile" />
        </div>
      </div>

      <FullScheduleModal />
    </div>
  );
}
