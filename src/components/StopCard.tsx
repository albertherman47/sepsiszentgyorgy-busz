import {
  CalendarDays,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

import { formatCountdown } from '../utils/timeUtils';

import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

interface StopCardProps {
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

  const setFullScheduleStopId = useAppStore(
    (s) => s.setFullScheduleStopId,
  );

  const hu = language === 'hu';

  /* Empty state */
  if (!selectedStop) {
    return (
      <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--text-muted)]">
          <MapPin className="h-5 w-5" />
        </div>

        <p className="max-w-[230px] text-sm font-medium leading-5 text-[var(--text-muted)]">
          {hu
            ? 'Válassz egy megállót a térképen vagy a listából'
            : 'Alege o stație de pe hartă sau din listă'}
        </p>
      </div>
    );
  }

  const title = stopName(selectedStop);

  return (
    <div
      className={
        variant === 'drawer'
          ? 'flex h-full min-h-0 flex-col'
          : 'flex h-full min-h-0 flex-col'
      }
    >
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-white px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />

              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {hu ? 'Megálló' : 'Stație'}
              </span>
            </div>

            <h2 className="truncate font-[family-name:var(--font-display)] text-[18px] font-bold tracking-tight text-[var(--text-h)]">
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setFullScheduleStopId(
                  selectedStop.id,
                )
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                border border-[var(--border)]
                bg-[var(--surface)]
                text-[var(--text-muted)]
                transition
                hover:border-[var(--brand)]
                hover:bg-[var(--brand-soft)]
                hover:text-[var(--brand)]
              "
              aria-label={
                hu
                  ? 'Teljes menetrend'
                  : 'Orar complet'
              }
            >
              <CalendarDays className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedStopId(null)
              }
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl
                text-[var(--text-muted)]
                transition
                hover:bg-[var(--surface)]
                hover:text-[var(--text-h)]
              "
              aria-label={
                hu ? 'Bezárás' : 'Închide'
              }
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Departures */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--text-muted)]">
            {hu
              ? 'Következő indulások'
              : 'Următoarele plecări'}
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Live
          </span>
        </div>

        {upcomingByLine.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-8 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-[var(--text-muted)] opacity-50" />

            <p className="text-sm font-medium text-[var(--text-muted)]">
              {hu
                ? 'Nincs további indulás'
                : 'Nu mai sunt plecări'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingByLine.map(
              ({ line, schedule, upcoming }, idx) => {
                const direction =
                  schedule.direction?.[
                    language
                  ];

                const next = upcoming[0];

                return (
                  <div
                    key={`${line.id}-${schedule.direction?.hu ?? 'default'}-${idx}`}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border border-[var(--border)]
                      bg-white
                      shadow-[0_2px_10px_rgba(15,35,55,0.04)]
                      transition
                      hover:border-[var(--border-strong)]
                    "
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Line */}
                      <span
                        className="
                          flex h-10 min-w-10
                          shrink-0 items-center
                          justify-center
                          rounded-xl
                          text-sm font-black
                          text-white
                        "
                        style={{
                          backgroundColor:
                            line.color,

                          boxShadow:
                            `0 5px 14px ${line.color}35`,
                        }}
                      >
                        {line.number}
                      </span>

                      {/* Destination */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-[var(--text-h)]">
                          {lineName(line)}
                        </div>

                        {direction && (
                          <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--text-h)] ring-1 ring-[var(--border)]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              {language === 'hu' ? 'Irány:' : 'Direcția:'}
                            </span>
                            <span className="truncate font-bold text-[var(--brand)]">
                              {direction}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Countdown */}
                      {next && (
                        <div className="shrink-0 text-right">
                          <div
                            className={`
                              text-[17px]
                              font-black
                              tabular-nums
                              ${
                                next.minutesUntil <= 2
                                  ? 'text-[var(--accent-warm)]'
                                  : 'text-[var(--brand)]'
                              }
                            `}
                          >
                            {formatCountdown(
                              next.minutesUntil,
                              language,
                            )}
                          </div>

                          <div className="mt-0.5 text-[10px] font-semibold tabular-nums text-[var(--text-muted)]">
                            {next.timeLabel}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional departures */}
                    {upcoming.length > 1 && (
                      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                        <div className="flex items-center gap-2 overflow-x-auto">
                          <Clock className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />

                          {upcoming
                            .slice(1, 4)
                            .map((dep) => (
                              <span
                                key={`${dep.timeLabel}-${dep.departureAt.getTime()}`}
                                className="
                                  rounded-lg
                                  bg-white
                                  px-2 py-1
                                  text-[10px]
                                  font-bold
                                  tabular-nums
                                  text-[var(--text)]
                                  ring-1
                                  ring-[var(--border)]
                                "
                              >
                                {dep.timeLabel}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
