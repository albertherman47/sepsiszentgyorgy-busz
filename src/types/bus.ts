export type Language = 'hu' | 'ro';

export type LngLat = [number, number];

export interface Stop {
  id: string;
  name_hu: string;
  name_ro: string;
  lat: number;
  lng: number;
  lineIds: string[];
}

export interface Line {
  id: string;
  number: string;
  name_hu: string;
  name_ro: string;
  color: string;
  stopIds: string[];

  path: LngLat[];

  roadPath?: LngLat[];
}

export interface Schedule {
  stopId: string;
  lineId: string;

  direction?: {
    hu: string;
    ro: string;
  };

  times: string[];

  weekendTimes?: string[];
}

export interface DepartureCountdown {
  schedule: Schedule;
  line: Line;
  departureAt: Date;
  minutesUntil: number;
  timeLabel: string;
}

export type SelectedLineId = string | null;

export type SelectedStopId = string | null;

export interface TripSegment {
  line: Line;
  fromStop: Stop;
  toStop: Stop;
  departureTimeLabel: string;
  departureAt: Date;
  arrivalTimeLabel: string;
  arrivalAt: Date;
  durationMinutes: number;
  minutesUntilDeparture: number;
  schedule: Schedule;
}

export interface TripOption {
  id: string;
  isDirect: boolean;
  segments: TripSegment[];
  transferStop?: Stop;
  transferWaitMinutes?: number;
  totalDurationMinutes: number;
  firstDepartureAt: Date;
  minutesUntilFirstDeparture: number;
}