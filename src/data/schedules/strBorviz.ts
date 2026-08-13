import type { Schedule } from '../../types/bus';

export const strBorvizSchedules: Schedule[] = [
  {
    stopId: 'str-borviz',
    lineId: 'line-9',
    direction: { hu: 'Vasútállomás', ro: 'Gara' },
    times: ['10:41','13:41','16:41','19:41'],
    weekendTimes: ['10:41','13:41','16:41','19:41'],
  },
  {
    stopId: 'str-borviz',
    lineId: 'line-9',
    direction: { hu: 'Sugásfürdő', ro: 'Șugaș Băi' },
    times: ['10:06','13:06','16:06','19:06'],
    weekendTimes: ['10:06','13:06','16:06','19:06'],
  },
];
