import { Layers, X } from 'lucide-react';

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
  const { language, lineName } = useBusData();

  const selectedLineId = useAppStore(
    (s) => s.selectedLineId,
  );

  const setSelectedLineId = useAppStore(
    (s) => s.setSelectedLineId,
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
      )}
    </div>
  );
}