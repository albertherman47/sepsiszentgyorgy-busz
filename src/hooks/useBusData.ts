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

/**
 * Live bus data: filtered stops/lines, search, and departure countdowns.
 * Countdowns refresh every 15s.
 */
export function useBusData() {
  const language = useAppStore((s) => s.language);
  const selectedLineId = useAppStore((s) => s.selectedLineId);
  const selectedLineDirection = useAppStore((s) => s.selectedLineDirection);
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

  const filteredStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stops.filter((stop) => {
      if (selectedLineId && !stop.lineIds.includes(selectedLineId)) {
        return false;
      }
      if (selectedLineId === 'line-5d') {
        const line = lines.find((item) => item.id === selectedLineId);
        if (!(line?.directionStopIds?.[selectedLineDirection] ?? []).includes(stop.id)) return false;
      }
      if (!q) return true;
      return (
        stop.name_hu.toLowerCase().includes(q) ||
        stop.name_ro.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedLineId, selectedLineDirection]);

  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) ?? null,
    [selectedStopId],
  );

  const selectedLine = useMemo(
    () => (selectedLineId ? getLineById(selectedLineId) ?? null : null),
    [selectedLineId],
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
    stopDepartures,
    upcomingByLine,
    stopName: (stop: Stop) => stopName(stop, language),
    lineName: (line: Line) => lineName(line, language),
  };
}

export type UseBusDataReturn = ReturnType<typeof useBusData>;
