import { useState } from 'react';
import { Bus, Check, ChevronDown, ChevronRight, Layers, MapPin, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';
import { stops } from '../data/busData';

export function LineList() {
  const { language, lines, lineName, stopName } = useBusData();
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const selectedLineDirection = useAppStore((s) => s.selectedLineDirection);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const searchQuery = useAppStore((s) => s.searchQuery);

  // Track expanded accordion for showing stops sequence
  const [expandedLineId, setExpandedLineId] = useState<string | null>(selectedLineId);

  const t =
    language === 'hu'
      ? {
          title: 'Buszjáratok menü',
          allLines: 'Összes buszjárat (térkép visszaállítása)',
          allLinesActive: 'Minden járat látható a térképen',
          stopsCount: (n: number) => `${n} megálló`,
          showRoute: 'Kizárólag ennek az útvonalát mutassa',
          activeRoute: 'Kiválasztott útvonal',
          routeStops: 'Útvonal megállói sorrendben:',
          noResults: 'Nem található a keresésnek megfelelő buszjárat',
          busSuffix: 'busz',
        }
      : {
          title: 'Meniu linii autobuz',
          allLines: 'Toate liniile (resetează harta)',
          allLinesActive: 'Toate liniile sunt afișate pe hartă',
          stopsCount: (n: number) => `${n} stații`,
          showRoute: 'Arată doar traseul acestei linii',
          activeRoute: 'Traseu selectat',
          routeStops: 'Stațiile traseului în ordine:',
          noResults: 'Nu s-a găsit nicio linie conform căutării',
          busSuffix: 'autobuz',
        };

  // Filter lines based on search query
  const q = searchQuery.trim().toLowerCase();
  const filteredLines = lines.filter((l) => {
    if (!q) return true;
    const num = l.number.toLowerCase();
    const hu = l.name_hu.toLowerCase();
    const ro = l.name_ro.toLowerCase();
    return num.includes(q) || hu.includes(q) || ro.includes(q);
  });

  const handleSelectLine = (lineId: string | null) => {
    setSelectedLineId(lineId);
    setExpandedLineId(lineId);
  };

  const handleStopClick = (stopId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStopId(stopId);
    requestFlyToStop(stopId);
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-[var(--brand)]" aria-hidden />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {t.title} ({filteredLines.length})
          </h3>
        </div>

        {selectedLineId && (
          <button
            type="button"
            onClick={() => handleSelectLine(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            {language === 'hu' ? 'Összes mutatása' : 'Arată toate'}
          </button>
        )}
      </div>

      {/* Card for selecting ALL bus lines */}
      <button
        type="button"
        onClick={() => handleSelectLine(null)}
        className={`flex w-full items-center justify-between rounded-xl p-3 text-left transition-all duration-200 ${
          selectedLineId === null
            ? 'bg-[var(--brand-soft)] border-2 border-[var(--brand)] shadow-sm'
            : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              selectedLineId === null
                ? 'bg-[var(--brand)] text-white'
                : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}
          >
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-h)]">{t.allLines}</p>
            <p className="text-xs text-[var(--text-muted)]">{t.allLinesActive}</p>
          </div>
        </div>
        {selectedLineId === null && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-white">
            <Check className="h-4 w-4" />
          </span>
        )}
      </button>

      {filteredLines.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--text-muted)]">{t.noResults}</p>
      ) : (
        <div className="space-y-2.5">
          {filteredLines.map((line) => {
            const isSelected = selectedLineId === line.id;
            const isExpanded = expandedLineId === line.id;

            // Get stops in order for this line
            const lineStops = (line.id === 'line-5d'
              ? line.directionStopIds?.[selectedLineDirection] ?? line.stopIds
              : line.stopIds)
              .map((id) => stops.find((s) => s.id === id))
              .filter((s): s is NonNullable<typeof s> => s !== undefined);

            return (
              <div
                key={line.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-2 shadow-md ring-2 ring-offset-1 ring-offset-[var(--panel)]'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-gray-400'
                }`}
                style={{
                  borderColor: isSelected ? line.color : undefined,
                  backgroundColor: isSelected ? `${line.color}0D` : undefined,
                  boxShadow: isSelected ? `0 4px 14px ${line.color}25` : undefined,
                }}
              >
                {/* Line card header / main clickable area */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectLine(line.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectLine(line.id);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between p-3.5 select-none"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 min-w-10 items-center justify-center rounded-xl text-base font-black text-white shadow-sm"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-[var(--text-h)]">
                          {line.number}. {t.busSuffix} – {lineName(line)}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {t.stopsCount(line.stopIds.length)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: line.color }}
                      >
                        <Check className="h-3 w-3" />
                        {t.activeRoute}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectLine(line.id);
                        }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs font-semibold text-[var(--text-h)] shadow-xs transition hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]"
                      >
                        {t.showRoute}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLineId(isExpanded ? null : line.id);
                      }}
                      className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--border)]/40"
                      aria-label="Lenyitás"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded stop sequence timeline */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)]/60 bg-[var(--panel)] p-3">
                    <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">
                      {t.routeStops}
                    </p>
                    <div className="relative pl-3 space-y-2">
                      {/* Vertical line connecting stops */}
                      <div
                        className="absolute left-[1.125rem] top-3 bottom-3 w-0.5"
                        style={{ backgroundColor: line.color, opacity: 0.4 }}
                      />

                      {lineStops.map((stop, idx) => (
                        <button
                          key={`${line.id}-${stop.id}-${idx}`}
                          type="button"
                          onClick={(e) => handleStopClick(stop.id, e)}
                          className="group relative flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition hover:bg-[var(--surface)]"
                        >
                          <span
                            className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs transition group-hover:scale-110"
                            style={{ backgroundColor: line.color }}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate text-xs font-medium text-[var(--text-h)] group-hover:text-[var(--brand)]">
                            {stopName(stop)}
                          </span>
                          <MapPin className="ml-auto h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 text-[var(--brand)]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
