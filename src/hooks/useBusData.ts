import { useEffect, useMemo, useState } from 'react';
import { getLineById, lines, schedules, stops } from '../data/busData';
import type { DepartureCountdown, Language, Line, Stop } from '../types/bus';
import {
  buildDepartureCountdowns,
  getUpcomingDepartures,
} from '../utils/timeUtils';
import { useAppStore } from '../store/useAppStore';

const TICK_MS = 15_000;

function stopName(stop: Stop, language: Language): string {
  return language === 'hu' ? stop.name_hu : stop.name_ro;
}

function lineName(line: Line, language: Language): string {
  return language === 'hu' ? line.name_hu : line.name_ro;
}

export function getLineEndpoints(
  line: Line,
  direction: 'outbound' | 'return',
  language: Language,
): { start: string; end: string } {
  if (line.directionNames) {
    const outboundText = line.directionNames.outbound[language];
    const returnText = line.directionNames.return[language];
    if (direction === 'outbound') {
      return {
        start: returnText.replace(/( felé|Spre )/gi, '').trim(),
        end: outboundText.replace(/( felé|Spre )/gi, '').trim(),
      };
    }
    return {
      start: outboundText.replace(/( felé|Spre )/gi, '').trim(),
      end: returnText.replace(/( felé|Spre )/gi, '').trim(),
    };
  }

  const stopIds =
    direction === 'return'
      ? [...line.stopIds].reverse()
      : line.stopIds;

  const firstStop = stops.find((s) => s.id === stopIds[0]);
  const lastStop = stops.find((s) => s.id === stopIds[stopIds.length - 1]);

  return {
    start: firstStop ? (language === 'hu' ? firstStop.name_hu : firstStop.name_ro) : '',
    end: lastStop ? (language === 'hu' ? lastStop.name_hu : lastStop.name_ro) : '',
  };
}

/**
 * Live bus data: filtered stops/lines, search, and departure countdowns.
 * Countdowns refresh every 15s.
 */
export function useBusData() {
  const language = useAppStore((s) => s.language);
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const selectedLineDirection = useAppStore((s) => s.selectedLineDirection);
  const toggleSelectedLineDirection = useAppStore(
    (s) => s.toggleSelectedLineDirection,
  );
  const selectedStopId = useAppStore((s) => s.selectedStopId);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const linesById = useMemo(() => {
    const map = new Map(lines.map((l) => [l.id, l]));
    return map;
  }, []);

  const selectedLine = useMemo(
    () => (selectedLineId ? getLineById(selectedLineId) ?? null : null),
    [selectedLineId],
  );

  const orderedLineStops = useMemo(() => {
    if (!selectedLine) return [];
    const stopIds =
      selectedLine.directionStopIds?.[selectedLineDirection] ??
      (selectedLineDirection === 'return'
        ? [...selectedLine.stopIds].reverse()
        : selectedLine.stopIds);

    return stopIds
      .map((id) => stops.find((s) => s.id === id))
      .filter((s): s is Stop => Boolean(s));
  }, [selectedLine, selectedLineDirection]);

  const filteredStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (selectedLine) {
      if (!q) return orderedLineStops;
      return orderedLineStops.filter(
        (stop) =>
          stop.name_hu.toLowerCase().includes(q) ||
          stop.name_ro.toLowerCase().includes(q),
      );
    }

    return stops.filter((stop) => {
      if (!q) return true;
      return (
        stop.name_hu.toLowerCase().includes(q) ||
        stop.name_ro.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedLine, orderedLineStops]);

  const lineEndpoints = useMemo(() => {
    if (!selectedLine) return null;
    return getLineEndpoints(selectedLine, selectedLineDirection, language);
  }, [selectedLine, selectedLineDirection, language]);

  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) ?? null,
    [selectedStopId],
  );

  const stopDepartures: DepartureCountdown[] = useMemo(() => {
    if (!selectedStop) return [];
    const stopSchedules = schedules.filter((sch) => {
      if (sch.stopId !== selectedStop.id) return false;
      if (selectedLineId && sch.lineId !== selectedLineId) return false;
      return true;
    });
    return buildDepartureCountdowns(stopSchedules, linesById, now);
  }, [selectedStop, selectedLineId, linesById, now]);

  /** Next few timed departures per schedule at the selected stop (for StopCard list) */
  const upcomingByLine = useMemo(() => {
    if (!selectedStop) return [];

    const stopSchedules = schedules.filter((sch) => {
      if (sch.stopId !== selectedStop.id) return false;
      if (selectedLineId && sch.lineId !== selectedLineId) return false;
      return true;
    });

    return stopSchedules
      .map((sch) => {
        const line = linesById.get(sch.lineId);
        if (!line) return null;
        const upcoming = getUpcomingDepartures(sch, 4, now);
        return { line, schedule: sch, upcoming };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => {
        const aMin = a.upcoming[0]?.minutesUntil ?? Number.POSITIVE_INFINITY;
        const bMin = b.upcoming[0]?.minutesUntil ?? Number.POSITIVE_INFINITY;
        return aMin - bMin;
      });
  }, [selectedStop, selectedLineId, linesById, now]);

  return {
    language,
    now,
    lines,
    stops,
    schedules,
    filteredStops,
    selectedStop,
    selectedLine,
    selectedLineId,
    selectedLineDirection,
    toggleSelectedLineDirection,
    lineEndpoints,
    orderedLineStops,
    stopDepartures,
    upcomingByLine,
    stopName: (stop: Stop) => stopName(stop, language),
    lineName: (line: Line) => lineName(line, language),
  };
}

export type UseBusDataReturn = ReturnType<typeof useBusData>;
