import { X, Clock, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

export function FullScheduleModal() {
  const fullScheduleStopId = useAppStore((s) => s.fullScheduleStopId);
  const setFullScheduleStopId = useAppStore((s) => s.setFullScheduleStopId);

  const {
    language,
    stops,
    lines,
    schedules,
    stopName,
    now,
    lineName,
  } = useBusData();

  const stop = useMemo(
    () => stops.find((s) => s.id === fullScheduleStopId) ?? null,
    [stops, fullScheduleStopId],
  );

  type GroupedEntry = {
    sch: (typeof schedules)[number];
    line: (typeof lines)[number];
    byHour: Record<number, string[]>;
    minHour: number;
    maxHour: number;
    isWeekend: boolean;
    directionLabel: string;
  };

  // Group schedules by lineId + direction
  const grouped = useMemo<GroupedEntry[]>(() => {
    if (!stop) return [];

    const stopSchedules = schedules.filter(
      (sch) => sch.stopId === stop.id,
    );

    const result: GroupedEntry[] = [];

    for (const sch of stopSchedules) {
      const line = lines.find((l) => l.id === sch.lineId);
      if (!line) continue;

      const isWeekend = [0, 6].includes(now.getDay());

      const times =
        isWeekend && sch.weekendTimes?.length
          ? sch.weekendTimes
          : sch.times;

      const byHour: Record<number, string[]> = {};

      for (const t of times) {
        const [hStr, mStr] = t.split(':');
        const h = parseInt(hStr, 10);

        if (!byHour[h]) {
          byHour[h] = [];
        }

        byHour[h].push(mStr);
      }

      const keys = Object.keys(byHour).map(Number);

      if (keys.length === 0) continue;

      result.push({
        sch,
        line,
        byHour,
        minHour: Math.min(...keys),
        maxHour: Math.max(...keys),
        isWeekend,
        directionLabel:
          sch.direction?.[language] ?? lineName(line),
      });
    }

    return result;
  }, [
    stop,
    schedules,
    lines,
    language,
    now,
    lineName,
  ]);

  if (!fullScheduleStopId || !stop) {
    return null;
  }

  const title = stopName(stop);
  const isWeekend = [0, 6].includes(now.getDay());

  const t =
    language === 'hu'
      ? {
          title: 'Teljes napi menetrend',
          subtitle: isWeekend
            ? '📅 Hétvégi menetrend'
            : '📅 Hétköznapi menetrend',
          hour: 'Óra',
          minutes: 'Percek',
          close: 'Bezárás',
          line: 'Járat',
          direction: 'Irány',
          noData: 'Nincs menetrend ehhez a megállóhoz.',
        }
      : {
          title: 'Orar complet zilnic',
          subtitle: isWeekend
            ? '📅 Orar weekend'
            : '📅 Orar zi lucrătoare',
          hour: 'Ora',
          minutes: 'Minute',
          close: 'Închide',
          line: 'Linie',
          direction: 'Direcție',
          noData: 'Nu există orar pentru această stație.',
        };

  return (
    <div
      className="
        fixed inset-0 z-[9999]
        flex items-center justify-center
        p-2 sm:p-4 md:p-6
        overflow-hidden
      "
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setFullScheduleStopId(null);
        }
      }}
    >
      <div
        className="
          relative
          flex
          w-full
          max-w-3xl
          h-[calc(100dvh-1rem)]
          sm:h-auto
          sm:max-h-[90dvh]
          flex-col
          overflow-hidden
          rounded-2xl
          bg-[var(--panel)]
          shadow-2xl
          ring-1
          ring-[var(--border)]
        "
      >
        {/* Header */}
        <div
          className="
            shrink-0
            flex
            items-start
            justify-between
            gap-4
            border-b
            border-[var(--border)]
            px-4
            py-4
            sm:px-6
          "
        >
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[var(--brand)]" />

              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                {t.title}
              </p>
            </div>

            <h2 className="truncate text-xl font-bold text-[var(--text-h)]">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {t.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFullScheduleStopId(null)}
            className="
              shrink-0
              rounded-xl
              p-2
              text-[var(--text-muted)]
              transition
              hover:bg-[var(--surface)]
              hover:text-[var(--text-h)]
            "
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            touch-pan-y
            px-3
            py-4
            sm:px-4
            sm:py-5
            space-y-6
            sm:space-y-8
          "
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {grouped.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Calendar className="mx-auto mb-3 h-10 w-10 opacity-30" />

              <p className="text-sm">
                {t.noData}
              </p>
            </div>
          ) : (
            grouped.map((g, gi) => {
              const hours: number[] = [];

              for (
                let h = g.minHour;
                h <= g.maxHour;
                h++
              ) {
                hours.push(h);
              }

              return (
                <div
                  key={`${g.sch.lineId}-${g.sch.direction?.hu ?? gi}`}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-[var(--border)]
                  "
                >
                  {/* Line + direction header */}
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                      px-4
                      py-3
                    "
                    style={{
                      backgroundColor:
                        g.line.color + '22',
                    }}
                  >
                    <span
                      className="
                        inline-flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        text-lg
                        font-black
                        text-white
                        shadow-sm
                      "
                      style={{
                        backgroundColor: g.line.color,
                      }}
                    >
                      {g.line.number}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        {t.direction}
                      </p>

                      <p className="truncate font-bold text-[var(--text-h)]">
                        {g.directionLabel}
                      </p>
                    </div>
                  </div>

                  {/* Timetable */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
                          <th className="w-14 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            {t.hour}
                          </th>

                          <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                            {t.minutes}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {hours.map((h) => {
                          const mins = g.byHour[h];

                          if (!mins) {
                            return null;
                          }

                          const hStr = String(h % 24).padStart(
                            2,
                            '0',
                          );

                          return (
                            <tr
                              key={h}
                              className="
                                border-b
                                border-[var(--border)]/50
                                last:border-0
                                transition-colors
                                hover:bg-[var(--surface)]/50
                              "
                            >
                              <td className="px-4 py-2.5 font-mono font-bold text-[var(--text-h)]">
                                {hStr}
                              </td>

                              <td className="flex flex-wrap gap-1.5 px-4 py-2">
                                {[...mins]
                                  .sort()
                                  .map((m, index) => {
                                    const depH = h % 24;
                                    const nowH = now.getHours();
                                    const nowM = now.getMinutes();

                                    const minute =
                                      parseInt(m, 10);

                                    const isPast =
                                      depH < nowH ||
                                      (depH === nowH &&
                                        minute < nowM);

                                    const isNext =
                                      !isPast &&
                                      (depH > nowH ||
                                        (depH === nowH &&
                                          minute >= nowM));

                                    const isNextExact =
                                      isNext &&
                                      depH === nowH &&
                                      minute >= nowM;

                                    return (
                                      <span
                                        key={`${m}-${index}`}
                                        className={`
                                          inline-flex
                                          h-7
                                          min-w-7
                                          items-center
                                          justify-center
                                          rounded-lg
                                          px-1.5
                                          font-mono
                                          text-xs
                                          font-bold
                                          tabular-nums
                                          transition-all

                                          ${
                                            isPast
                                              ? 'bg-[var(--surface)] text-[var(--text-muted)] opacity-50'
                                              : isNextExact
                                              ? 'bg-[var(--brand)] text-white shadow-sm ring-2 ring-[var(--brand)]/30'
                                              : 'bg-[var(--brand-soft)] text-[var(--brand)]'
                                          }
                                        `}
                                      >
                                        {m}
                                      </span>
                                    );
                                  })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}

          {/* Alsó térköz, hogy mobilon az utolsó sor is kényelmesen elérhető legyen */}
          <div className="h-4 shrink-0 sm:h-2" />
        </div>
      </div>
    </div>
  );
}