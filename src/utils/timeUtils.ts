const parseCache = new Map<string, { hours: number, minutes: number }>();
import type { DepartureCountdown, Line, Schedule } from '../types/bus';

/** Parse "HH:MM" into hours and minutes, normalizing 24:xx to 00:xx */
export function parseTimeLabel(time: string): { hours: number; minutes: number } {
  let [h, m] = time.split(':').map(Number);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  if (h >= 24) h = h % 24;
  return { hours: h, minutes: m };
}

/** Build a Date for today at the given "HH:MM" (local time) */
export function timeLabelToDate(time: string, now: Date = new Date()): Date {
  
  let cacheKey = time;
  let cached = parseCache.get(cacheKey);
  if (!cached) {
    cached = parseTimeLabel(time);
    parseCache.set(cacheKey, cached);
  }
  const { hours, minutes } = cached;
  const d = new Date(now.getTime());
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Active timetable for a schedule given the day */
export function getActiveTimes(schedule: Schedule, date: Date = new Date()): string[] {
  if (isWeekend(date) && schedule.weekendTimes?.length) {
    return schedule.weekendTimes;
  }
  return schedule.times;
}

/**
 * Next departure for a schedule relative to `now`.
 * If all of today's times have passed, rolls to the first departure tomorrow.
 */
export function getNextDeparture(
  schedule: Schedule,
  now: Date = new Date(),
): { departureAt: Date; timeLabel: string; minutesUntil: number } | null {
  const times = getActiveTimes(schedule, now);
  if (times.length === 0) return null;

  for (const timeLabel of times) {
    const departureAt = timeLabelToDate(timeLabel, now);
    const diffMs = departureAt.getTime() - now.getTime();
    if (diffMs >= -30_000) {
      // Allow showing "now" for up to 30s past the scheduled time
      const minutesUntil = Math.max(0, Math.ceil(diffMs / 60_000));
      return { departureAt, timeLabel, minutesUntil };
    }
  }

  // Roll to first departure tomorrow (use tomorrow's day-type for weekend)
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowTimes = getActiveTimes(schedule, tomorrow);
  const first = tomorrowTimes[0];
  if (!first) return null;

  const departureAt = timeLabelToDate(first, tomorrow);
  const minutesUntil = Math.ceil((departureAt.getTime() - now.getTime()) / 60_000);
  return { departureAt, timeLabel: first, minutesUntil };
}

/** Upcoming departures (next N) for a schedule */
export function getUpcomingDepartures(
  schedule: Schedule,
  count: number,
  now: Date = new Date(),
): Array<{ departureAt: Date; timeLabel: string; minutesUntil: number }> {
  const times = getActiveTimes(schedule, now);
  const results: Array<{ departureAt: Date; timeLabel: string; minutesUntil: number }> = [];

  for (const timeLabel of times) {
    const departureAt = timeLabelToDate(timeLabel, now);
    const diffMs = departureAt.getTime() - now.getTime();
    if (diffMs >= -30_000) {
      results.push({
        departureAt,
        timeLabel,
        minutesUntil: Math.max(0, Math.ceil(diffMs / 60_000)),
      });
      if (results.length >= count) return results;
    }
  }

  // Fill remaining from tomorrow
  if (results.length < count) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = getActiveTimes(schedule, tomorrow);
    for (const timeLabel of tomorrowTimes) {
      const departureAt = timeLabelToDate(timeLabel, tomorrow);
      results.push({
        departureAt,
        timeLabel,
        minutesUntil: Math.ceil((departureAt.getTime() - now.getTime()) / 60_000),
      });
      if (results.length >= count) break;
    }
  }

  return results;
}

export function buildDepartureCountdowns(
  schedules: Schedule[],
  linesById: Map<string, Line>,
  now: Date = new Date(),
): DepartureCountdown[] {
  const out: DepartureCountdown[] = [];

  for (const schedule of schedules) {
    const line = linesById.get(schedule.lineId);
    if (!line) continue;
    const next = getNextDeparture(schedule, now);
    if (!next) continue;
    out.push({
      schedule,
      line,
      departureAt: next.departureAt,
      minutesUntil: next.minutesUntil,
      timeLabel: next.timeLabel,
    });
  }

  return out.sort((a, b) => a.minutesUntil - b.minutesUntil);
}

/** Human-readable countdown for HU/RO UI */
export function formatCountdown(
  minutesUntil: number,
  lang: 'hu' | 'ro',
): string {
  if (minutesUntil <= 0) {
    return lang === 'hu' ? 'Most' : 'Acum';
  }
  if (minutesUntil === 1) {
    return lang === 'hu' ? '1 perc' : '1 min';
  }
  if (minutesUntil < 60) {
    return lang === 'hu' ? `${minutesUntil} perc` : `${minutesUntil} min`;
  }
  const hours = Math.floor(minutesUntil / 60);
  const mins = minutesUntil % 60;
  if (lang === 'hu') {
    return mins > 0 ? `${hours} ó ${mins} p` : `${hours} óra`;
  }
  return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
}
