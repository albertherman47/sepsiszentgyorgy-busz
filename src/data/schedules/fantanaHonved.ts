import type { Schedule } from '../../types/bus';

export const fantanaHonvedSchedules: Schedule[] = [
  {
    stopId: 'fantana-honved',
    lineId: 'line-9',
    direction: {
      hu: 'Vasútállomás',
      ro: 'Gara',
    },
    times: [
      '10:38',
      '13:38',
      '16:38',
      '19:38',
    ],
    weekendTimes: [
      '10:38',
      '13:38',
      '16:38',
      '19:38',
    ],
  },
  {
    stopId: 'fantana-honved',
    lineId: 'line-9',
    direction: {
      hu: 'Sugásfürdő',
      ro: 'Șugaș Băi',
    },
    times: [
      '10:09',
      '13:09',
      '16:09',
      '19:09',
    ],
    weekendTimes: [
      '10:09',
      '13:09',
      '16:09',
      '19:09',
    ],
  },
];