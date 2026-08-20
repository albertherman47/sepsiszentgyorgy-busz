import { stops, lines, schedules } from './src/data/busData';
import { planTrip } from './src/utils/tripPlanner';
console.time('Test');
planTrip('motel-calypso', 'centru-arcus', new Date(2024, 0, 1, 8, 45), schedules, lines, stops);
console.timeEnd('Test');
