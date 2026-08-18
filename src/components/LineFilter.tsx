import { ArrowLeftRight, ArrowUpDown, Layers, X } from 'lucide-react';

import type { Line } from '../types/bus';

import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';

interface LineFilterProps {
  lines: Line[];
  allLabel: string;
}

export function LineFilter({
  lines,
  allLabel,
}: LineFilterProps) {
  const {
    language,
    lineName,
    lineEndpoints,
    toggleSelectedLineDirection,
  } = useBusData();

  const selectedLineId = useAppStore(
    (s) => s.selectedLineId,
  );

  const setSelectedLineId = useAppStore(
    (s) => s.setSelectedLineId,
  );

  const selectedLineDirection = useAppStore(
    (s) => s.selectedLineDirection,
  );

  const setSelectedLineDirection = useAppStore(
    (s) => s.setSelectedLineDirection,
  );

  const activeLine =
    lines.find((l) => l.id === selectedLineId) ??
    null;

  const hu = language === 'hu';

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {hu ? 'Járatok' : 'Linii'}
          </span>
        </div>

        {selectedLineId && (
          <button
            type="button"
            onClick={() =>
              setSelectedLineId(null)
            }
            className="
              inline-flex items-center gap-1
              rounded-md px-1.5 py-1
              text-[10px] font-bold
              text-[var(--brand)]
              transition
              hover:bg-[var(--brand-soft)]
            "
          >
            <X className="h-3 w-3" />

            {hu ? 'Törlés' : 'Șterge'}
          </button>
        )}
      </div>

      {/* Line pills */}
      <div
        className="
          flex gap-1.5 overflow-x-auto
          pb-1
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        role="listbox"
        aria-label={hu ? 'Járatok' : 'Linii'}
      >
        {/* All */}
        <button
          type="button"
          role="option"
          aria-selected={selectedLineId === null}
          onClick={() =>
            setSelectedLineId(null)
          }
          className={`
            inline-flex h-9 shrink-0
            items-center gap-1.5
            rounded-xl px-3
            text-xs font-bold
            transition-all
            ${
              selectedLineId === null
                ? 'bg-[var(--text-h)] text-white shadow-sm'
                : 'border border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--border-strong)]'
            }
          `}
        >
          <Layers className="h-3.5 w-3.5" />

          {allLabel}
        </button>

        {/* Lines */}
        {lines.map((line) => {
          const active =
            selectedLineId === line.id;

          return (
            <button
              key={line.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() =>
                setSelectedLineId(
                  active ? null : line.id,
                )
              }
              className={`
                inline-flex h-9 min-w-12
                shrink-0 items-center
                justify-center gap-1.5
                rounded-xl px-3
                text-xs font-black
                transition-all duration-150
                ${
                  active
                    ? 'scale-[1.02] text-white shadow-md'
                    : 'border bg-white text-[var(--text-h)] hover:-translate-y-0.5 hover:shadow-sm'
                }
              `}
              style={{
                backgroundColor: active
                  ? line.color
                  : undefined,

                borderColor: active
                  ? line.color
                  : `${line.color}55`,

                boxShadow: active
                  ? `0 5px 15px ${line.color}35`
                  : undefined,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: active
                    ? 'rgba(255,255,255,.9)'
                    : line.color,
                }}
              />

              {line.number}
            </button>
          );
        })}
      </div>

      {/* Active line */}
      {activeLine && (
        <div className="space-y-2">
          {/* Main Active Line Banner */}
          <div
            className="
              flex items-center
              justify-between
              overflow-hidden
              rounded-xl
              px-3 py-2.5
              text-white
              shadow-sm
            "
            style={{
              backgroundColor: activeLine.color,
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-white/20 px-1.5 text-[11px] font-black">
                {activeLine.number}
              </span>

              <span className="truncate text-xs font-semibold">
                {lineName(activeLine)}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedLineId(null)
              }
              className="ml-2 rounded-lg p-1 transition hover:bg-black/10"
              aria-label={
                hu
                  ? 'Szűrő törlése'
                  : 'Șterge filtrul'
              }
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dedicated Route Direction Toggle & Swap Panel */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-xs transition-all">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  {hu ? 'Menetirány' : 'Direcție traseu'}
                </span>
                <span
                  className="rounded-full px-1.5 py-0.2 text-[9px] font-black uppercase text-white"
                  style={{ backgroundColor: activeLine.color }}
                >
                  {selectedLineDirection === 'outbound'
                    ? hu ? 'Odafelé' : 'Tur'
                    : hu ? 'Visszafelé' : 'Retur'}
                </span>
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={toggleSelectedLineDirection}
                className="
                  group inline-flex items-center gap-1.5
                  rounded-lg border border-[var(--border)]
                  bg-white px-2.5 py-1 text-xs font-bold
                  text-[var(--text-h)] shadow-xs
                  transition-all duration-200
                  hover:border-[var(--brand)]
                  hover:bg-[var(--brand-soft)]
                  hover:text-[var(--brand)]
                  active:scale-95
                "
                title={hu ? 'Kezdő és végállomás megfordítása' : 'Inversează stația de plecare și sosire'}
              >
                <ArrowUpDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180 text-[var(--brand)]" />
                <span className="text-[11px] font-bold">
                  {hu ? 'Irány megfordítása' : 'Schimbă sensul'}
                </span>
              </button>
            </div>

            {/* Start and End Stop Visual Flow */}
            {lineEndpoints && (
              <div className="relative mb-2 rounded-xl bg-white p-2.5 border border-[var(--border)]/70 shadow-xs">
                <div className="flex items-center gap-2.5">
                  {/* Visual Route Line Indicator */}
                  <div className="flex flex-col items-center justify-between self-stretch py-0.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-white" />
                    <span className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500 to-rose-500 my-0.5 min-h-3" />
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-rose-500 bg-rose-500" />
                  </div>

                  {/* Stop Texts */}
                  <div className="min-w-0 flex-1 space-y-1.5 text-left">
                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                        {hu ? 'Kezdő megálló' : 'Stație plecare'}
                      </div>
                      <div className="truncate text-xs font-bold text-[var(--text-h)]">
                        {lineEndpoints.start || (hu ? 'Indulási állomás' : 'Punct plecare')}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-rose-600">
                        {hu ? 'Végállomás' : 'Stație sosire'}
                      </div>
                      <div className="truncate text-xs font-bold text-[var(--text-h)]">
                        {lineEndpoints.end || (hu ? 'Érkezési állomás' : 'Punct sosire')}
                      </div>
                    </div>
                  </div>

                  {/* Middle quick swap icon button */}
                  <button
                    type="button"
                    onClick={toggleSelectedLineDirection}
                    className="
                      flex h-8 w-8 shrink-0 items-center justify-center
                      rounded-xl border border-[var(--border)]
                      bg-[var(--surface)] text-[var(--text-muted)]
                      transition-all hover:border-[var(--brand)]
                      hover:bg-[var(--brand)] hover:text-white
                      active:scale-90
                    "
                    aria-label={hu ? 'Iránycsere' : 'Inversează'}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick direction selector tabs (for lines with custom direction names) */}
            {activeLine.directionNames && (
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedLineDirection('outbound')}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
                    selectedLineDirection === 'outbound'
                      ? 'bg-white text-[var(--text-h)] font-black shadow-xs ring-2 ring-[var(--brand)]'
                      : 'bg-white/60 text-[var(--text-muted)] font-medium hover:bg-white hover:text-[var(--text-h)]'
                  }`}
                >
                  <span className="text-[9px] uppercase font-extrabold text-[var(--text-muted)]">
                    {hu ? 'Odafelé' : 'Tur'}
                  </span>
                  <span className="truncate w-full text-[11px] font-bold text-[var(--brand)]">
                    {activeLine.directionNames.outbound[language]}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLineDirection('return')}
                  className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
                    selectedLineDirection === 'return'
                      ? 'bg-white text-[var(--text-h)] font-black shadow-xs ring-2 ring-[var(--brand)]'
                      : 'bg-white/60 text-[var(--text-muted)] font-medium hover:bg-white hover:text-[var(--text-h)]'
                  }`}
                >
                  <span className="text-[9px] uppercase font-extrabold text-[var(--text-muted)]">
                    {hu ? 'Visszafelé' : 'Retur'}
                  </span>
                  <span className="truncate w-full text-[11px] font-bold text-[var(--brand)]">
                    {activeLine.directionNames.return[language]}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}