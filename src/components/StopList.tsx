import { useState, useMemo } from 'react';
import { Clock, MapPin, Navigation, Search, X } from 'lucide-react';
import { stops, lines, schedules } from '../data/busData';
import { useAppStore } from '../store/useAppStore';
import { useBusData } from '../hooks/useBusData';
import type { Stop, Schedule } from '../types/bus';

export function StopList() {
  const language = useAppStore((s) => s.language);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setFullScheduleStopId = useAppStore((s) => s.setFullScheduleStopId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const { stopName } = useBusData();
  const hu = language === 'hu';

  const [query, setQuery] = useState('');

  // Compute upcoming departures for all stops
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const filteredStops = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stops
      .filter((s: Stop) => {
        if (!q) return true;
        return (
          s.name_hu.toLowerCase().includes(q) ||
          s.name_ro.toLowerCase().includes(q)
        );
      })
      .sort((a: Stop, b: Stop) => stopName(a).localeCompare(stopName(b)));
  }, [query, stopName]);

  const handleStopClick = (stop: Stop) => {
    setSelectedStopId(stop.id);
    requestFlyToStop(stop.id);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header Banner */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-[#DDE1D6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[#191d15] flex items-center gap-2.5">
            <MapPin className="h-6 w-6 text-[#657933]" />
            <span>{hu ? 'Sepsiszentgyörgyi buszmegállók' : 'Stații de autobuz Sfântu Gheorghe'}</span>
          </h2>
          <p className="text-sm font-semibold text-[#505747] mt-1">
            {hu
              ? `Összesen ${stops.length} megállóhely a városban. Kattintson a járatokért és menetrendért!`
              : `Total ${stops.length} stații în oraș. Click pentru orare și plecări!`}
          </p>
        </div>

        {/* Large Accessible Search Bar */}
        <div className="relative flex items-center w-full md:w-96">
          <Search className="absolute left-4 text-[#73796D] h-5 w-5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hu ? 'Megálló keresése név szerint...' : 'Caută stație după nume...'}
            className="w-full pl-12 pr-10 py-3.5 bg-[#ecefe2] hover:bg-white focus:bg-white border-2 border-[#DDE1D6] focus:border-[#657933] rounded-xl text-base font-bold text-[#191d15] placeholder:text-[#73796D] outline-none transition-all shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 p-1.5 rounded-lg text-[#73796D] hover:text-[#191d15] hover:bg-[#DDE1D6]"
              aria-label="Keresés törlése"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stop Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStops.map((stop, idx) => {
          // Find lines passing through this stop
          const stopLines = lines.filter((l) => stop.lineIds.includes(l.id));

          // Find next departure from this stop
          const stopSchedules = schedules.filter((s: Schedule) => s.stopId === stop.id);
          let nextTime: string | null = null;
          let nextLineNumber: string | null = null;

          for (const sch of stopSchedules) {
            const match = sch.times.find((t: string) => {
              const [h, m] = t.split(':').map(Number);
              return h * 60 + m >= currentMinutes;
            });
            if (match) {
              if (!nextTime || match < nextTime) {
                nextTime = match;
                const foundLine = lines.find((l) => l.id === sch.lineId);
                nextLineNumber = foundLine ? foundLine.number : '';
              }
            }
          }

          return (
            <div
              key={`${stop.id}-${idx}`}
              className="bg-white rounded-2xl border-2 border-[#DDE1D6] hover:border-[#657933] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div>
                {/* Stop Name & Code */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-[#ecefe2] text-[#657933] font-black text-base flex items-center justify-center shrink-0 group-hover:bg-[#657933] group-hover:text-white transition-colors shadow-2xs">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3
                        onClick={() => handleStopClick(stop)}
                        className="text-base md:text-lg font-black text-[#191d15] group-hover:text-[#657933] cursor-pointer transition-colors leading-tight truncate"
                      >
                        {stopName(stop)}
                      </h3>
                      <p className="text-xs font-semibold text-[#73796D] mt-0.5">
                        ID: <span className="font-mono">{stop.id}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lines Serving this Stop */}
                <div className="mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#73796D] block mb-1.5">
                    {hu ? 'Érintett járatok:' : 'Linii:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {stopLines.map((l) => (
                      <span
                        key={l.id}
                        style={{ backgroundColor: l.color }}
                        className="px-2.5 py-1 rounded-lg text-white font-extrabold text-xs shadow-2xs"
                      >
                        {l.number}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Next Departure Time Badge */}
                {nextTime && (
                  <div className="bg-[#f2f5e8] rounded-xl p-2.5 flex items-center justify-between border border-[#DDE1D6]">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#505747]">
                      <Clock className="h-4 w-4 text-[#657933]" />
                      <span>{hu ? 'Következő busz:' : 'Următorul:'}</span>
                    </div>
                    <span className="font-black text-sm text-[#191d15] px-2 py-0.5 bg-white rounded-lg border border-[#DDE1D6]">
                      {nextTime} ({nextLineNumber}. {hu ? 'járat' : 'linia'})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Large, high contrast, senior friendly) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ecefe2]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStopId(stop.id);
                    setActiveTab('map');
                    requestFlyToStop(stop.id);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-[#DDE1D6] hover:bg-[#ecefe2] text-xs font-black text-[#191d15] transition-all cursor-pointer"
                >
                  <Navigation className="h-4 w-4 text-[#657933]" />
                  <span>{hu ? 'Térképen' : 'Pe hartă'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFullScheduleStopId(stop.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#657933] hover:bg-[#4d601d] text-white text-xs font-black transition-all shadow-2xs cursor-pointer"
                >
                  <Clock className="h-4 w-4" />
                  <span>{hu ? 'Menetrend' : 'Orar'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
