import type { Schedule } from '../../types/bus';

export const strConstructorilor3Schedules: Schedule[] = [
  {
    stopId: 'str-constructorilor-3',
    lineId: 'line-4',
    direction: { hu: 'Gyár utca', ro: 'Str. Fabricii' },
    times: ['04:20','04:50','05:50','06:50','07:50','09:20','11:20','11:50','13:20','14:20','15:20','16:20','17:20','18:20','20:50','22:50'],
    weekendTimes: ['05:35','06:35','08:35','10:35','12:35','14:35','16:35','18:35','20:35'],
  },
  {
    stopId: 'str-constructorilor-3',
    lineId: 'line-4',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: ['05:20','06:20','07:20','08:20','08:50','10:50','11:50','13:50','14:50','15:50','16:50','17:50','18:50','20:20','22:20','00:20'],
    weekendTimes: ['06:05','08:05','10:05','12:05','14:05','16:05','18:05','20:05','22:05'],
  },
];
