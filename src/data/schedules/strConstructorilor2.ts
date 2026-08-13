import type { Schedule } from '../../types/bus';

export const strConstructorilor2Schedules: Schedule[] = [
  {
    stopId: 'str-constructorilor-2',
    lineId: 'line-4',
    direction: { hu: 'Gyár utca', ro: 'Str. Fabricii' },
    times: ['04:21','04:51','05:51','06:51','07:51','09:21','11:21','11:51','13:21','14:21','15:21','16:21','17:21','18:21','20:51','22:51'],
    weekendTimes: ['05:36','06:36','08:36','10:36','12:36','14:36','16:36','18:36','20:36'],
  },
  {
    stopId: 'str-constructorilor-2',
    lineId: 'line-4',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: ['05:19','06:19','07:19','08:19','08:49','10:49','11:49','13:49','14:49','15:49','16:49','17:49','18:49','20:19','22:19','00:19'],
    weekendTimes: ['06:04','08:04','10:04','12:04','14:04','16:04','18:04','20:04','22:04'],
  },
];
