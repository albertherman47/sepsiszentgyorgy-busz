const { performance } = require('perf_hooks');
const { stops, lines, schedules } = require('./dist/data/busData');
const { planTrip } = require('./dist/utils/tripPlanner');

console.time('Test');
planTrip('motel-calypso', 'centru-arcus', new Date(2024, 0, 1, 8, 45), schedules, lines, stops);
console.timeEnd('Test');
