import type { Line, Schedule, Stop, TripOption, TripSegment } from '../types/bus';
import { getUpcomingDepartures } from './timeUtils';

const MIN_TRANSFER_MINUTES = 2;
const MAX_TRANSFERS = 3;
const MAX_DEPARTURES_PER_BOARDING = 3;
const MAX_RIDE_MINUTES = 180;
const MAX_SEARCH_STATES = 1_200;
const TRANSFER_PENALTY_MINUTES = 8;
const LONG_WAIT_THRESHOLD_MINUTES = 25;
const LONG_WAIT_EXTRA_WEIGHT = 2;

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStop(location: { lat: number; lng: number }, stops: Stop[]): Stop | null {
  return stops.reduce<Stop | null>((nearest, stop) => !nearest || getDistanceKm(location.lat, location.lng, stop.lat, stop.lng) < getDistanceKm(location.lat, location.lng, nearest.lat, nearest.lng) ? stop : nearest, null);
}

export function formatDateToHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function normalizedDirection(schedule: Schedule): string | null {
  const value = schedule.direction?.ro ?? schedule.direction?.hu;
  return value ? value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() : null;
}

type TimedDeparture = { schedule: Schedule; label: string; date: Date };
type SearchState = { stopId: string; availableAt: Date; segments: TripSegment[]; visitedStopIds: Set<string> };

function waitingMinutes(segments: TripSegment[], requestedDeparture: Date): number[] {
  return segments.map((segment, index) => Math.max(0, Math.round((segment.departureAt.getTime() - (index ? segments[index - 1].arrivalAt : requestedDeparture).getTime()) / 60_000)));
}

function rankOption(option: Omit<TripOption, 'totalWaitingMinutes' | 'longWaitPenaltyMinutes' | 'weightedCostMinutes'>, requestedDeparture: Date) {
  const waits = waitingMinutes(option.segments, requestedDeparture);
  const totalWaitingMinutes = waits.reduce((total, wait) => total + wait, 0);
  const longWaitPenaltyMinutes = waits.reduce((total, wait) => total + Math.max(0, wait - LONG_WAIT_THRESHOLD_MINUTES) * LONG_WAIT_EXTRA_WEIGHT, 0);
  const weightedCostMinutes = option.totalDurationMinutes + option.transferCount * TRANSFER_PENALTY_MINUTES + longWaitPenaltyMinutes;
  return { ...option, totalWaitingMinutes, longWaitPenaltyMinutes, weightedCostMinutes };
}

/** True when `a` is no worse on every traveller-relevant criterion than `b`. */
function dominates(a: TripOption, b: TripOption): boolean {
  const arrivalA = a.segments.at(-1)!.arrivalAt.getTime();
  const arrivalB = b.segments.at(-1)!.arrivalAt.getTime();
  const departureA = a.firstDepartureAt.getTime();
  const departureB = b.firstDepartureAt.getTime();
  // Same arrival: a later first departure always leaves the passenger with
  // less time spent travelling/waiting before reaching that same outcome.
  if (arrivalA === arrivalB && departureA > departureB) return true;
  const noWorse = arrivalA <= arrivalB
    && departureA >= departureB
    && a.transferCount <= b.transferCount
    && a.totalWaitingMinutes <= b.totalWaitingMinutes
    && a.weightedCostMinutes <= b.weightedCostMinutes;
  const strictlyBetter = arrivalA < arrivalB
    || departureA > departureB
    || a.transferCount < b.transferCount
    || a.totalWaitingMinutes < b.totalWaitingMinutes
    || a.weightedCostMinutes < b.weightedCostMinutes;
  return noWorse && strictlyBetter;
}

/**
 * Time-dependent timetable routing.
 *
 * The source provides scheduled times at individual stops and a direction for
 * each service, not an assumed travel speed. An edge is therefore valid only
 * when the destination publishes a later time for the same line and direction.
 * This fixes reverse-direction journeys and makes all displayed arrival and
 * transfer times come from the source timetable.
 */
