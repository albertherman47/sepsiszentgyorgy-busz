import { useMemo } from 'react';
import { ArrowLeftRight, Bus, Menu, X } from 'lucide-react';
import { lines } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData, getLineEndpoints } from '../hooks/useBusData';

interface MapLineSelectorProps {
  onOpenMenu: () => void;
}

export function MapLineSelector({ onOpenMenu }: MapLineSelectorProps) {
  const language = useAppStore((s) => s.language);
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const selectedDirection = useAppStore((s) => s.selectedLineDirection);
  const toggleSelectedLineDirection = useAppStore((s) => s.toggleSelectedLineDirection);

  const { selectedLine, lineName } = useBusData();
  const hu = language === 'hu';

  const endpoints = useMemo(() => {
    if (!selectedLine) return null;
    return getLineEndpoints(selectedLine, selectedDirection, language);
  }, [selectedLine, selectedDirection, language]);

  return (
    <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-20 flex flex-col gap-2 pointer-events-auto max-w-full sm:max-w-xl">
      {/* Top Main Bar */}
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border-2 border-[#DDE1D6] shadow-xl">
        {/* Menu button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#ecefe2] hover:bg-[#DDE1D6] text-[#191d15] font-black text-xs sm:text-sm transition-all cursor-pointer shrink-0 min-h-[44px]"
          title={hu ? 'Menü megnyitása' : 'Deschide meniul'}
          aria-label={hu ? 'Menü' : 'Meniu'}
        >
          <Menu className="h-5 w-5 text-[#657933]" />
          <span className="hidden xs:inline">{hu ? 'Menü' : 'Meniu'}</span>
        </button>

        <div className="h-6 w-px bg-[#DDE1D6] shrink-0" />

        {/* Horizontal Line Badges Scroll Area */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 min-w-0">
          {/* All Lines button */}
          <button
            type="button"
            onClick={() => setSelectedLineId(null)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer min-h-[44px] shrink-0 ${
              selectedLineId === null
                ? 'bg-[#191d15] text-white shadow-md'
                : 'bg-[#f4f6ee] text-[#505747] hover:bg-[#ecefe2] hover:text-[#191d15]'
            }`}
          >
            <Bus className="h-4 w-4" />
            <span>{hu ? 'Összes járat' : 'Toate'}</span>
          </button>

          {/* Individual Line Pills */}
          {lines.map((line) => {
            const isSelected = selectedLineId === line.id;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLineId(isSelected ? null : line.id)}
                className={`flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer min-h-[44px] min-w-[44px] shrink-0 ${
                  isSelected
                    ? 'ring-3 ring-offset-1 ring-offset-white shadow-lg text-white font-black scale-105'
                    : 'bg-[#f4f6ee] text-[#191d15] hover:bg-[#ecefe2]'
                }`}
                style={{
                  backgroundColor: isSelected ? line.color : undefined,
                  color: isSelected ? '#ffffff' : undefined,
                  boxShadow: isSelected ? `0 4px 14px ${line.color}60` : undefined,
                }}
                title={`${line.number}. ${hu ? 'járat' : 'linia'}: ${lineName(line)}`}
              >
                {!isSelected && (
                  <span
                    className="h-2.5 w-2.5 rounded-full mr-1.5 shrink-0"
                    style={{ backgroundColor: line.color }}
                  />
                )}
                <span>{line.number}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Line Direction Bar (if a line is active) */}
      {selectedLine && endpoints && (
        <div className="flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border-2 border-[#DDE1D6] shadow-lg animate-in fade-in slide-in-from-top-2">
          {/* Line & Endpoint Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className="flex h-8 min-w-8 items-center justify-center rounded-xl text-xs sm:text-sm font-black text-white shadow-xs shrink-0"
              style={{ backgroundColor: selectedLine.color }}
            >
              {selectedLine.number}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#191d15] truncate">
                <span className="truncate">{endpoints.start}</span>
                <span className="text-[#657933] font-bold">➔</span>
                <span className="truncate">{endpoints.end}</span>
              </div>
              <p className="text-[11px] font-semibold text-[#73796D] truncate">
                {lineName(selectedLine)}
              </p>
            </div>
          </div>

          {/* Direction Swap Button */}
          <button
            type="button"
            onClick={() => toggleSelectedLineDirection()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#ecefe2] hover:bg-[#657933] hover:text-white text-[#191d15] text-xs font-bold transition-colors cursor-pointer shrink-0 min-h-[36px]"
            title={hu ? 'Menetirány megfordítása' : 'Schimbă sensul'}
          >
            <ArrowLeftRight className="h-4 w-4 text-[#657933] group-hover:text-white" />
            <span className="hidden xs:inline">{hu ? 'Irányváltás' : 'Sens'}</span>
          </button>

          {/* Clear Line Selection Button */}
          <button
            type="button"
            onClick={() => setSelectedLineId(null)}
            className="p-2 rounded-xl text-[#73796D] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
            title={hu ? 'Járat szűrés törlése' : 'Șterge filtrarea'}
            aria-label="Törlés"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
