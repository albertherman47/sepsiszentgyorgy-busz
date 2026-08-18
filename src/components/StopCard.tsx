import { useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Filter,
  Flame,
  LayoutGrid,
  List,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';

import { formatCountdown, getActiveTimes } from '../utils/timeUtils';
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
    lines,
    now,
  } = useBusData();

  const setSelectedStopId = useAppStore(
    (s) => s.setSelectedStopId,
  );

  const setFullScheduleStopId = useAppStore(
    (s) => s.setFullScheduleStopId,
  );

  // Local state for line filter inside the stop card
  const [filterLineId, setFilterLineId] = useState<string | null>(null);
  // View layout toggle: 'cards' (large blocks) vs 'compact'
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  // Collapsible state for the whole departures section
  const [departuresCollapsed, setDeparturesCollapsed] = useState(false);
  // Expanded timetable accordion per line
  const [expandedScheduleLineKey, setExpandedScheduleLineKey] = useState<string | null>(null);

  const hu = language === 'hu';

  /* Empty state */
  if (!selectedStop) {
    return (
      <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--text-muted)]">
          <MapPin className="h-5 w-5" />
        </div>

        <p className="max-w-[240px] text-sm font-medium leading-5 text-[var(--text-muted)]">
          {hu
            ? 'Válassz egy megállót a térképen vagy a listából az indulásokhoz'
            : 'Alege o stație de pe hartă sau din listă pentru plecări'}
        </p>
      </div>
    );
  }

  const title = stopName(selectedStop);

  // Filter departures if user picked a specific line chip
  const filteredUpcoming = filterLineId
    ? upcomingByLine.filter((item) => item.line.id === filterLineId)
    : upcomingByLine;

  // Find unique lines serving this stop
  const servingLines = selectedStop.lineIds
    .map((id) => lines.find((l) => l.id === id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const toggleScheduleAccordion = (key: string) => {
    setExpandedScheduleLineKey((prev) => (prev === key ? null : key));
  };

  return (
    <div
      className={
        variant === 'drawer'
          ? 'flex h-full min-h-0 flex-col bg-white'
          : 'flex h-full min-h-0 flex-col bg-white'
      }
    >
      {/* Top Header Card */}
      <div className="border-b border-[var(--border)] bg-white px-4 pb-3 pt-3 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[var(--brand)] animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {hu ? 'Kiválasztott megálló' : 'Stație selectată'}
              </span>
              <span className="rounded-md bg-[var(--surface)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--text-muted)]">
                {selectedStop.lineIds.length} {hu ? 'járat' : 'linii'}
              </span>
            </div>

            <h2 className="truncate font-[family-name:var(--font-display)] text-lg sm:text-xl font-black tracking-tight text-[var(--text-h)]">
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Full Schedule Modal Button */}
            <button
              type="button"
              onClick={() => setFullScheduleStopId(selectedStop.id)}
              className="
                inline-flex h-9 items-center gap-1.5
                rounded-xl border border-[var(--border)]
                bg-[var(--surface)] px-2.5
                text-xs font-bold text-[var(--text-h)]
                transition-all
                hover:border-[var(--brand)]
                hover:bg-[var(--brand-soft)]
                hover:text-[var(--brand)]
                active:scale-95
              "
              title={hu ? 'Teljes napi menetrend megnyitása' : 'Orar complet'}
            >
              <CalendarDays className="h-4 w-4 text-[var(--brand)]" />
              <span className="hidden sm:inline text-[11px]">
                {hu ? 'Menetrend' : 'Orar'}
              </span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedStopId(null)}
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-xl border border-transparent
                bg-[var(--surface)] text-[var(--text-muted)]
                transition-all
                hover:bg-rose-50 hover:text-rose-600
                active:scale-90
              "
              aria-label={hu ? 'Bezárás' : 'Închide'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Line Filter Chips inside Stop */}
        {servingLines.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase shrink-0 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              {hu ? 'Járat:' : 'Linie:'}
            </span>

            <button
              type="button"
              onClick={() => setFilterLineId(null)}
              className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold transition-all ${
                filterLineId === null
                  ? 'bg-[var(--text-h)] text-white shadow-xs'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--border)]/50'
              }`}
            >
              {hu ? 'Mind' : 'Toate'} ({upcomingByLine.length})
            </button>

            {servingLines.map((line) => {
              const active = filterLineId === line.id;
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setFilterLineId(active ? null : line.id)}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black transition-all ${
                    active
                      ? 'text-white shadow-sm ring-2 ring-offset-1 ring-offset-white'
                      : 'bg-[var(--surface)] text-[var(--text-h)] hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: active ? line.color : undefined,
                    color: active ? '#ffffff' : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: active ? '#ffffff' : line.color,
                    }}
                  />
                  {line.number}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Departures Body */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)] px-3 py-3 sm:px-4">
        {/* Section Controls Bar */}
        <div className="mb-2.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDeparturesCollapsed((prev) => !prev)}
            className="group flex items-center gap-1.5 text-left"
          >
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--text-h)] group-hover:text-[var(--brand)]">
              {hu ? 'Következő indulások' : 'Următoarele plecări'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[9px] font-black text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live
            </span>
            {departuresCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            )}
          </button>

          {/* View mode toggle (Cards / Compact) */}
          <div className="flex items-center rounded-lg bg-white border border-[var(--border)] p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`rounded-md p-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }`}
              title={hu ? 'Nagy kártyák nézet' : 'Vizualizare blocuri mari'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`rounded-md p-1 transition-all ${
                viewMode === 'compact'
                  ? 'bg-[var(--brand)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
              }`}
              title={hu ? 'Kompakt lista nézet' : 'Vizualizare compactă'}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Collapsed state */}
        {departuresCollapsed ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3 text-center text-xs text-[var(--text-muted)]">
            <button
              type="button"
              onClick={() => setDeparturesCollapsed(false)}
              className="font-bold text-[var(--brand)] hover:underline"
            >
              {hu ? 'Kattints ide az indulások kibontásához' : 'Apasă aici pentru a afișa plecările'}
            </button>
          </div>
        ) : filteredUpcoming.length === 0 ? (
          /* Empty state for no departures */
          <div className="rounded-2xl border border-[var(--border)] bg-white px-5 py-8 text-center shadow-xs">
            <Clock className="mx-auto mb-2 h-7 w-7 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-bold text-[var(--text-h)]">
              {hu ? 'Nincs több indulás a mai napon' : 'Nu mai sunt plecări astăzi'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {hu
                ? 'Nézd meg a teljes menetrendet a holnapi járatokhoz.'
                : 'Consultă orarul complet pentru cursele de mâine.'}
            </p>
            <button
              type="button"
              onClick={() => setFullScheduleStopId(selectedStop.id)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-bold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {hu ? 'Teljes menetrend megtekintése' : 'Vezi orar complet'}
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* ============================================================
             NAGY KOCKÁK DESIGN (Large, high-visibility mobile blocks)
             ============================================================ */
          <div className="space-y-3 pb-4">
            {filteredUpcoming.map(({ line, schedule, upcoming }, idx) => {
              const direction = schedule.direction?.[language];
              const next = upcoming[0];
              const scheduleKey = `${line.id}-${schedule.direction?.hu ?? 'default'}-${idx}`;
              const isAccordionOpen = expandedScheduleLineKey === scheduleKey;
              const allTimesToday = getActiveTimes(schedule, now);

              const isVerySoon = next && next.minutesUntil <= 3;
              const isSoon = next && next.minutesUntil <= 12;

              return (
                <div
                  key={scheduleKey}
                  className="
                    overflow-hidden rounded-2xl sm:rounded-3xl
                    border-2 bg-white shadow-sm transition-all duration-200
                    hover:shadow-md
                  "
                  style={{
                    borderColor: `${line.color}40`,
                  }}
                >
                  {/* Top Bar with Line and Direction */}
                  <div
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b"
                    style={{
                      backgroundColor: `${line.color}14`,
                      borderColor: `${line.color}25`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Big Line Badge */}
                      <span
                        className="
                          flex h-9 min-w-9 items-center justify-center
                          rounded-xl text-base font-black text-white shadow-xs
                        "
                        style={{
                          backgroundColor: line.color,
                        }}
                      >
                        {line.number}
                      </span>

                      <div className="min-w-0">
                        <span className="truncate text-xs font-extrabold text-[var(--text-h)] block">
                          {lineName(line)}
                        </span>
                        {direction && (
                          <span className="truncate text-[11px] font-bold text-[var(--brand)] flex items-center gap-1">
                            <Compass className="h-3 w-3 shrink-0 opacity-70" />
                            {direction}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isVerySoon ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs animate-pulse">
                        <Flame className="h-3 w-3" />
                        {hu ? 'Azonnal' : 'Imediat'}
                      </span>
                    ) : isSoon ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                        <Sparkles className="h-3 w-3" />
                        {hu ? 'Hamarosan' : 'În curând'}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-[var(--surface)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                        {hu ? 'Menetrendi' : 'Programat'}
                      </span>
                    )}
                  </div>

                  {/* Main Time Block ("Nagy időpont és visszaszámláló") */}
                  {next && (
                    <div className="p-3.5 sm:p-4 bg-gradient-to-b from-white to-[var(--surface)]/30">
                      <div className="flex items-center justify-between gap-3">
                        {/* Clock Time */}
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                            {hu ? 'Következő indulás:' : 'Următoarea plecare:'}
                          </div>
                          <div className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight text-[var(--text-h)]">
                            {next.timeLabel}
                          </div>
                        </div>

                        {/* Huge Countdown Badge */}
                        <div className="text-right">
                          <div
                            className={`
                              inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2
                              text-base sm:text-lg font-black tabular-nums shadow-xs
                              ${
                                isVerySoon
                                  ? 'bg-rose-50 text-rose-600 border-2 border-rose-400'
                                  : isSoon
                                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-400'
                                    : 'bg-[var(--brand-soft)] text-[var(--brand)] border-2 border-[var(--brand)]/30'
                              }
                            `}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isVerySoon
                                  ? 'bg-rose-500 animate-ping'
                                  : isSoon
                                    ? 'bg-emerald-500'
                                    : 'bg-[var(--brand)]'
                              }`}
                            />
                            {formatCountdown(next.minutesUntil, language)}
                          </div>
                        </div>
                      </div>

                      {/* Subsequent Upcoming Departures Pill List */}
                      {upcoming.length > 1 && (
                        <div className="mt-3 border-t border-[var(--border)]/70 pt-2.5">
                          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)]">
                            <span className="uppercase tracking-wider">
                              {hu ? 'Későbbi indulások ma:' : 'Următoarele curse astăzi:'}
                            </span>
                            <span>{upcoming.length - 1} {hu ? 'további' : 'altele'}</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {upcoming.slice(1, 6).map((dep) => (
                              <div
                                key={`${dep.timeLabel}-${dep.departureAt.getTime()}`}
                                className="
                                  flex items-center gap-1
                                  rounded-xl border border-[var(--border)]
                                  bg-white px-2.5 py-1 text-xs font-black
                                  tabular-nums text-[var(--text-h)] shadow-2xs
                                "
                              >
                                <Clock className="h-3 w-3 text-[var(--brand)]" />
                                <span>{dep.timeLabel}</span>
                                <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                                  ({formatCountdown(dep.minutesUntil, language)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accordion Toggle for All Day Departures */}
                  <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleScheduleAccordion(scheduleKey)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] hover:underline"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>
                        {isAccordionOpen
                          ? hu ? 'Napi menetrend elrejtése' : 'Ascunde orar'
                          : hu ? `Teljes napi lista (${allTimesToday.length} indulás)` : `Tot orarul (${allTimesToday.length} plecări)`}
                      </span>
                      {isAccordionOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <span className="text-[10px] font-bold text-[var(--text-muted)]">
                      {line.number}. {hu ? 'járat' : 'linie'}
                    </span>
                  </div>

                  {/* Inline All-Day Schedule Drawer if expanded */}
                  {isAccordionOpen && (
                    <div className="border-t border-[var(--border)] bg-white p-3 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {hu ? 'Minden mai indulási időpont:' : 'Toate orele de plecare azi:'}
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {allTimesToday.map((tStr) => {
                          const [h, m] = tStr.split(':').map(Number);
                          const isPassed =
                            h < now.getHours() ||
                            (h === now.getHours() && m < now.getMinutes());
                          const isCurrentNext =
                            next && next.timeLabel === tStr;

                          return (
                            <span
                              key={tStr}
                              className={`
                                rounded-lg px-2 py-1 text-xs font-black tabular-nums transition
                                ${
                                  isCurrentNext
                                    ? 'bg-[var(--brand)] text-white shadow-sm ring-2 ring-[var(--brand)]/30'
                                    : isPassed
                                      ? 'bg-[var(--surface)] text-[var(--text-muted)] opacity-40 line-through'
                                      : 'bg-[var(--brand-soft)] text-[var(--brand)] border border-[var(--brand)]/20'
                                }
                              `}
                            >
                              {tStr}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ============================================================
             KOMPAKT NÉZET (Compact List View)
             ============================================================ */
          <div className="space-y-2 pb-4">
            {filteredUpcoming.map(({ line, schedule, upcoming }, idx) => {
              const direction = schedule.direction?.[language];
              const next = upcoming[0];

              return (
                <div
                  key={`${line.id}-${schedule.direction?.hu ?? 'compact'}-${idx}`}
                  className="
                    flex items-center justify-between gap-3
                    rounded-2xl border border-[var(--border)]
                    bg-white p-3 shadow-2xs transition
                    hover:border-[var(--brand)]
                  "
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-xs"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.number}
                    </span>

                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-[var(--text-h)]">
                        {lineName(line)}
                      </div>
                      {direction && (
                        <div className="truncate text-[10px] font-semibold text-[var(--brand)]">
                          ➔ {direction}
                        </div>
                      )}
                    </div>
                  </div>

                  {next && (
                    <div className="shrink-0 text-right">
                      <div className="text-base font-black tabular-nums text-[var(--brand)]">
                        {next.timeLabel}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">
                        {formatCountdown(next.minutesUntil, language)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

