import { getUpcomingDepartures, getNextDeparture } from './timeUtils';
export const ROUTING_CONFIG = {
    minTransferMinutes: 2,
    maxTransfers: 3,
    transferPenaltyMinutes: 5,
    walkingPenaltyMinutes: 2, // Added per walking edge
    maxWalkingMinutes: 15,
    maxRideMinutes: 180,
    maxSearchStates: 10_000,
    longWaitThresholdMinutes: 20,
    longWaitExtraWeight: 1.5,
};
// Distance in km between two lat/lng points
export function getDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function findNearestStop(location, stops) {
    return stops.reduce((nearest, stop) => !nearest || getDistanceKm(location.lat, location.lng, stop.lat, stop.lng) < getDistanceKm(location.lat, location.lng, nearest.lat, nearest.lng) ? stop : nearest, null);
}
function normalizedDirection(schedule) {
    const value = schedule.direction?.ro ?? schedule.direction?.hu;
    return value ? value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() : null;
}
class MinHeap {
    compare;
    heap = [];
    constructor(compare) {
        this.compare = compare;
    }
    get length() { return this.heap.length; }
    push(val) {
        this.heap.push(val);
        this.bubbleUp(this.heap.length - 1);
    }
    shift() {
        if (this.heap.length === 0)
            return undefined;
        const min = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return min;
    }
    bubbleUp(idx) {
        const val = this.heap[idx];
        while (idx > 0) {
            const parentIdx = Math.floor((idx - 1) / 2);
            const parent = this.heap[parentIdx];
            if (this.compare(val, parent) >= 0)
                break;
            this.heap[idx] = parent;
            idx = parentIdx;
        }
        this.heap[idx] = val;
    }
    sinkDown(idx) {
        const length = this.heap.length;
        const val = this.heap[idx];
        while (true) {
            const leftIdx = 2 * idx + 1;
            const rightIdx = 2 * idx + 2;
            let swapIdx = -1;
            let leftVal;
            if (leftIdx < length) {
                leftVal = this.heap[leftIdx];
                if (this.compare(leftVal, val) < 0)
                    swapIdx = leftIdx;
            }
            if (rightIdx < length) {
                const rightVal = this.heap[rightIdx];
                if ((swapIdx === -1 && this.compare(rightVal, val) < 0) ||
                    (swapIdx !== -1 && this.compare(rightVal, leftVal) < 0)) {
                    swapIdx = rightIdx;
                }
            }
            if (swapIdx === -1)
                break;
            this.heap[idx] = this.heap[swapIdx];
            idx = swapIdx;
        }
        this.heap[idx] = val;
    }
}
export function planTrip(originStopId, destinationStopId, departureAfter, schedules, lines, stops) {
    if (!originStopId || !destinationStopId || originStopId === destinationStopId || Number.isNaN(departureAfter.getTime()))
        return [];
    const stopById = new Map(stops.map(s => [s.id, s]));
    const lineById = new Map(lines.map(l => [l.id, l]));
    if (!stopById.has(originStopId) || !stopById.has(destinationStopId))
        return [];
    // Build Route Sequences
    const schedulesByRoute = new Map();
    for (const s of schedules) {
        const dir = normalizedDirection(s);
        if (!dir)
            continue;
        const key = `${s.lineId}|${dir}`;
        if (!schedulesByRoute.has(key))
            schedulesByRoute.set(key, { lineId: s.lineId, dir, schedules: [] });
        schedulesByRoute.get(key).schedules.push(s);
    }
    const routes = [];
    const scheduleLookup = new Map(); // key: lineId|dir|stopId
    const routesByStop = new Map();
    for (const { lineId, dir, schedules: routeSchedules } of schedulesByRoute.values()) {
        const stopScores = routeSchedules.map(s => {
            let times = s.times.length ? s.times : (s.weekendTimes ?? []);
            const mins = times.map(t => {
                let [h, m] = t.split(':').map(Number);
                if (h < 3)
                    h += 24; // Handle after midnight wraparound
                return h * 60 + m;
            }).sort((a, b) => a - b);
            const median = mins[Math.floor(mins.length / 2)] ?? 0;
            return { stopId: s.stopId, median };
        });
        stopScores.sort((a, b) => a.median - b.median);
        routes.push({
            lineId,
            direction: dir,
            stops: stopScores.map(s => s.stopId)
        });
        const lastRoute = routes[routes.length - 1];
        for (let i = 0; i < lastRoute.stops.length; i++) {
            const stopId = lastRoute.stops[i];
            if (!routesByStop.has(stopId))
                routesByStop.set(stopId, []);
            routesByStop.get(stopId).push({ route: lastRoute, stopIdx: i });
        }
        for (const s of routeSchedules) {
            scheduleLookup.set(`${lineId}|${dir}|${s.stopId}`, s);
        }
    }
    // Build walking edges
    const walkEdges = new Map();
    for (let i = 0; i < stops.length; i++) {
        for (let j = 0; j < stops.length; j++) {
            if (i === j)
                continue;
            const distKm = getDistanceKm(stops[i].lat, stops[i].lng, stops[j].lat, stops[j].lng);
            if (distKm <= 0.6) { // max 600m walking
                const walkMin = Math.ceil(distKm * 1000 / 70); // ~1.16 m/s
                if (walkMin <= ROUTING_CONFIG.maxWalkingMinutes) {
                    if (!walkEdges.has(stops[i].id))
                        walkEdges.set(stops[i].id, []);
                    walkEdges.get(stops[i].id).push({
                        toStopId: stops[j].id,
                        distanceMeters: Math.round(distKm * 1000),
                        durationMinutes: walkMin
                    });
                }
            }
        }
    }
    const queue = new MinHeap((a, b) => a.availableAt.getTime() - b.availableAt.getTime());
    queue.push({
        stopId: originStopId,
        availableAt: departureAfter,
        segments: [],
        visitedStopIds: new Set([originStopId]),
        transferCount: 0,
        walkMeters: 0
    });
    // Also add walking from origin!
    if (walkEdges.has(originStopId)) {
        for (const w of walkEdges.get(originStopId)) {
            const arrAt = new Date(departureAfter.getTime() + w.durationMinutes * 60000);
            queue.push({
                stopId: w.toStopId,
                availableAt: arrAt,
                segments: [{
                        isWalking: true,
                        fromStop: stopById.get(originStopId),
                        toStop: stopById.get(w.toStopId),
                        viaStops: [],
                        departureAt: departureAfter,
                        departureTimeLabel: `${departureAfter.getHours().toString().padStart(2, '0')}:${departureAfter.getMinutes().toString().padStart(2, '0')}`,
                        arrivalAt: arrAt,
                        arrivalTimeLabel: `${arrAt.getHours().toString().padStart(2, '0')}:${arrAt.getMinutes().toString().padStart(2, '0')}`,
                        durationMinutes: w.durationMinutes,
                        walkMeters: w.distanceMeters,
                        minutesUntilDeparture: 0
                    }],
                visitedStopIds: new Set([originStopId, w.toStopId]),
                transferCount: 0,
                walkMeters: w.distanceMeters,
                firstDepartureAt: departureAfter
            });
        }
    }
    // Pareto Frontier Tracking
    // A state is dominated if another state reaches the same stop with:
    // <= arrivalTime AND <= transferCount AND <= walkMeters AND >= firstDepartureAt
    const frontiers = new Map();
    function isDominant(s) {
        const arr = s.availableAt.getTime();
        const firstDep = s.firstDepartureAt?.getTime() ?? 0; // earlier start is worse if same arrival
        const existing = frontiers.get(s.stopId) || [];
        for (const e of existing) {
            if (e.availableAt.getTime() <= arr &&
                e.transferCount <= s.transferCount &&
                e.walkMeters <= s.walkMeters &&
                (e.firstDepartureAt?.getTime() ?? 0) >= firstDep) {
                return false; // Dominated
            }
        }
        // Remove dominated states
        const newFrontier = existing.filter(e => {
            return !(arr <= e.availableAt.getTime() &&
                s.transferCount <= e.transferCount &&
                s.walkMeters <= e.walkMeters &&
                firstDep >= (e.firstDepartureAt?.getTime() ?? 0));
        });
        newFrontier.push(s);
        frontiers.set(s.stopId, newFrontier);
        return true;
    }
    let expandedStates = 0;
    while (queue.length > 0 && expandedStates++ < ROUTING_CONFIG.maxSearchStates) {
        const state = queue.shift();
        // Found destination!
        if (state.stopId === destinationStopId) {
            // We can record this as an option. The Pareto filter handles optimality.
            continue; // Don't expand from destination
        }
        if (state.transferCount > ROUTING_CONFIG.maxTransfers)
            continue;
        // 1. Bus Edges
        const activeRoutes = routesByStop.get(state.stopId) || [];
        for (const { route, stopIdx } of activeRoutes) {
            if (stopIdx === route.stops.length - 1)
                continue;
            const boardSched = scheduleLookup.get(`${route.lineId}|${route.direction}|${state.stopId}`);
            if (!boardSched)
                continue;
            const isFirst = state.segments.length === 0;
            // If previous was walk, we don't need min transfer time because walk time is already added. But a 1-min buffer is safe.
            const buffer = (isFirst || state.segments[state.segments.length - 1].isWalking) ? 0 : ROUTING_CONFIG.minTransferMinutes;
            const earliestBoarding = new Date(state.availableAt.getTime() + buffer * 60000);
            // Explore next few departures if first bus, else just the immediate next one
            const deps = getUpcomingDepartures(boardSched, isFirst ? 3 : 1, earliestBoarding);
            for (const dep of deps) {
                let currentVehTime = dep.departureAt;
                const viaStops = [stopById.get(state.stopId)];
                for (let i = stopIdx + 1; i < route.stops.length; i++) {
                    const nextStopId = route.stops[i];
                    const nextSched = scheduleLookup.get(`${route.lineId}|${route.direction}|${nextStopId}`);
                    if (!nextSched)
                        break;
                    const arr = getNextDeparture(nextSched, currentVehTime);
                    if (!arr)
                        break;
                    const travelMin = (arr.departureAt.getTime() - currentVehTime.getTime()) / 60000;
                    if (travelMin > 60)
                        break; // Missed bus threshold
                    currentVehTime = arr.departureAt;
                    viaStops.push(stopById.get(nextStopId));
                    // Can alight here!
                    if (state.visitedStopIds.has(nextStopId))
                        continue;
                    const duration = (currentVehTime.getTime() - dep.departureAt.getTime()) / 60000;
                    const newSegment = {
                        line: lineById.get(route.lineId),
                        fromStop: stopById.get(state.stopId),
                        toStop: stopById.get(nextStopId),
                        viaStops: [...viaStops],
                        departureTimeLabel: dep.timeLabel,
                        departureAt: dep.departureAt,
                        arrivalTimeLabel: arr.timeLabel,
                        arrivalAt: arr.departureAt,
                        durationMinutes: duration,
                        minutesUntilDeparture: Math.max(0, Math.ceil((dep.departureAt.getTime() - state.availableAt.getTime()) / 60000)),
                        schedule: boardSched
                    };
                    const nState = {
                        stopId: nextStopId,
                        availableAt: currentVehTime,
                        segments: [...state.segments, newSegment],
                        visitedStopIds: new Set([...state.visitedStopIds, nextStopId]),
                        transferCount: state.transferCount + (isFirst || state.segments[state.segments.length - 1].isWalking ? 0 : 1),
                        walkMeters: state.walkMeters,
                        firstDepartureAt: state.firstDepartureAt ?? dep.departureAt
                    };
                    if (isDominant(nState)) {
                        queue.push(nState);
                    }
                }
            }
        }
        // 2. Walking Edges
        if (state.segments.length > 0 && !state.segments[state.segments.length - 1].isWalking) {
            const wEdges = walkEdges.get(state.stopId) || [];
            for (const w of wEdges) {
                if (state.visitedStopIds.has(w.toStopId))
                    continue;
                const arrAt = new Date(state.availableAt.getTime() + w.durationMinutes * 60000);
                const nState = {
                    stopId: w.toStopId,
                    availableAt: arrAt,
                    segments: [...state.segments, {
                            isWalking: true,
                            fromStop: stopById.get(state.stopId),
                            toStop: stopById.get(w.toStopId),
                            viaStops: [],
                            departureAt: state.availableAt,
                            departureTimeLabel: `${state.availableAt.getHours().toString().padStart(2, '0')}:${state.availableAt.getMinutes().toString().padStart(2, '0')}`,
                            arrivalAt: arrAt,
                            arrivalTimeLabel: `${arrAt.getHours().toString().padStart(2, '0')}:${arrAt.getMinutes().toString().padStart(2, '0')}`,
                            durationMinutes: w.durationMinutes,
                            walkMeters: w.distanceMeters,
                            minutesUntilDeparture: 0
                        }],
                    visitedStopIds: new Set([...state.visitedStopIds, w.toStopId]),
                    transferCount: state.transferCount, // Walk doesn't add to bus transfers count conceptually, or does it? It's a transfer between lines. Let's count it if next is bus.
                    walkMeters: state.walkMeters + w.distanceMeters,
                    firstDepartureAt: state.firstDepartureAt
                };
                if (isDominant(nState))
                    queue.push(nState);
            }
        }
    }
    // Convert Pareto frontier at destination to TripOptions
    const results = frontiers.get(destinationStopId) || [];
    function rankOption(state) {
        const waits = state.segments.map((seg, idx) => {
            if (idx === 0)
                return 0;
            return Math.max(0, Math.round((seg.departureAt.getTime() - state.segments[idx - 1].arrivalAt.getTime()) / 60000));
        });
        const totalWait = waits.reduce((a, b) => a + b, 0);
        const longWait = waits.reduce((a, w) => a + Math.max(0, w - ROUTING_CONFIG.longWaitThresholdMinutes) * ROUTING_CONFIG.longWaitExtraWeight, 0);
        const busTransfers = state.segments.filter(s => !s.isWalking).length - 1;
        const actualTransfers = Math.max(0, busTransfers);
        const travelTime = Math.max(0, Math.round((state.availableAt.getTime() - departureAfter.getTime()) / 60000));
        const walkTime = state.segments.filter(s => s.isWalking).reduce((a, b) => a + b.durationMinutes, 0);
        const weightedCost = travelTime +
            actualTransfers * ROUTING_CONFIG.transferPenaltyMinutes +
            walkTime * ROUTING_CONFIG.walkingPenaltyMinutes +
            longWait;
        const firstDep = state.firstDepartureAt ?? state.segments[0].departureAt;
        return {
            id: state.segments.map(s => s.isWalking ? 'walk' : s.line.id).join('_') + '_' + firstDep.getTime(),
            isDirect: actualTransfers === 0,
            segments: state.segments,
            totalDurationMinutes: travelTime,
            totalWaitingMinutes: totalWait,
            longWaitPenaltyMinutes: longWait,
            weightedCostMinutes: weightedCost,
            transferCount: actualTransfers,
            firstDepartureAt: firstDep,
            transferStop: state.segments.length > 1 ? state.segments[0].toStop : undefined,
            transferWaitMinutes: waits[1] || 0,
            minutesUntilFirstDeparture: Math.max(0, Math.ceil((firstDep.getTime() - departureAfter.getTime()) / 60000))
        };
    }
    // Only keep routes that are not ridiculously long
    // Filter and sort by weighted cost
    const finalOptions = results
        .map(rankOption)
        .filter(opt => opt.totalDurationMinutes <= ROUTING_CONFIG.maxRideMinutes)
        .sort((a, b) => a.weightedCostMinutes - b.weightedCostMinutes);
    console.log("Total expanded states:", expandedStates);
    return finalOptions.slice(0, 5); // Return top 5 best alternative routes
}
