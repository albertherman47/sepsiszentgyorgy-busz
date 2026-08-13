import type { Schedule } from '../../types/bus';

export const strConstructorilor1Schedules: Schedule[] = [
  {
    stopId: 'str-constructorilor-1',
    lineId: 'line-4',
    direction: { hu: 'Gyár utca', ro: 'Str. Fabricii' },
    times: ['04:22','04:52','05:52','06:52','07:52','09:22','11:22','11:52','13:22','14:22','15:22','16:22','17:22','18:22','20:52','22:52'],
    weekendTimes: ['05:37','06:37','08:37','10:37','12:37','14:37','16:37','18:37','20:37'],
  },
  {
    stopId: 'str-constructorilor-1',
    lineId: 'line-4',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: ['05:18','06:18','07:18','08:18','08:48','10:48','11:48','13:48','14:48','15:48','16:48','17:48','18:48','20:18','22:18','24:18'],
    weekendTimes: ['06:03','08:03','10:03','12:03','14:03','16:03','18:03','20:03','22:03'],
  },
];
