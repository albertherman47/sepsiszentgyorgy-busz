import { X, Clock, Calendar } from 'lucide-react';
import { useMemo } from 'react';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';

export function FullScheduleModal() {
  const fullScheduleStopId = useAppStore((s) => s.fullScheduleStopId);
  const setFullScheduleStopId = useAppStore((s) => s.setFullScheduleStopId);

  const { language, stops, lines, schedules, stopName, now, lineName } = useBusData();

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

    const stopSchedules = schedules.filter((sch) => sch.stopId === stop.id);

    const result: GroupedEntry[] = [];

    for (const sch of stopSchedules) {
      const line = lines.find((l) => l.id === sch.lineId);
      if (!line) continue;

      const isWeekend = [0, 6].includes(now.getDay());
      const times =
        isWeekend && sch.weekendTimes?.length ? sch.weekendTimes : sch.times;

      const byHour: Record<number, string[]> = {};
      for (const t of times) {
        const [hStr, mStr] = t.split(':');
        const h = parseInt(hStr, 10);
        if (!byHour[h]) byHour[h] = [];
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
        directionLabel: sch.direction?.[language] ?? lineName(line),
      });
    }

    return result;
  }, [stop, schedules, lines, language, now, lineName]);

  if (!fullScheduleStopId || !stop) return null;

  const title = stopName(stop);
  const isWeekend = [0, 6].includes(now.getDay());

  const t =
    language === 'hu'
      ? {
          title: 'Teljes napi menetrend',
          subtitle: isWeekend ? '📅 Hétvégi menetrend' : '📅 Hétköznapi menetrend',
          hour: 'Óra',
          minutes: 'Percek',
          close: 'Bezárás',
          line: 'Járat',
          direction: 'Irány',
          noData: 'Nincs menetrend ehhez a megállóhoz.',
        }
      : {
          title: 'Orar complet zilnic',
          subtitle: isWeekend ? '📅 Orar weekend' : '📅 Orar zi lucrătoare',
          hour: 'Ora',
          minutes: 'Minute',
          close: 'Închide',
          line: 'Linie',
          direction: 'Direcție',
          noData: 'Nu există orar pentru această stație.',
        };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setFullScheduleStopId(null);
      }}
    >
      <div
        className="relative flex w-full max-w-3xl flex-col rounded-2xl bg-[var(--panel)] shadow-2xl ring-1 ring-[var(--border)]"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[var(--brand)] shrink-0" />
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                {t.title}
              </p>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-h)] truncate">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setFullScheduleStopId(null)}
            className="shrink-0 rounded-xl p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-h)]"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 space-y-8">
          {grouped.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t.noData}</p>
            </div>
          ) : (
            grouped.map((g, gi) => {
              const hours: number[] = [];
              for (let h = g.minHour; h <= g.maxHour; h++) {
                hours.push(h);
              }

              return (
                <div key={gi} className="rounded-2xl border border-[var(--border)] overflow-hidden">
                  {/* Line + direction header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: g.line.color + '22' }}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl font-black text-white text-lg shadow-sm shrink-0"
                      style={{ backgroundColor: g.line.color }}
                    >
                      {g.line.number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        {t.direction}
                      </p>
                      <p className="font-bold text-[var(--text-h)] truncate">
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
                          if (!mins) return null;

                          const hStr = String(h % 24).padStart(2, '0');

                          return (
                            <tr
                              key={h}
                              className="border-b border-[var(--border)]/50 last:border-0 hover:bg-[var(--surface)]/50 transition-colors"
                            >
                              <td className="px-4 py-2.5 font-mono font-bold text-[var(--text-h)]">
                                {hStr}
                              </td>
                              <td className="px-4 py-2 flex flex-wrap gap-1.5">
                                {[...mins].sort().map((m) => {
                                  const depH = h % 24;
                                  const nowH = now.getHours();
                                  const nowM = now.getMinutes();
                                  const isPast =
                                    depH < nowH ||
                                    (depH === nowH && parseInt(m, 10) < nowM);
                                  const isNext =
                                    !isPast &&
                                    (depH > nowH ||
                                      (depH === nowH && parseInt(m, 10) >= nowM));
                                  // Highlight the very next departure
                                  const isNextExact =
                                    isNext &&
                                    depH === (isPast ? -1 : nowH <= depH ? depH : -1);

                                  return (
                                    <span
                                      key={m}
                                      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 font-mono text-xs font-bold tabular-nums transition-all ${
                                        isPast
                                          ? 'bg-[var(--surface)] text-[var(--text-muted)] opacity-50'
                                          : isNextExact
                                          ? 'bg-[var(--brand)] text-white shadow-sm ring-2 ring-[var(--brand)]/30'
                                          : 'bg-[var(--brand-soft)] text-[var(--brand)]'
                                      }`}
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
        </div>
      </div>
    </div>
  );
}
