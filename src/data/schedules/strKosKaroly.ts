import type { Schedule } from '../../types/bus';

export const strKosKarolySchedules: Schedule[] = [
  {
    stopId: 'str-kos-karoly',
    lineId: 'line-5',
    direction: { hu: 'Sepsi Aréna', ro: 'Arena Sepsi' },
    times: [
      '06:21','06:51','07:21','07:51','08:21','08:51',
      '09:21','09:41','10:36','11:36','12:36',
      '13:21','13:51','14:21','14:51','15:21','15:51',
      '16:21','16:51','17:21','17:51','18:21',
      '19:36','20:36','21:36','22:36'
    ],
    weekendTimes: [
      '06:06','07:06','08:06','09:06','10:06','11:06','12:06',
      '13:06','14:06','15:06','16:06','17:06','18:06',
      '19:06','20:06','21:06','22:06'
    ],
  },
  {
    stopId: 'str-kos-karoly',
    lineId: 'line-5d',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: ['09:41','17:51','22:36'],
    weekendTimes: ['13:06','22:06'],
  },
];
