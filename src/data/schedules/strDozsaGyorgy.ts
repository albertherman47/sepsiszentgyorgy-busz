import type { Schedule } from '../../types/bus';

export const strDozsaGyorgySchedules: Schedule[] = [
  {
    stopId: 'str-dozsa-gyorgy',
    lineId: 'line-5',
    direction: { hu: 'Sepsi Aréna', ro: 'Arena Sepsi' },
    times: [
      '06:16','06:46',
      '07:16','07:46',
      '08:16','08:46',
      '09:16','09:36',
      '10:31',
      '11:31',
      '12:31',
      '13:16','13:46',
      '14:16','14:46',
      '15:16','15:46',
      '16:16','16:46',
      '17:16','17:46',
      '18:16',
      '19:31',
      '20:31',
      '21:31',
      '22:31'
    ],
    weekendTimes: [
      '06:01','07:01','08:01','09:01','10:01',
      '11:01','12:01','13:01','14:01','15:01',
      '16:01','17:01','18:01','19:01','20:01',
      '21:01','22:01'
    ],
  },
  {
    stopId: 'str-dozsa-gyorgy',
    lineId: 'line-5d',
    direction: { hu: 'Szépmező', ro: 'Câmpul Frumos' },
    times: [
      '09:36',
      '17:46',
      '22:31'
    ],
    weekendTimes: [
      '13:01',
      '22:01'
    ],
  },
];
