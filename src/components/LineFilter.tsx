import { Layers, X } from 'lucide-react';
import type { Line } from '../types/bus';
import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';

interface LineFilterProps {
  lines: Line[];
  allLabel: string;
}

export function LineFilter({ lines, allLabel }: LineFilterProps) {
  const { language, lineName } = useBusData();
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);

  const activeLine = lines.find((l) => l.id === selectedLineId) ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {language === 'hu' ? 'Járat szűrése' : 'Filtrează linie'}
        </span>
        {selectedLineId && (
          <button
            type="button"
            onClick={() => setSelectedLineId(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            {language === 'hu' ? 'Összes mutatása' : 'Arată toate'}
          </button>
        )}
      </div>

      <div
        className="flex gap-2 overflow-x-auto py-1 px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Lines"
      >
        <button
          type="button"
          role="option"
          aria-selected={selectedLineId === null}
          onClick={() => setSelectedLineId(null)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
            selectedLineId === null
              ? 'bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/20 ring-2 ring-[var(--brand)] ring-offset-1'
              : 'bg-[var(--surface)] text-[var(--text-h)] ring-1 ring-[var(--border)] hover:border-[var(--brand)] hover:bg-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5 opacity-90" aria-hidden />
          {allLabel}
        </button>

        {lines.map((line) => {
          const active = selectedLineId === line.id;
          return (
            <button
              key={line.id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => setSelectedLineId(active ? null : line.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                active
                  ? 'scale-[1.03] text-white shadow-md ring-2 ring-offset-1'
                  : 'bg-[var(--surface)] text-[var(--text-h)] ring-1 ring-[var(--border)] hover:scale-[1.02] hover:bg-white'
              }`}
              style={{
                backgroundColor: active ? line.color : undefined,
                boxShadow: active ? `0 4px 12px ${line.color}45` : undefined,
                borderColor: !active ? line.color : undefined,
              }}
            >
              <span
                className="flex h-3 w-3 items-center justify-center rounded-full"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.95)' : line.color,
                }}
                aria-hidden
              />
              <span className="tracking-wide">{line.number}</span>
            </button>
          );
        })}
      </div>

      {activeLine && (
        <div
          className="flex items-center justify-between rounded-xl p-2.5 text-xs text-white shadow-sm transition-all"
          style={{ backgroundColor: activeLine.color }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-white/20 px-1.5 font-bold">
              {activeLine.number}
            </span>
            <span className="truncate font-medium">{lineName(activeLine)}</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLineId(null)}
            className="ml-2 rounded-lg bg-black/15 p-1 transition hover:bg-black/30"
            aria-label="Filter törlése"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

