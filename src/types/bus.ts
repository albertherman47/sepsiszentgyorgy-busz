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

  outboundStopIds?: string[];
  returnStopIds?: string[];
  directionStopIds?: Partial<Record<'outbound' | 'return', string[]>>;

  directionNames?: {
    outbound: { hu: string; ro: string };
    return: { hu: string; ro: string };
  };

  path: LngLat[];

  roadPath?: LngLat[];

  paths?: LngLat[][];

  directionPaths?: Partial<
    Record<'outbound' | 'return', LngLat[][]>
  >;
}

export interface Schedule {
  stopId: string;
  lineId: string;

  direction?: {
    hu: string;
    ro: string;
  };

  directionType?: 'outbound' | 'return';

  times: string[];

  weekendTimes?: string[];
}

export interface DepartureCountdown {
  schedule?: Schedule;
  line?: Line;
  departureAt: Date;
  minutesUntil: number;
  timeLabel: string;
}

export type SelectedLineId = string | null;

export type SelectedStopId = string | null;

export interface TripSegment {
  isWalking?: boolean;
  walkMeters?: number;
  line?: Line;
  fromStop: Stop;
  toStop: Stop;
  /** Every actual stop used on this section, inclusive. */
  viaStops: Stop[];
  departureTimeLabel: string;
  departureAt: Date;
  arrivalTimeLabel: string;
  arrivalAt: Date;
  durationMinutes: number;
  minutesUntilDeparture: number;
  schedule?: Schedule;
}

export interface TripOption {
  id: string;
  isDirect: boolean;
  segments: TripSegment[];
  /** Compatibility summary for consumers that show the first transfer. */
  transferStop?: Stop;
  transferWaitMinutes?: number;
  totalDurationMinutes: number;
  totalWaitingMinutes: number;
  /** Extra penalty for impractically long waits, used for route ranking. */
  longWaitPenaltyMinutes: number;
  /** Multi-criteria ranking cost; lower is better. */
  weightedCostMinutes: number;
  transferCount: number;
  firstDepartureAt: Date;
  minutesUntilFirstDeparture: number;
}
