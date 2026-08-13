import type { Schedule } from '../../types/bus';

export const strLacramioarei1Schedules: Schedule[] = [
  {
    stopId: 'str-lacramioarei-1',
    lineId: 'line-5',
    direction: { hu: 'Sepsi Aréna', ro: 'Arena Sepsi' },
    times: [
      '06:31','07:01','07:31','08:01','08:31',
      '09:01','09:31','09:51','10:46','11:46','12:46',
      '13:31','14:01','14:31','15:01','15:31',
      '16:01','16:31','17:01','17:31','18:01','18:31',
      '19:46','20:46','21:46','22:46'
    ],
    weekendTimes: [
      '06:16','07:16','08:16','09:16','10:16','11:16','12:16',
      '13:16','14:16','15:16','16:16','17:16','18:16',
      '19:16','20:16','21:16','22:16'
    ],
  },
  {
    stopId: 'str-lacramioarei-1',
    lineId: 'line-5d',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: ['09:51','18:01','22:46'],
    weekendTimes: ['13:16','22:16'],
  },
  {
    stopId: 'str-lacramioarei-1',
    lineId: 'line-5',
    direction: { hu: 'József Attila utca', ro: 'Str. József Attila' },
    times: [
      '06:05','06:35','07:05','07:35','08:05','08:35',
      '09:05','09:25','10:20','11:20','12:20',
      '13:05','13:35','14:05','14:35','15:05','15:35',
      '16:05','16:35','17:05','17:35','18:05',
      '19:20','20:20','21:20','22:20'
    ],
    weekendTimes: [
      '05:50','06:50','07:50','08:50','09:50','10:50','11:50',
      '12:50','13:50','14:50','15:50','16:50','17:50',
      '18:50','19:50','20:50','21:50'
    ],
  },
  {
    stopId: 'str-lacramioarei-1',
    lineId: 'line-5d',
    direction: { hu: 'József Attila utca', ro: 'Str. József Attila' },
    times: ['06:05','06:35','12:20','13:05'],
    weekendTimes: ['05:50','13:50'],
  },
];
