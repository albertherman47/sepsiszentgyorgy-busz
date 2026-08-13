import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { MapView } from './components/Map';
import { Sidebar } from './components/Sidebar';
import { FullScheduleModal } from './components/FullScheduleModal';
import { useAppStore } from './store/useAppStore';
import { useBusData } from './hooks/useBusData';

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isDesktop;
}

export default function App() {
  const isDesktop = useIsDesktop();
  const selectedStopId = useAppStore((s) => s.selectedStopId);
  const { language } = useBusData();
  const [sheetOpen, setSheetOpen] = useState(true);

  // Open sheet when a stop is selected on mobile
  useEffect(() => {
    if (selectedStopId) setSheetOpen(true);
  }, [selectedStopId]);

  if (isDesktop) {
    return (
      <div className="flex h-dvh w-full overflow-hidden bg-[var(--bg)]">
        <Sidebar mode="desktop" />
        <main className="relative min-h-0 min-w-0 flex-1">
          <MapView />
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
        className={`absolute inset-x-0 bottom-0 z-20 flex max-h-[78vh] flex-col rounded-t-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[0_-8px_30px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-3.25rem)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setSheetOpen((o) => !o)}
          className="flex w-full flex-col items-center gap-1 pb-1 pt-2"
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)]">
            <ChevronUp
              className={`h-4 w-4 transition-transform ${sheetOpen ? 'rotate-180' : ''}`}
              aria-hidden
            />
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