export function planTrip(originStopId: string, destinationStopId: string, departureAfter: Date, schedules: Schedule[], lines: Line[], stops: Stop[]): TripOption[] {
  if (!originStopId || !destinationStopId || originStopId === destinationStopId || Number.isNaN(departureAfter.getTime())) return [];

  const stopById = new Map(stops.map((stop) => [stop.id, stop]));
  const lineById = new Map(lines.map((line) => [line.id, line]));
  if (!stopById.has(originStopId) || !stopById.has(destinationStopId)) return [];

  const byStopAndLine = new Map<string, Schedule[]>();
  const byLineAndDirection = new Map<string, Schedule[]>();
  for (const schedule of schedules) {
    if (!lineById.has(schedule.lineId)) continue;
    const stopKey = `${schedule.stopId}|${schedule.lineId}`;
    byStopAndLine.set(stopKey, [...(byStopAndLine.get(stopKey) ?? []), schedule]);
    const direction = normalizedDirection(schedule);
    if (direction) {
      const directionKey = `${schedule.lineId}|${direction}`;
      byLineAndDirection.set(directionKey, [...(byLineAndDirection.get(directionKey) ?? []), schedule]);
    }
  }

  const nextDepartures = (schedule: Schedule, after: Date, count = MAX_DEPARTURES_PER_BOARDING): TimedDeparture[] =>
    getUpcomingDepartures(schedule, count, after)
      .map((item) => ({ schedule, label: item.timeLabel, date: item.departureAt }))
      .filter((item) => item.date.getTime() >= after.getTime() - 30_000);

  const options: TripOption[] = [];
  const queue: SearchState[] = [{ stopId: originStopId, availableAt: departureAfter, segments: [], visitedStopIds: new Set([originStopId]) }];
  let expandedStates = 0;

  while (queue.length && expandedStates++ < MAX_SEARCH_STATES) {
    queue.sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime());
    const state = queue.shift()!;
    if (state.segments.length > MAX_TRANSFERS + 1) continue;

    for (const line of lines) {
      const boardingSchedules = byStopAndLine.get(`${state.stopId}|${line.id}`) ?? [];
      const earliestBoarding = state.segments.length ? new Date(state.availableAt.getTime() + MIN_TRANSFER_MINUTES * 60_000) : state.availableAt;

      for (const boardingSchedule of boardingSchedules) {
        const direction = normalizedDirection(boardingSchedule);
        if (!direction) continue;
        const destinationSchedules = byLineAndDirection.get(`${line.id}|${direction}`) ?? [];

        for (const departure of nextDepartures(boardingSchedule, earliestBoarding)) {
          for (const arrivalSchedule of destinationSchedules) {
            if (arrivalSchedule.stopId === state.stopId || state.visitedStopIds.has(arrivalSchedule.stopId)) continue;
            const arrivalStop = stopById.get(arrivalSchedule.stopId);
            const fromStop = stopById.get(state.stopId);
            if (!arrivalStop || !fromStop) continue;
            const arrival = nextDepartures(arrivalSchedule, new Date(departure.date.getTime() + 1_000), 1)[0];
            if (!arrival) continue;
            const durationMinutes = Math.round((arrival.date.getTime() - departure.date.getTime()) / 60_000);
            if (durationMinutes < 1 || durationMinutes > MAX_RIDE_MINUTES) continue;

            const segment: TripSegment = {
              line, fromStop, toStop: arrivalStop, viaStops: [fromStop, arrivalStop],
              departureTimeLabel: departure.label, departureAt: departure.date,
              arrivalTimeLabel: arrival.label, arrivalAt: arrival.date, durationMinutes,
              minutesUntilDeparture: Math.max(0, Math.ceil((departure.date.getTime() - departureAfter.getTime()) / 60_000)),
              schedule: boardingSchedule,
            };
            const segments = [...state.segments, segment];
            if (arrivalStop.id === destinationStopId) {
              options.push(rankOption({
                id: segments.map((item) => `${item.line.id}-${item.fromStop.id}-${item.toStop.id}-${item.departureAt.getTime()}`).join('_'),
                isDirect: segments.length === 1, segments, totalDurationMinutes: Math.max(0, Math.ceil((arrival.date.getTime() - departureAfter.getTime()) / 60_000)),
                transferCount: segments.length - 1, transferStop: segments[1]?.fromStop,
                transferWaitMinutes: segments[1] ? Math.max(0, Math.round((segments[1].departureAt.getTime() - segments[0].arrivalAt.getTime()) / 60_000)) : undefined,
                firstDepartureAt: segments[0].departureAt, minutesUntilFirstDeparture: Math.max(0, Math.ceil((segments[0].departureAt.getTime() - departureAfter.getTime()) / 60_000)),
              }, departureAfter));
            } else if (segments.length <= MAX_TRANSFERS) {
              queue.push({ stopId: arrivalStop.id, availableAt: arrival.date, segments, visitedStopIds: new Set([...state.visitedStopIds, arrivalStop.id]) });
            }
          }
        }
      }
    }
  }

  const unique = new Map<string, TripOption>();
  for (const option of options) {
    const key = `${option.segments.map((segment) => `${segment.line.id}:${segment.fromStop.id}:${segment.toStop.id}`).join('|')}:${option.firstDepartureAt.getTime()}`;
    if (!unique.has(key)) unique.set(key, option);
  }
  const paretoOptimal = [...unique.values()].filter((option, index, all) => !all.some((candidate, candidateIndex) => candidateIndex !== index && dominates(candidate, option)));
  return paretoOptimal
    .sort((a, b) => a.weightedCostMinutes - b.weightedCostMinutes || a.totalDurationMinutes - b.totalDurationMinutes || a.transferCount - b.transferCount || a.firstDepartureAt.getTime() - b.firstDepartureAt.getTime())
    .slice(0, 8);
}
