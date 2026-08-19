import { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  Bus,
  Clock,
  LayoutGrid,
  ListOrdered,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import { lines, schedules, getStopById } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData, getLineEndpoints } from '../hooks/useBusData';
import type { Line, Schedule, Stop } from '../types/bus';

type DayType = 'weekday' | 'saturday' | 'sunday';
type ViewMode = 'cards' | 'matrix';

export function TimetableManagement() {
  const language = useAppStore((s) => s.language);
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const setSelectedLineId = useAppStore((s) => s.setSelectedLineId);
  const selectedDirection = useAppStore((s) => s.selectedLineDirection);
  const toggleSelectedLineDirection = useAppStore((s) => s.toggleSelectedLineDirection);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const { lineName, stopName } = useBusData();
  const hu = language === 'hu';

  const [activeDayType, setActiveDayType] = useState<DayType>('weekday');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [stopSearch, setStopSearch] = useState('');

  // Currently selected line (defaults to Line 1)
  const activeLine: Line = useMemo(() => {
    return lines.find((l) => l.id === selectedLineId) || lines[0];
  }, [selectedLineId]);

  // Endpoints for active line in selected direction
  const endpoints = useMemo(() => {
    return getLineEndpoints(activeLine, selectedDirection, language);
  }, [activeLine, selectedDirection, language]);

  // Ordered stop IDs for active line & direction
  const stopSequenceIds = useMemo(() => {
    if (selectedDirection === 'return') {
      if (activeLine.directionStopIds?.return && activeLine.directionStopIds.return.length > 0) {
        return activeLine.directionStopIds.return;
      }
      if (activeLine.returnStopIds && activeLine.returnStopIds.length > 0) {
        return activeLine.returnStopIds;
      }
      return [...activeLine.stopIds].reverse();
    } else {
      if (activeLine.directionStopIds?.outbound && activeLine.directionStopIds.outbound.length > 0) {
        return activeLine.directionStopIds.outbound;
      }
      if (activeLine.outboundStopIds && activeLine.outboundStopIds.length > 0) {
        return activeLine.outboundStopIds;
      }
      return activeLine.stopIds;
    }
  }, [activeLine, selectedDirection]);

  // Resolved list of Stop objects for ONLY this line in active direction
  const activeStops = useMemo(() => {
    return stopSequenceIds
      .map((id) => getStopById(id))
      .filter((s): s is Stop => s !== undefined);
  }, [stopSequenceIds]);

  // Origin stop and its schedules
  const originStop = activeStops[0];
  const originSchedule = useMemo(() => {
    if (!originStop) return null;
    const stopSchedules = schedules.filter((s: Schedule) => s.stopId === originStop.id);
    return stopSchedules.find((s: Schedule) => s.lineId === activeLine.id) || null;
  }, [originStop, activeLine.id]);

  // Base departure times from origin stop for selected day
  const baseTimes = useMemo(() => {
    let timesList: string[] = [];
    if (originSchedule) {
      if (activeDayType === 'weekday') {
        timesList = originSchedule.times;
      } else {
        timesList = originSchedule.weekendTimes || originSchedule.times;
      }
    }

    if (timesList.length === 0) {
      timesList = [
        '05:30', '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
        '09:00', '09:30', '10:00', '11:00', '12:00', '12:30', '13:00',
        '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '20:00', '21:00',
      ];
    }

    return Array.from(new Set(timesList)).sort((a, b) => {
      const [ah, am] = a.split(':').map(Number);
      const [bh, bm] = b.split(':').map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });
  }, [originSchedule, activeDayType]);

  // Build complete stop departure schedules for each stop along this line
  const stopTimetables = useMemo(() => {
    return activeStops.map((stop, stopIdx) => {
      const stopSchedules = schedules.filter((s: Schedule) => s.stopId === stop.id);
      const lineSched = stopSchedules.find((s: Schedule) => s.lineId === activeLine.id);
      const explicitTimes = lineSched
        ? activeDayType === 'weekday'
          ? lineSched.times
          : lineSched.weekendTimes || lineSched.times
        : [];

      // Calculate time for every departure trip of this line
      const departures = baseTimes.map((baseTime, tripIdx) => {
        if (explicitTimes[tripIdx]) {
          return explicitTimes[tripIdx];
        }
        // Offset +2.5 mins per stop
        const [h, m] = baseTime.split(':').map(Number);
        const totalMinutes = h * 60 + m + Math.round(stopIdx * 2.5);
        const calcH = Math.floor((totalMinutes / 60) % 24);
        const calcM = totalMinutes % 60;
        return `${String(calcH).padStart(2, '0')}:${String(calcM).padStart(2, '0')}`;
      });

      // Group departures by hour for clean structured rendering
      const byHour: Record<string, string[]> = {};
      departures.forEach((t) => {
        const hour = t.split(':')[0];
        if (!byHour[hour]) byHour[hour] = [];
        byHour[hour].push(t);
      });

      return {
        stop,
        stopIndex: stopIdx + 1,
        departures,
        byHour,
      };
    });
  }, [activeStops, activeLine.id, activeDayType, baseTimes]);

  // Filter stops if user uses in-view search
  const filteredStopTimetables = useMemo(() => {
    if (!stopSearch.trim()) return stopTimetables;
    const q = stopSearch.toLowerCase();
    return stopTimetables.filter(
      (item) =>
        item.stop.name_hu.toLowerCase().includes(q) ||
        item.stop.name_ro.toLowerCase().includes(q),
    );
  }, [stopTimetables, stopSearch]);

  // Helper: check if a time is in peak hours (07:00-08:59, 15:00-16:59)
  const isPeakHour = (timeStr: string) => {
    const [h] = timeStr.split(':').map(Number);
    return (h >= 7 && h < 9) || (h >= 15 && h < 17);
  };

  // Navigate to stop on map
  const handleStopClick = (stop: Stop) => {
    setSelectedLineId(activeLine.id);
    setSelectedStopId(stop.id);
    requestFlyToStop(stop.id);
    setActiveTab('map');
  };

  return (
    <div className="flex flex-col gap-4 w-full pb-8">
      {/* 1. Header Section - Large & Clear */}
      <div className="bg-white p-5 md:p-7 rounded-2xl border border-[#DDE1D6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-3.5 py-1 text-white font-extrabold text-sm rounded-lg shadow-2xs"
              style={{ backgroundColor: activeLine.color || '#657933' }}
            >
              {activeLine.number}. {hu ? 'járat' : 'linia'}
            </span>
            <span className="text-xs md:text-sm font-semibold text-[#73796D]">
              {activeStops.length} {hu ? 'megálló' : 'stații'} • {baseTimes.length} {hu ? 'járat / nap' : 'curse / zi'}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191d15] tracking-tight">
            {hu ? 'Menetrendek' : 'Orare'}
          </h2>

          <p className="text-sm md:text-base text-[#73796D] mt-1 font-medium flex items-center gap-2">
            <Bus className="h-4 w-4 text-[#657933] shrink-0" />
            <span className="font-bold text-[#191d15]">
              {activeLine.number}. {lineName(activeLine)}
            </span>
          </p>
        </div>

        {/* View Mode Toggle: Stop Cards vs Full Matrix Table */}
        <div className="flex items-center gap-2 bg-[#ecefe2] p-1.5 rounded-xl border border-[#DDE1D6] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer
              ${
                viewMode === 'cards'
                  ? 'bg-white text-[#191d15] shadow-xs'
                  : 'text-[#73796D] hover:text-[#191d15]'
              }
            `}
          >
            <ListOrdered className="h-4 w-4 text-[#657933]" />
            <span>{hu ? 'Megállók szerinti lista' : 'Listă pe stații'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer
              ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#191d15] shadow-xs'
                  : 'text-[#73796D] hover:text-[#191d15]'
              }
            `}
          >
            <LayoutGrid className="h-4 w-4 text-[#657933]" />
            <span>{hu ? 'Táblázat nézet' : 'Tabel complet'}</span>
          </button>
        </div>
      </div>

      {/* 2. Big Line Selector Pills */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE1D6] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-[#73796D]">
            {hu ? 'Válasszon járatot:' : 'Alege linia:'}
          </span>
          <span className="text-xs text-[#73796D] font-semibold">
            {lines.length} {hu ? 'elérhető vonal' : 'linii disponibile'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {lines.map((l) => {
            const isSelected = l.id === activeLine.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLineId(l.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl font-extrabold text-sm md:text-base shrink-0 transition-all cursor-pointer shadow-2xs
                  ${
                    isSelected
                      ? 'bg-[#657933] text-white ring-2 ring-[#657933] ring-offset-2 scale-102'
                      : 'bg-[#ecefe2] text-[#191d15] hover:bg-[#e1e4d7] active:scale-95'
                  }
                `}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                  style={{ backgroundColor: l.color || '#657933' }}
                />
                <span>{l.number}. {hu ? 'járat' : 'linia'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Visual Direction Banner & Big Direction Switcher */}
      <div className="bg-[#657933]/10 border-2 border-[#657933]/30 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-[#657933] text-white text-xs font-black uppercase px-2.5 py-0.5 rounded-md">
              {selectedDirection === 'outbound' ? (hu ? 'ODA IRÁNY' : 'SENSUL DUS') : hu ? 'VISSZA IRÁNY' : 'SENSUL ÎNTORS'}
            </span>
            <span className="text-xs font-bold text-[#657933]">
              {hu ? 'Aktuális útvonalirány' : 'Direcția curentă'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-base md:text-xl font-extrabold text-[#191d15] mt-1">
            <span className="text-[#657933] underline decoration-2 underline-offset-4">
              {endpoints.start}
            </span>
            <ArrowRight className="h-5 w-5 text-[#657933] stroke-3 shrink-0" />
            <span className="text-[#191d15]">
              {endpoints.end}
            </span>
          </div>
        </div>

        {/* Big Interactive Direction Switcher Button */}
        <button
          type="button"
          onClick={toggleSelectedLineDirection}
          className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-[#ecefe2] text-[#191d15] font-extrabold text-sm md:text-base border-2 border-[#657933] shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowUpDown className="h-5 w-5 text-[#657933] stroke-3" />
          <span>{hu ? 'Irány megfordítása' : 'Schimbă sensul (Oda ↔ Vissza)'}</span>
        </button>
      </div>

      {/* 4. Day Type Tabs & In-view Search Filter */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#DDE1D6] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Large Day Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveDayType('weekday')}
            className={`
              px-5 py-3 rounded-xl text-sm md:text-base font-bold transition-all cursor-pointer
              ${
                activeDayType === 'weekday'
                  ? 'bg-[#657933] text-white shadow-sm'
                  : 'bg-[#ecefe2] text-[#73796D] hover:text-[#191d15] hover:bg-[#e1e4d7]'
              }
            `}
          >
            {hu ? 'Hétfő – Péntek (Munkanap)' : 'Luni – Vineri'}
          </button>

          <button
            type="button"
            onClick={() => setActiveDayType('saturday')}
            className={`
              px-5 py-3 rounded-xl text-sm md:text-base font-bold transition-all cursor-pointer
              ${
                activeDayType === 'saturday'
                  ? 'bg-[#657933] text-white shadow-sm'
                  : 'bg-[#ecefe2] text-[#73796D] hover:text-[#191d15] hover:bg-[#e1e4d7]'
              }
            `}
          >
            {hu ? 'Szombat' : 'Sâmbătă'}
          </button>

          <button
            type="button"
            onClick={() => setActiveDayType('sunday')}
            className={`
              px-5 py-3 rounded-xl text-sm md:text-base font-bold transition-all cursor-pointer
              ${
                activeDayType === 'sunday'
                  ? 'bg-[#657933] text-white shadow-sm'
                  : 'bg-[#ecefe2] text-[#73796D] hover:text-[#191d15] hover:bg-[#e1e4d7]'
              }
            `}
          >
            {hu ? 'Vasárnap / Ünnepnap' : 'Duminică / Sărbători'}
          </button>
        </div>

        {/* Search within this line's stops */}
        <div className="relative flex items-center min-w-[240px]">
          <Search className="absolute left-3.5 text-[#73796D] h-4 w-4 pointer-events-none" />
          <input
            type="text"
            value={stopSearch}
            onChange={(e) => setStopSearch(e.target.value)}
            placeholder={hu ? 'Megálló keresése ezen a járaton...' : 'Caută stație pe această linie...'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#ecefe2] border border-[#DDE1D6] rounded-xl text-sm text-[#191d15] placeholder:text-[#73796D] focus:bg-white focus:border-[#657933] focus:ring-1 focus:ring-[#657933] outline-none transition-all"
          />
        </div>
      </div>

      {/* 5. Main Content: Stop-by-Stop Detailed Schedule Cards (Default) or Matrix Table */}
      {viewMode === 'cards' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-extrabold text-[#191d15]">
              {hu ? 'A járat megállói menetrendi sorrendben:' : 'Stațiile liniei în ordinea traseului:'}
            </span>
            <span className="text-xs font-semibold text-[#73796D] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#657933]" />
              {hu ? 'Kattintson egy megállóra a térképes megjelenítéshez' : 'Click pe o stație pentru hartă'}
            </span>
          </div>

          {filteredStopTimetables.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#DDE1D6] text-center text-sm font-semibold text-[#73796D]">
              {hu ? 'Nincs találat a keresett megállóra ezen a járaton.' : 'Nicio stație găsită pe această linie.'}
            </div>
          ) : (
            filteredStopTimetables.map((item) => {
              const isOrigin = item.stopIndex === 1;
              const isDestination = item.stopIndex === activeStops.length;

              return (
                <div
                  key={`${item.stop.id}-${item.stopIndex}`}
                  className="bg-white rounded-2xl border border-[#DDE1D6] p-5 md:p-6 shadow-sm hover:border-[#657933] transition-all flex flex-col gap-4"
                >
                  {/* Stop Title Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#ecefe2] pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-[#657933] text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {item.stopIndex}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base md:text-lg font-bold text-[#191d15] hover:text-[#657933] cursor-pointer transition-colors" onClick={() => handleStopClick(item.stop)}>
                            {stopName(item.stop)}
                          </h3>
                          {isOrigin && (
                            <span className="px-2 py-0.5 bg-[#3F8F5B]/10 text-[#3F8F5B] text-xs font-bold rounded-md">
                              {hu ? 'Induló állomás' : 'Punct de plecare'}
                            </span>
                          )}
                          {isDestination && (
                            <span className="px-2 py-0.5 bg-[#657933]/10 text-[#657933] text-xs font-bold rounded-md">
                              {hu ? 'Végállomás' : 'Capăt de linie'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#73796D] mt-0.5">
                          {hu ? 'Megálló kód' : 'Cod stație'}: <span className="font-mono">{item.stop.id}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStopClick(item.stop)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DDE1D6] bg-[#ecefe2]/50 hover:bg-[#ecefe2] text-xs font-bold text-[#657933] transition-colors cursor-pointer self-start md:self-auto"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{hu ? 'Megálló a térképen' : 'Vezi pe hartă'}</span>
                    </button>
                  </div>

                  {/* Structured Departures by Hour */}
                  <div className="flex flex-col gap-2.5">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#73796D] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#657933]" />
                      <span>{hu ? 'Indulási / érkezési időpontok ennél a megállónál:' : 'Ore de sosire / plecare la această stație:'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                      {Object.entries(item.byHour).map(([hour, timesInHour]) => {
                        const hourNum = parseInt(hour, 10);
                        const isPeak = (hourNum >= 7 && hourNum < 9) || (hourNum >= 15 && hourNum < 17);

                        return (
                          <div
                            key={hour}
                            className={`
                              p-3 rounded-xl border flex items-center gap-3 transition-colors
                              ${
                                isPeak
                                  ? 'bg-[#d4ec98]/20 border-[#657933]/40'
                                  : 'bg-[#F7F8F4] border-[#DDE1D6]'
                              }
                            `}
                          >
                            <span className="text-sm font-black text-[#191d15] w-8 shrink-0">
                              {hour}:00
                            </span>
                            <div className="flex flex-wrap gap-1.5 flex-1">
                              {timesInHour.map((t) => (
                                <span
                                  key={t}
                                  className={`
                                    px-2.5 py-1 rounded-lg text-xs md:text-sm font-extrabold shadow-2xs
                                    ${
                                      isPeak
                                        ? 'bg-[#657933] text-white'
                                        : 'bg-white text-[#191d15] border border-[#DDE1D6]'
                                    }
                                  `}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Full Matrix Table View */
        <div className="bg-white rounded-2xl border border-[#DDE1D6] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#DDE1D6] bg-[#ecefe2]/50 flex items-center justify-between">
            <span className="text-sm font-extrabold text-[#191d15]">
              {hu ? 'Járat menetrendi mátrix' : 'Matrice orar'} ({activeStops.length} {hu ? 'megálló' : 'stații'}, {baseTimes.length} {hu ? 'indulás' : 'plecări'})
            </span>
            <span className="text-xs font-semibold text-[#73796D]">
              {hu ? 'Görgessen vízszintesen az összes időponthoz' : 'Derulați orizontal pentru toate cursele'}
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="text-xs text-[#73796D] uppercase border-b border-[#DDE1D6] bg-[#f2f5e8]">
                  <th className="p-4 font-extrabold min-w-[220px] sticky left-0 bg-[#f2f5e8] border-r border-[#DDE1D6] z-10">
                    {hu ? 'Megállók sorrendben' : 'Stații în ordine'}
                  </th>
                  {baseTimes.map((time, colIdx) => {
                    const peak = isPeakHour(time);
                    return (
                      <th
                        key={`${time}-${colIdx}`}
                        className={`
                          p-3.5 font-black text-center w-20 text-xs md:text-sm transition-colors
                          ${peak ? 'bg-[#d4ec98]/40 text-[#4d601d]' : 'text-[#191d15]'}
                        `}
                      >
                        {time}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="text-xs md:text-sm text-[#191d15]">
                {filteredStopTimetables.map((row) => {
                  return (
                    <tr
                      key={`${row.stop.id}-${row.stopIndex}`}
                      className="border-b border-[#DDE1D6] hover:bg-[#F7F8F4] transition-colors"
                    >
                      {/* Sticky Stop Name Column */}
                      <td className="p-4 font-bold sticky left-0 bg-white hover:bg-[#F7F8F4] border-r border-[#DDE1D6] z-10">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-[#657933] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            {row.stopIndex}
                          </span>
                          <span className="truncate">{stopName(row.stop)}</span>
                        </div>
                      </td>

                      {/* Departures for each trip */}
                      {row.departures.map((t, tIdx) => {
                        const peak = isPeakHour(baseTimes[tIdx]);
                        return (
                          <td
                            key={tIdx}
                            className={`
                              p-3 text-center transition-colors font-bold
                              ${
                                peak
                                  ? 'bg-[#d4ec98]/15 font-black text-[#4d601d]'
                                  : 'text-[#191d15]'
                              }
                            `}
                          >
                            {t}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Bottom Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#DDE1D6] text-xs md:text-sm text-[#73796D]">
        <div className="flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4 text-[#657933]" />
          <span>
            {hu
              ? `A(z) ${activeLine.number}. járat menetrendje ${activeDayType === 'weekday' ? 'hétköznapokon' : activeDayType === 'saturday' ? 'szombaton' : 'vasárnap / ünnepnapokon'}.`
              : `Orarul liniei ${activeLine.number} în zilele selectate.`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-[#657933] text-white flex items-center justify-center text-[10px] font-black">
            ★
          </div>
          <span className="font-bold text-[#191d15]">
            {hu ? 'Kiemelt csúcsidőszak (07:00 – 09:00 & 15:00 – 17:00)' : 'Ore de vârf (07:00 – 09:00 & 15:00 – 17:00)'}
          </span>
        </div>
      </div>
    </div>
  );
}
