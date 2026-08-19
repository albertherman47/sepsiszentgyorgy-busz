import { useMemo } from 'react';
import {
  Accessibility,
  ArrowUpDown,
  Bus,
  Calendar,
  Train,
} from 'lucide-react';
import { getStopById, schedules } from '../data/busData';
import { useBusData } from '../hooks/useBusData';
import { useAppStore } from '../store/useAppStore';
import type { Line, Stop, Schedule } from '../types/bus';

interface RouteStopTimelineProps {
  line: Line;
}

export function RouteStopTimeline({ line }: RouteStopTimelineProps) {
  const language = useAppStore((s) => s.language);
  const selectedDirection = useAppStore((s) => s.selectedLineDirection);
  const toggleSelectedLineDirection = useAppStore((s) => s.toggleSelectedLineDirection);
  const selectedStopId = useAppStore((s) => s.selectedStopId);
  const setSelectedStopId = useAppStore((s) => s.setSelectedStopId);
  const requestFlyToStop = useAppStore((s) => s.requestFlyToStop);
  const setFullScheduleStopId = useAppStore((s) => s.setFullScheduleStopId);

  const { stopName } = useBusData();
  const hu = language === 'hu';

  // Determine the stop IDs sequence for the chosen direction
  const activeStopIds = useMemo(() => {
    if (selectedDirection === 'return' && line.directionStopIds?.return) {
      return line.directionStopIds.return;
    }
    if (selectedDirection === 'return' && line.returnStopIds) {
      return line.returnStopIds;
    }
    if (selectedDirection === 'outbound' && line.directionStopIds?.outbound) {
      return line.directionStopIds.outbound;
    }
    if (selectedDirection === 'outbound' && line.outboundStopIds) {
      return line.outboundStopIds;
    }
    return line.stopIds;
  }, [line, selectedDirection]);

  // Compute upcoming departures for each stop along this line
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const stopsData = useMemo(() => {
    return activeStopIds
      .map((stopId, idx) => {
        const stop = getStopById(stopId);
        if (!stop) return null;

        const stopSchedules = schedules.filter((s: Schedule) => s.stopId === stopId);
        const lineSchedule = stopSchedules.find((s: Schedule) => s.lineId === line.id);

        let nextTimeLabel = '--:--';
        if (lineSchedule && lineSchedule.times.length > 0) {
          // Find next time in list
          const nextTime = lineSchedule.times.find((t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m >= currentMinutes;
          }) || lineSchedule.times[0];

          nextTimeLabel = nextTime || lineSchedule.times[0];
        }

        // Realistic stop facilities
        const isTrainStation =
          stop.name_hu.toLowerCase().includes('vasút') ||
          stop.name_ro.toLowerCase().includes('gara');
        const otherLines = stop.lineIds.filter((lid) => lid !== line.id);

        return {
          stop,
          index: idx + 1,
          isTerminal: idx === activeStopIds.length - 1 || idx === 0,
          nextTimeLabel,
          isTrainStation,
          otherLinesCount: otherLines.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [activeStopIds, line.id, currentMinutes]);

  const handleStopClick = (stop: Stop) => {
    setSelectedStopId(stop.id);
    requestFlyToStop(stop.id);
  };

  return (
    <div className="bg-white rounded-xl border border-[#DDE1D6] flex flex-col h-full overflow-hidden shadow-2xs">
      {/* Sticky Header */}
      <div className="p-4 border-b border-[#DDE1D6] bg-white sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-[#191d15] flex items-center gap-2">
            <span>{hu ? 'Járat megállói' : 'Route Stops'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ecefe2] text-[#657933]">
              {stopsData.length} {hu ? 'megálló' : 'stații'}
            </span>
          </h3>
          <p className="text-xs text-[#73796D] mt-0.5 truncate">
            {selectedDirection === 'outbound'
              ? line.directionNames?.outbound[language] || (hu ? 'Oda irány' : 'Dus')
              : line.directionNames?.return[language] || (hu ? 'Vissza irány' : 'Întors')}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleSelectedLineDirection}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-[#657933] bg-[#ecefe2] text-xs md:text-sm font-extrabold text-[#191d15] hover:bg-[#657933] hover:text-white transition-all cursor-pointer shadow-2xs"
          title={hu ? 'Menetirány megfordítása' : 'Schimbă sensul'}
        >
          <ArrowUpDown className="h-4 w-4 text-[#657933]" />
          <span>{hu ? 'Irányváltás' : 'Sens'}</span>
        </button>
      </div>

      {/* Stop Sequence Timeline */}
      <div className="flex-1 overflow-y-auto p-4 pl-5 relative">
        {/* Continuous Vertical Line */}
        <div className="absolute left-[36px] top-8 bottom-8 w-1 bg-[#DDE1D6] rounded-full" />

        <div className="flex flex-col gap-4 relative z-10">
          {stopsData.map((item) => {
            const isSelected = selectedStopId === item.stop.id;
            const isTerminal = item.isTerminal;

            return (
              <div
                key={`${item.stop.id}-${item.index}`}
                onClick={() => handleStopClick(item.stop)}
                className="flex gap-3.5 group cursor-pointer active:bg-[#ecefe2]/50 p-2 rounded-xl transition-colors"
              >
                {/* Timeline Node Badge */}
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm mt-0.5 shadow-2xs shrink-0 font-black transition-all
                    ${
                      isSelected || isTerminal
                        ? 'bg-[#657933] border-[#657933] text-white scale-105 ring-2 ring-[#ecefe2]'
                        : 'border-[#657933] bg-white text-[#657933] group-hover:bg-[#ecefe2]'
                    }
                  `}
                >
                  {item.index}
                </div>

                {/* Stop Content */}
                <div className="flex-1 pb-3 border-b border-[#DDE1D6] group-last:border-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h4
                      className={`text-base leading-snug transition-colors font-bold ${
                        isSelected
                          ? 'text-[#657933] font-black underline'
                          : 'text-[#191d15] group-hover:text-[#657933]'
                      }`}
                    >
                      {stopName(item.stop)}
                    </h4>

                    <span
                      className={`text-xs md:text-sm font-extrabold px-2.5 py-1 rounded-lg shrink-0 ${
                        isTerminal
                          ? 'bg-[#657933] text-white'
                          : 'bg-[#ecefe2] text-[#191d15] border border-[#DDE1D6]'
                      }`}
                    >
                      {item.nextTimeLabel}
                    </span>
                  </div>

                  {/* Transfer & Accessibility Badges + Menetrend button */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#505747] mt-2">
                    <span className="flex items-center gap-1 bg-[#3F8F5B]/10 text-[#3F8F5B] px-2 py-0.5 rounded-md font-bold text-[11px]" title="Akadálymentes">
                      <Accessibility className="h-3.5 w-3.5" />
                      <span>{hu ? 'Akadálymentes' : 'Accesibil'}</span>
                    </span>

                    {item.isTrainStation && (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        <Train className="h-3.5 w-3.5 text-amber-700" />
                        <span>CFR Vasútállomás</span>
                      </span>
                    )}

                    {item.otherLinesCount > 0 && (
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        <Bus className="h-3.5 w-3.5 text-blue-700" />
                        <span>+{item.otherLinesCount} {hu ? 'átszállás' : 'linii'}</span>
                      </span>
                    )}

                    {/* Button to view full stop schedule */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullScheduleStopId(item.stop.id);
                      }}
                      className="ml-auto text-xs font-black text-[#657933] bg-[#ecefe2] hover:bg-[#657933] hover:text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-[#DDE1D6]"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{hu ? 'Menetrend' : 'Orar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
