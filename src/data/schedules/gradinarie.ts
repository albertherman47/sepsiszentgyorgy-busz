import type { Schedule } from '../../types/bus';

export const gradinarieSchedules: Schedule[] = [
  {
    stopId: 'gradinarie',
    lineId: 'line-10',
    direction: {
      hu: 'Lábasház',
      ro: 'Casa cu Arcade',
    },
    times: [
      '05:36',
      '06:36',
      '07:36',
      '08:36',
      '12:36',
      '13:36',
      '14:36',
      '15:36',
      '17:36',
      '18:36',
      '21:36',
    ],
    weekendTimes: [
      '06:36',
      '08:36',
      '12:36',
      '15:36',
      '17:36',
      '20:36',
    ],
  },

  {
    stopId: 'gradinarie',
    lineId: 'line-10',
    direction: {
      hu: 'Árkos',
      ro: 'Arcuș',
    },
    times: [
      '05:18',
      '06:18',
      '07:18',
      '08:18',
      '12:18',
      '13:18',
      '14:18',
      '15:18',
      '17:18',
      '18:18',
      '21:18',
    ],
    weekendTimes: [
      '06:18',
      '08:18',
      '12:18',
      '15:18',
      '17:18',
      '20:18',
    ],
  },
];