import type { Schedule } from '../../types/bus';

export const sugasBaiSchedules: Schedule[] = [
  {
    stopId: 'sugas-bai',
    lineId: 'line-9',
    direction: { hu: 'Vasútállomás', ro: 'Gara' },
    times: ['10:30','13:30','16:30','19:30'],
    weekendTimes: ['10:30','13:30','16:30','19:30'],
  },
];
