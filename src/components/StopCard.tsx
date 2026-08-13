import { Clock, MapPin, X } from 'lucide-react';
import { formatCountdown } from '../utils/timeUtils';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

interface StopCardProps {
  /** When true, renders as mobile bottom-sheet panel content */
  variant?: 'drawer' | 'panel';
}

export function StopCard({
  variant = 'panel',
}: StopCardProps) {
  const {
    language,
    selectedStop,
    stopName,
    lineName,
    upcomingByLine,
  } = useBusData();

  const setSelectedStopId = useAppStore(
    (s) => s.setSelectedStopId,
  );

  // Nincs kiválasztott megálló
  if (!selectedStop) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center text-[var(--text-muted)]">
        <MapPin
          className="h-8 w-8 opacity-40"
          aria-hidden
        />

        <p className="text-sm">
          {language === 'hu'
            ? 'Válassz egy megállót a térképen vagy a listából'
            : 'Alege o stație pe hartă sau din listă'}
        </p>
      </div>
    );
  }

  const title = stopName(selectedStop);

  return (
    <div
      className={
        variant === 'drawer'
          ? 'flex max-h-[55vh] flex-col'
          : 'flex h-full min-h-0 flex-col'
      }
    >
      {/* ================================================== */}
      {/* FEJLÉC */}
      {/* ================================================== */}

      <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-0 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {language === 'hu' ? 'Megálló' : 'Stație'}
          </p>

          <h2 className="truncate font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-h)]">
            {title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStopId(null)}
          className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-h)]"
          aria-label={
            language === 'hu'
              ? 'Bezárás'
              : 'Închide'
          }
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ================================================== */}
      {/* MENETREND */}
      {/* ================================================== */}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {upcomingByLine.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-muted)]">
            {language === 'hu'
              ? 'Nincs menetrend ehhez a megállóhoz'
              : 'Nu există orar pentru această stație'}
          </p>
        ) : (
          <ul className="space-y-3">
            {upcomingByLine.map(
              ({ line, schedule, upcoming }) => {
                const direction =
                  schedule.direction?.[language];

                return (
                  <li
                    key={`${line.id}-${schedule.direction?.hu ?? 'default'}`}
                    className="rounded-xl bg-[var(--surface)] p-3 ring-1 ring-[var(--border)]"
                  >
                    {/* ====================================== */}
                    {/* JÁRAT */}
                    {/* ====================================== */}

                    <div className="mb-2 flex items-start gap-2">
                      <span
                        className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-sm font-bold text-white"
                        style={{
                          backgroundColor: line.color,
                        }}
                      >
                        {line.number}
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[var(--text-h)]">
                          {lineName(line)}
                        </div>

                        {/* ================================== */}
                        {/* IRÁNY */}
                        {/* ================================== */}

                        {direction && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                            <span className="font-medium">
                              →
                            </span>

                            <span className="truncate">
                              {direction}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ====================================== */}
                    {/* INDULÁSOK */}
                    {/* ====================================== */}

                    {upcoming.length === 0 ? (
                      <p className="py-1 text-xs text-[var(--text-muted)]">
                        {language === 'hu'
                          ? 'Ma már nincs több indulás'
                          : 'Nu mai sunt plecări astăzi'}
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {upcoming.map((dep) => (
                          <li
                            key={`${line.id}-${schedule.direction?.hu ?? 'default'}-${dep.timeLabel}-${dep.departureAt.getTime()}`}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="inline-flex items-center gap-1.5 tabular-nums text-[var(--text-muted)]">
                              <Clock
                                className="h-3.5 w-3.5"
                                aria-hidden
                              />

                              {dep.timeLabel}
                            </span>

                            <span
                              className={
                                `font-semibold tabular-nums ${dep.minutesUntil <= 2
                                  ? 'text-[var(--accent-warm)]'
                                  : 'text-[var(--brand)]'
                                }`
                              }
                            >
                              {formatCountdown(
                                dep.minutesUntil,
                                language,
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              },
            )}
          </ul>
        )}
      </div>
    </div>
  );
}