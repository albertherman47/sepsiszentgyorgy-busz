import type { Schedule } from '../../types/bus';

export const strFabricii2Schedules: Schedule[] = [
  {
    stopId: 'str-fabricii-2',
    lineId: 'line-3',
    direction: { hu: 'Szotyor', ro: 'Coșeni' },
    times: [
      '04:38','05:38','06:38','07:38','09:38',
      '12:08','13:08','14:08','15:08','16:08',
      '17:08','18:08','19:08','21:08','23:08'
    ],
    weekendTimes: [
      '06:53','08:53','10:53','12:53',
      '14:53','16:53','18:53','20:53'
    ],
  },
  {
    stopId: 'str-fabricii-2',
    lineId: 'line-4',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: [
      '05:08','06:08','07:08',
      '08:08','08:38',
      '10:38','11:38',
      '13:38','14:38','15:38','16:38','17:38','18:38',
      '20:08','22:08','00:08'
    ],
    weekendTimes: [
      '05:53','07:53','09:53','11:53','13:53',
      '15:53','17:53','19:53','21:53'
    ],
  },
];
