const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

const splitIndex = code.indexOf('export function planTrip(');
if (splitIndex !== -1) {
  const topPart = `import type { Line, Schedule, Stop, TripOption, TripSegment } from '../types/bus';
import { getUpcomingDepartures, getNextDeparture } from './timeUtils';

export const ROUTING_CONFIG = {
  minTransferMinutes: 2,
  maxTransfers: 3,
  transferPenaltyMinutes: 5,
  walkingPenaltyMinutes: 2,
  maxWalkingMinutes: 15,
  maxRideMinutes: 180,
  maxSearchStates: 10_000,
  longWaitThresholdMinutes: 20,
  longWaitExtraWeight: 1.5,
};

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

function normalizedDirection(schedule: Schedule): string | null {
  const value = schedule.direction?.ro ?? schedule.direction?.hu;
  return value ? value.toLocaleLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() : null;
}

interface WalkEdge {
    toStopId: string;
    distanceMeters: number;
    durationMinutes: number;
}

class MinHeap<T> {
  heap: T[] = [];
  constructor(public compare: (a: T, b: T) => number) {}
  get length() { return this.heap.length; }
  push(val: T) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }
  shift(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }
  bubbleUp(idx: number) {
    const val = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (this.compare(val, parent) >= 0) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = val;
  }
  sinkDown(idx: number) {
    const length = this.heap.length;
    const val = this.heap[idx];
    while (true) {
      const leftIdx = 2 * idx + 1;
      const rightIdx = 2 * idx + 2;
      let swapIdx = -1;
      let leftVal: T | undefined;
      if (leftIdx < length) {
        leftVal = this.heap[leftIdx]!;
        if (this.compare(leftVal, val) < 0) swapIdx = leftIdx;
      }
      if (rightIdx < length) {
        const rightVal = this.heap[rightIdx]!;
        if ((swapIdx === -1 && this.compare(rightVal, val) < 0) || 
            (swapIdx !== -1 && leftVal && this.compare(rightVal, leftVal) < 0)) {
          swapIdx = rightIdx;
        }
      }
      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = val;
  }
}

`;

  fs.writeFileSync('src/utils/tripPlanner.ts', topPart + code.substring(splitIndex));
}
