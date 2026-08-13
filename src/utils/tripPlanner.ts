import type { Line, Schedule, Stop, TripOption, TripSegment } from '../types/bus';
import { getActiveTimes, timeLabelToDate } from './timeUtils';

/** Haversine formula to compute distance in km between two lat/lng points */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Find the stop closest to a given GPS coordinate */
export function findNearestStop(
  location: { lat: number; lng: number },
  stops: Stop[],
): Stop | null {
  if (!stops.length) return null;
  let nearest: Stop | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const stop of stops) {
    const dist = getDistanceKm(location.lat, location.lng, stop.lat, stop.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = stop;
    }
  }

  return nearest;
}

/** Format Date to "HH:MM" */
export function formatDateToHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Calculate travel duration between two stop indices along a route (approx 2 mins per stop interval) */
export function estimateDurationMinutes(
  fromIdx: number,
  toIdx: number,
): number {
  const stopDiff = Math.abs(toIdx - fromIdx);
  return Math.max(3, stopDiff * 2);
}

/**
 * Plan trips from originStopId to destinationStopId using available schedules and lines.
 * Returns direct routes and 1-transfer routes, sorted by departure time and total duration.
 */
export function planTrip(
  originStopId: string,
  destinationStopId: string,
  now: Date = new Date(),
  schedules: Schedule[],
  lines: Line[],
  stops: Stop[],
): TripOption[] {
  if (
    !originStopId ||
    !destinationStopId ||
    originStopId === destinationStopId
  ) {
    return [];
  }

  const stopMap = new Map<string, Stop>(
    stops.map((stop) => [stop.id, stop]),
  );

  const originStop = stopMap.get(originStopId);
  const destinationStop = stopMap.get(destinationStopId);

  if (!originStop || !destinationStop) {
    return [];
  }

  const results: TripOption[] = [];

  /**
   * Returns all schedule departures for a specific line/stop,
   * converted into Date objects.
   */
  function getDepartures(
    stopId: string,
    lineId: string,
    fromTime: Date,
  ) {
    const relevantSchedules = schedules.filter(
      (schedule) =>
        schedule.stopId === stopId &&
        schedule.lineId === lineId,
    );

    const departures: Array<{
      schedule: Schedule;
      label: string;
      date: Date;
    }> = [];

    for (const schedule of relevantSchedules) {
      const activeTimes = getActiveTimes(
        schedule,
        fromTime,
      );

      for (const label of activeTimes) {
        const date = timeLabelToDate(
          label,
          fromTime,
        );

        if (date.getTime() >= fromTime.getTime() - 30_000) {
          departures.push({
            schedule,
            label,
            date,
          });
        }
      }
    }

    departures.sort(
      (a, b) =>
        a.date.getTime() -
        b.date.getTime(),
    );

    return departures;
  }

  /**
   * Calculate approximate travel time between two stops.
   *
   * The current data model does not contain exact travel
   * times between every pair of stops, therefore we use
   * the existing approximation.
   */
  function getTravelTime(
    line: Line,
    fromStopId: string,
    toStopId: string,
  ): number | null {
    const fromIndex =
      line.stopIds.indexOf(fromStopId);

    const toIndex =
      line.stopIds.indexOf(toStopId);

    if (
      fromIndex === -1 ||
      toIndex === -1 ||
      fromIndex >= toIndex
    ) {
      return null;
    }

    return estimateDurationMinutes(
      fromIndex,
      toIndex,
    );
  }

  // ===========================================================================
  // 1. DIRECT ROUTES
  // ===========================================================================

  for (const line of lines) {
    const duration = getTravelTime(
      line,
      originStopId,
      destinationStopId,
    );

    if (duration === null) {
      continue;
    }

    const departures = getDepartures(
      originStopId,
      line.id,
      now,
    );

    for (const departure of departures.slice(0, 3)) {
      const arrival = new Date(
        departure.date.getTime() +
        duration * 60_000,
      );

      const minutesUntilDeparture = Math.max(
        0,
        Math.ceil(
          (departure.date.getTime() -
            now.getTime()) /
          60_000,
        ),
      );

      const segment: TripSegment = {
        line,
        fromStop: originStop,
        toStop: destinationStop,
        departureTimeLabel: departure.label,
        departureAt: departure.date,
        arrivalTimeLabel:
          formatDateToHHMM(arrival),
        arrivalAt: arrival,
        durationMinutes: duration,
        minutesUntilDeparture,
        schedule: departure.schedule,
      };

      results.push({
        id: [
          'direct',
          line.id,
          departure.date.getTime(),
        ].join('-'),

        isDirect: true,

        segments: [segment],

        totalDurationMinutes:
          Math.max(
            0,
            Math.ceil(
              (arrival.getTime() -
                now.getTime()) /
              60_000,
            ),
          ),

        firstDepartureAt:
          departure.date,

        minutesUntilFirstDeparture:
          minutesUntilDeparture,
      });
    }
  }

  // ===========================================================================
  // 2. ONE TRANSFER
  // ===========================================================================

  const originLines = lines.filter(
    (line) =>
      line.stopIds.includes(originStopId),
  );

  const destinationLines = lines.filter(
    (line) =>
      line.stopIds.includes(destinationStopId),
  );

  for (const lineA of originLines) {
    const originIndex =
      lineA.stopIds.indexOf(originStopId);

    if (originIndex === -1) {
      continue;
    }

    /**
     * Every stop after the origin can potentially
     * be a transfer stop.
     */
    const possibleTransfers =
      lineA.stopIds.slice(originIndex + 1);

    for (const lineB of destinationLines) {
      if (lineA.id === lineB.id) {
        continue;
      }

      const destinationIndex =
        lineB.stopIds.indexOf(
          destinationStopId,
        );

      if (destinationIndex === -1) {
        continue;
      }

      for (const transferStopId of possibleTransfers) {
        if (
          transferStopId ===
          destinationStopId
        ) {
          continue;
        }

        const transferIndexB =
          lineB.stopIds.indexOf(
            transferStopId,
          );

        /**
         * The transfer must happen before
         * the destination on line B.
         */
        if (
          transferIndexB === -1 ||
          transferIndexB >=
          destinationIndex
        ) {
          continue;
        }

        const transferStop =
          stopMap.get(transferStopId);

        if (!transferStop) {
          continue;
        }

        const firstDuration =
          getTravelTime(
            lineA,
            originStopId,
            transferStopId,
          );

        const secondDuration =
          getTravelTime(
            lineB,
            transferStopId,
            destinationStopId,
          );

        if (
          firstDuration === null ||
          secondDuration === null
        ) {
          continue;
        }

        // ---------------------------------------------------------------------
        // Find first bus
        // ---------------------------------------------------------------------

        const firstDepartures =
          getDepartures(
            originStopId,
            lineA.id,
            now,
          );

        for (const firstDeparture of firstDepartures.slice(
          0,
          5,
        )) {
          const firstArrival =
            new Date(
              firstDeparture.date.getTime() +
              firstDuration * 60_000,
            );

          // -------------------------------------------------------------------
          // Find second bus AFTER first bus arrives
          // -------------------------------------------------------------------

          const secondDepartures =
            getDepartures(
              transferStopId,
              lineB.id,
              firstArrival,
            );

          for (const secondDeparture of secondDepartures) {
            const waitMinutes = Math.ceil(
              (secondDeparture.date.getTime() -
                firstArrival.getTime()) /
              60_000,
            );

            /**
             * Minimum 2 minutes for changing buses.
             * Maximum 60 minutes waiting.
             */
            if (
              waitMinutes < 2 ||
              waitMinutes > 60
            ) {
              continue;
            }

            const secondArrival =
              new Date(
                secondDeparture.date.getTime() +
                secondDuration * 60_000,
              );

            const minutesUntilDeparture =
              Math.max(
                0,
                Math.ceil(
                  (firstDeparture.date.getTime() -
                    now.getTime()) /
                  60_000,
                ),
              );

            const totalDuration =
              Math.max(
                0,
                Math.ceil(
                  (secondArrival.getTime() -
                    now.getTime()) /
                  60_000,
                ),
              );

            const firstSegment: TripSegment =
            {
              line: lineA,
              fromStop: originStop,
              toStop: transferStop,

              departureTimeLabel:
                firstDeparture.label,

              departureAt:
                firstDeparture.date,

              arrivalTimeLabel:
                formatDateToHHMM(
                  firstArrival,
                ),

              arrivalAt: firstArrival,

              durationMinutes:
                firstDuration,

              minutesUntilDeparture,

              schedule:
                firstDeparture.schedule,
            };

            const secondSegment: TripSegment =
            {
              line: lineB,
              fromStop: transferStop,
              toStop: destinationStop,

              departureTimeLabel:
                secondDeparture.label,

              departureAt:
                secondDeparture.date,

              arrivalTimeLabel:
                formatDateToHHMM(
                  secondArrival,
                ),

              arrivalAt: secondArrival,

              durationMinutes:
                secondDuration,

              minutesUntilDeparture:
                Math.max(
                  0,
                  Math.ceil(
                    (secondDeparture.date.getTime() -
                      now.getTime()) /
                    60_000,
                  ),
                ),

              schedule:
                secondDeparture.schedule,
            };

            results.push({
              id: [
                'transfer',
                lineA.id,
                lineB.id,
                transferStopId,
                firstDeparture.date.getTime(),
                secondDeparture.date.getTime(),
              ].join('-'),

              isDirect: false,

              segments: [
                firstSegment,
                secondSegment,
              ],

              transferStop,

              transferWaitMinutes:
                waitMinutes,

              totalDurationMinutes:
                totalDuration,

              firstDepartureAt:
                firstDeparture.date,

              minutesUntilFirstDeparture:
                minutesUntilDeparture,
            });

            /**
             * We only need the earliest useful
             * second bus for this first departure.
             */
            break;
          }
        }
      }
    }
  }

  // ===========================================================================
  // 3. REMOVE DUPLICATES
  // ===========================================================================

  const unique = new Map<
    string,
    TripOption
  >();

  for (const option of results) {
    const key = option.isDirect
      ? `direct-${option.segments[0].line.id}-${option.firstDepartureAt.getTime()}`
      : `transfer-${option.segments[0].line.id}-${option.segments[1]?.line.id}-${option.transferStop?.id}-${option.firstDepartureAt.getTime()}`;

    if (!unique.has(key)) {
      unique.set(key, option);
    }
  }

  const finalResults =
    Array.from(unique.values());

  // ===========================================================================
  // 4. SORT
  // ===========================================================================

  finalResults.sort((a, b) => {
    /**
     * Prefer the route that gets the passenger
     * to the destination earlier.
     */
    const arrivalA =
      a.segments[
        a.segments.length - 1
      ].arrivalAt.getTime();

    const arrivalB =
      b.segments[
        b.segments.length - 1
      ].arrivalAt.getTime();

    if (arrivalA !== arrivalB) {
      return arrivalA - arrivalB;
    }

    // If arrival is identical, prefer direct.
    if (
      a.isDirect !== b.isDirect
    ) {
      return a.isDirect ? -1 : 1;
    }

    return (
      a.firstDepartureAt.getTime() -
      b.firstDepartureAt.getTime()
    );
  });

  return finalResults.slice(0, 6);
}