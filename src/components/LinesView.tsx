import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Map as MapIcon,
  Navigation,
  Route,
  Search,
  X,
} from 'lucide-react';
import { lines, schedules, getStopById } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData, getLineEndpoints } from '../hooks/useBusData';
import { MapView } from './Map';
import type { Schedule } from '../types/bus';

export function LinesView() {
  const language = useAppStore((s) => s.language);
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const selectedDirection = useAppStore((s) => s.selectedLineDirection);
  const toggleSelectedLineDirection = useAppStore((s) => s.toggleSelectedLineDirection);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setFullScheduleStopId = useAppStore((s) => s.setFullScheduleStopId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const { stopName, lineName } = useBusData();
  const hu = language === 'hu';

  // Active Line
  const currentLine = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0];
  }, [selectedLineId]);

  // Search filter for stops within current line
  const [stopSearch, setStopSearch] = useState('');

  // Active View Mode: 'grid' (Compact Station Cards) | 'metro' (Horizontal Ribbon) | 'map' (Integrated Map)
  const [viewMode, setViewMode] = useState<'grid' | 'metro' | 'map'>('grid');

  // Stop sequence for chosen direction
  const activeStopIds = useMemo(() => {
    if (selectedDirection === 'return' && currentLine.directionStopIds?.return) {
      return currentLine.directionStopIds.return;
    }
    if (selectedDirection === 'return' && currentLine.returnStopIds) {
      return currentLine.returnStopIds;
    }
    if (selectedDirection === 'outbound' && currentLine.directionStopIds?.outbound) {
      return currentLine.directionStopIds.outbound;
    }
    if (selectedDirection === 'outbound' && currentLine.outboundStopIds) {
      return currentLine.outboundStopIds;
    }
    return currentLine.stopIds;
  }, [currentLine, selectedDirection]);

  // Compute endpoints
  const endpoints = useMemo(() => {
    return getLineEndpoints(currentLine, selectedDirection, language);
  }, [currentLine, selectedDirection, language]);

  // Current clock for departures
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Full stop items data
  const stopsData = useMemo(() => {
    return activeStopIds
      .map((stopId, idx) => {
        const stop = getStopById(stopId);
        if (!stop) return null;

        const stopSchedules = schedules.filter((s: Schedule) => s.stopId === stopId);
        const lineSchedule = stopSchedules.find((s: Schedule) => s.lineId === currentLine.id);

        let nextTimeLabel = '--:--';
        if (lineSchedule && lineSchedule.times.length > 0) {
          const nextTime = lineSchedule.times.find((t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m >= currentMinutes;
          }) || lineSchedule.times[0];

          nextTimeLabel = nextTime;
        }

        const isTrainStation =
          stop.name_hu.toLowerCase().includes('vasút') ||
          stop.name_ro.toLowerCase().includes('gara');
        const otherLines = stop.lineIds.filter((lid) => lid !== currentLine.id);

        return {
          stop,
          index: idx + 1,
          isStart: idx === 0,
          isTerminal: idx === activeStopIds.length - 1,
          nextTimeLabel,
          isTrainStation,
          otherLines,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [activeStopIds, currentLine.id, currentMinutes]);

  // Filtered stops by search query
  const filteredStops = useMemo(() => {
    const q = stopSearch.trim().toLowerCase();
    if (!q) return stopsData;
    return stopsData.filter((item) => {
      const s = item.stop;
      return (
        s.name_hu.toLowerCase().includes(q) ||
        s.name_ro.toLowerCase().includes(q)
      );
    });
  }, [stopsData, stopSearch]);

  // Estimated distance and time
  const calculatedDistance = (currentLine.stopIds.length * 0.65).toFixed(1);
  const calculatedTravelTime = Math.round(currentLine.stopIds.length * 1.8);

  const handleStopMapJump = (stopId: string) => {
    setSelectedLineId(currentLine.id);
    setSelectedStopId(stopId);
    requestFlyToStop(stopId);
    setActiveTab('map');
  };

  return (
    <div className="flex flex-col gap-5 w-full pb-10">
      {/* =========================================================================
          1. TOP HORIZONTAL LINE SELECTOR (Gyors járatváltó sor)
          ========================================================================= */}
      <div className="bg-white p-3.5 md:p-4 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-[#657933]" />
            <span className="text-xs md:text-sm font-black text-[#191d15] uppercase tracking-wider">
              {hu ? 'Válasszon járatot:' : 'Selectați linia:'}
            </span>
          </div>
          <span className="text-xs font-bold text-[#73796D]">
            {lines.length} {hu ? 'járat' : 'linii'}
          </span>
        </div>

        {/* Scrollable Horizontal Line Pills (Compact, large touch targets) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#DDE1D6] scrollbar-track-transparent">
          {lines.map((line) => {
            const isSelected = line.id === currentLine.id;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => setSelectedLineId(line.id)}
                className={`
                  flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-black transition-all shrink-0 cursor-pointer select-none
                  ${
                    isSelected
                      ? 'text-white shadow-md scale-102 ring-2 ring-offset-1 ring-[#657933]'
                      : 'bg-[#f8f9f4] hover:bg-[#ecefe2] text-[#191d15] border border-[#DDE1D6]'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? line.color : undefined,
                }}
              >
                <span
                  className={`flex h-6 min-w-6 px-1.5 items-center justify-center rounded-lg text-xs font-black ${
                    isSelected ? 'bg-white text-[#191d15]' : 'text-white'
                  }`}
                  style={{ backgroundColor: isSelected ? '#ffffff' : line.color }}
                >
                  {line.number}
                </span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] text-left">
                  {lineName(line)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. SELECTED LINE MASTER CONTROL CARD (Kompakt információs fejléc)
          ========================================================================= */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-4">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE1D6] pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 min-w-12 px-3 items-center justify-center rounded-2xl text-lg md:text-xl font-black text-white shadow-md shrink-0"
              style={{ backgroundColor: currentLine.color }}
            >
              {currentLine.number}
            </span>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-[#191d15] tracking-tight">
                  {currentLine.number}. {hu ? 'járat' : 'linia'}
                </h1>
                <span className="flex items-center gap-1 text-[#3F8F5B] bg-[#3F8F5B]/15 text-xs font-black px-2.5 py-1 rounded-xl">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{hu ? 'Közlekedik' : 'Activ'}</span>
                </span>
              </div>
              <p className="text-xs md:text-sm font-semibold text-[#505747] mt-0.5">
                {lineName(currentLine)}
              </p>
            </div>
          </div>

          {/* Action Buttons (Direction Switcher + Full Timetable) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectedLineDirection}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#f2f5e8] hover:bg-[#657933] hover:text-white text-[#191d15] font-black text-xs md:text-sm border-2 border-[#657933] shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4 stroke-[2.5px]" />
              <span>{hu ? 'Menetirány fordítása' : 'Schimbă sensul'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedules')}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#657933] hover:bg-[#4e5e26] text-white font-black text-xs md:text-sm shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              <span>{hu ? 'Menetrend' : 'Orar'}</span>
            </button>
          </div>
        </div>

        {/* Route Direction & Endpoints Indicator */}
        <div className="bg-[#f8f9f4] p-3.5 md:p-4 rounded-2xl border border-[#DDE1D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#73796D] shrink-0">
              {hu ? 'Útvonal:' : 'Traseu:'}
            </span>
            <div className="flex items-center gap-1.5 font-black text-sm md:text-base text-[#191d15] truncate">
              <span className="truncate">{endpoints.start}</span>
              <ArrowRight className="h-4 w-4 text-[#657933] shrink-0 stroke-[3px]" />
              <span className="truncate">{endpoints.end}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-black text-[#505747] shrink-0">
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#DDE1D6]">
              📏 {calculatedDistance} km
            </span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#DDE1D6]">
              ⏱️ ~{calculatedTravelTime} {hu ? 'perc' : 'min'}
            </span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-[#DDE1D6]">
              🚏 {activeStopIds.length} {hu ? 'megálló' : 'stații'}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. VIEW MODE TOGGLE & SEARCH TOOLBAR (Nincs több függőleges túlnyúlás!)
          ========================================================================= */}
      <div className="bg-white p-4 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* View Mode Buttons (Grid Cards vs Metro Ribbon vs Integrated Map) */}
        <div className="flex items-center bg-[#f8f9f4] p-1 rounded-2xl border border-[#DDE1D6] self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`
              flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer
              ${
                viewMode === 'grid'
                  ? 'bg-[#657933] text-white shadow-2xs'
                  : 'text-[#505747] hover:text-[#191d15]'
              }
            `}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>{hu ? 'Kompakt rács' : 'Grilă stații'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('metro')}
            className={`
              flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer
              ${
                viewMode === 'metro'
                  ? 'bg-[#657933] text-white shadow-2xs'
                  : 'text-[#505747] hover:text-[#191d15]'
              }
            `}
          >
            <Route className="h-4 w-4" />
            <span>{hu ? 'Metró vonal' : 'Linie continuă'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`
              flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer
              ${
                viewMode === 'map'
                  ? 'bg-[#657933] text-white shadow-2xs'
                  : 'text-[#505747] hover:text-[#191d15]'
              }
            `}
          >
            <MapIcon className="h-4 w-4" />
            <span>{hu ? 'Térkép nézet' : 'Hartă'}</span>
          </button>
        </div>

        {/* Search Stop Filter Inside this Line */}
        <div className="relative flex items-center w-full sm:w-72">
          <Search className="absolute left-3.5 text-[#73796D] h-4 w-4 pointer-events-none" />
          <input
            type="text"
            value={stopSearch}
            onChange={(e) => setStopSearch(e.target.value)}
            placeholder={hu ? 'Megálló keresése a járaton...' : 'Caută stație pe această linie...'}
            className="w-full bg-[#f8f9f4] hover:bg-[#ecefe2] focus:bg-white text-sm font-bold text-[#191d15] placeholder-[#73796D] pl-10 pr-9 py-2.5 rounded-xl border border-[#DDE1D6] focus:border-[#657933] outline-none transition-colors"
          />
          {stopSearch && (
            <button
              type="button"
              onClick={() => setStopSearch('')}
              className="absolute right-3 text-[#73796D] hover:text-[#191d15] p-0.5 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          4. CONTENT SECTION - VIEW 1: COMPACT GRID OF STATIONS (Kártyarács)
          ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStops.map((item) => {
            const isTerminal = item.isStart || item.isTerminal;
            return (
              <div
                key={`${item.stop.id}-${item.index}`}
                className="bg-white p-4 rounded-2xl border-2 border-[#DDE1D6] hover:border-[#657933] transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`
                        w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs
                        ${
                          isTerminal
                            ? 'bg-[#657933] text-white ring-2 ring-[#ecefe2]'
                            : 'bg-[#ecefe2] text-[#191d15]'
                        }
                      `}
                    >
                      {item.index}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm md:text-base text-[#191d15] truncate group-hover:text-[#657933] transition-colors">
                        {stopName(item.stop)}
                      </h3>
                      <p className="text-[11px] font-bold text-[#73796D]">
                        {item.isStart
                          ? hu ? '🚩 Kiinduló állomás' : '🚩 Stație de pornire'
                          : item.isTerminal
                          ? hu ? '🏁 Végállomás' : '🏁 Capăt de linie'
                          : hu ? 'Megállóhely' : 'Stație'}
                      </p>
                    </div>
                  </div>

                  {/* Next departure time badge */}
                  <span className="px-2.5 py-1 rounded-lg bg-[#ecefe2] text-[#191d15] font-black text-xs border border-[#DDE1D6] shrink-0">
                    {item.nextTimeLabel}
                  </span>
                </div>

                {/* Transfer Badges */}
                {item.otherLines.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap text-xs pt-1">
                    <span className="text-[11px] font-bold text-[#73796D]">
                      {hu ? 'Átszállás:' : 'Legături:'}
                    </span>
                    {item.otherLines.slice(0, 4).map((lid) => {
                      const l = lines.find((line) => line.id === lid);
                      if (!l) return null;
                      return (
                        <span
                          key={lid}
                          style={{ backgroundColor: l.color }}
                          className="px-1.5 py-0.5 rounded text-white font-black text-[10px] shadow-2xs"
                        >
                          {l.number}
                        </span>
                      );
                    })}
                    {item.otherLines.length > 4 && (
                      <span className="text-[10px] font-bold text-[#73796D]">
                        +{item.otherLines.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ecefe2]">
                  <button
                    type="button"
                    onClick={() => handleStopMapJump(item.stop.id)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#f8f9f4] hover:bg-[#ecefe2] text-xs font-black text-[#191d15] border border-[#DDE1D6] transition-colors cursor-pointer"
                  >
                    <Navigation className="h-3.5 w-3.5 text-[#657933]" />
                    <span>{hu ? 'Térképen' : 'Pe hartă'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFullScheduleStopId(item.stop.id)}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-[#657933] hover:bg-[#4e5e26] text-xs font-black text-white transition-colors shadow-2xs cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{hu ? 'Menetrend' : 'Orar'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          5. CONTENT SECTION - VIEW 2: HORIZONTAL METRO RIBBON (Metró vonal)
          ========================================================================= */}
      {viewMode === 'metro' && (
        <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-[#DDE1D6] shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#73796D] uppercase tracking-wider">
              {hu ? 'Állomások egymás után (Vízszintes folyamat):' : 'Secvența stațiilor:'}
            </span>
            <span className="text-xs font-bold text-[#657933]">
              {stopsData.length} {hu ? 'megálló' : 'stații'}
            </span>
          </div>

          {/* Horizontal Subway Ribbon */}
          <div className="overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-[#657933] scrollbar-track-[#ecefe2]">
            <div className="flex items-center min-w-max px-4">
              {stopsData.map((item, idx) => {
                const isStart = item.isStart;
                const isTerminal = item.isTerminal;
                const isLast = idx === stopsData.length - 1;

                return (
                  <div key={`${item.stop.id}-${item.index}`} className="flex items-center">
                    {/* Station Node */}
                    <div
                      onClick={() => handleStopMapJump(item.stop.id)}
                      className="flex flex-col items-center gap-2 cursor-pointer group w-36 text-center"
                    >
                      {/* Circle Badge */}
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110 shadow-sm
                          ${
                            isStart || isTerminal
                              ? 'bg-[#657933] text-white ring-4 ring-[#ecefe2]'
                              : 'bg-white border-4 border-[#657933] text-[#191d15]'
                          }
                        `}
                      >
                        {item.index}
                      </div>

                      {/* Station Name */}
                      <span className="font-black text-xs md:text-sm text-[#191d15] line-clamp-2 px-1 group-hover:text-[#657933] transition-colors">
                        {stopName(item.stop)}
                      </span>

                      {/* Next departure pill */}
                      <span className="px-2 py-0.5 rounded-md bg-[#ecefe2] text-[#505747] font-black text-[11px]">
                        {item.nextTimeLabel}
                      </span>
                    </div>

                    {/* Connecting Route Line */}
                    {!isLast && (
                      <div className="w-12 h-2 rounded-full bg-[#657933] -mt-10 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. CONTENT SECTION - VIEW 3: INTEGRATED MAP VIEW
          ========================================================================= */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl border-2 border-[#DDE1D6] overflow-hidden shadow-sm flex flex-col h-[550px] relative">
          <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#DDE1D6] shadow-sm flex items-center gap-2 pointer-events-none">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: currentLine.color }}
            />
            <span className="text-xs md:text-sm font-black text-[#191d15]">
              {currentLine.number}. {hu ? 'járat útvonala' : 'traseu linia'} ({endpoints.start} ➔ {endpoints.end})
            </span>
          </div>

          <div className="w-full h-full">
            <MapView />
          </div>
        </div>
      )}
    </div>
  );
}
