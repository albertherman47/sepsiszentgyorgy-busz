import { stops, lines, schedules } from './src/data/busData';
import { planTrip } from './src/utils/tripPlanner';
import { performance } from 'perf_hooks';
const NUM_TESTS = 5000;
let errors = 0;
let validRoutes = 0;
let noRoutes = 0;
const times = [];
console.log("Starting Load & Consistency Test...");
const startMem = process.memoryUsage().heapUsed;
for (let i = 0; i < NUM_TESTS; i++) {
    const origin = stops[Math.floor(Math.random() * stops.length)];
    const dest = stops[Math.floor(Math.random() * stops.length)];
    const randomHour = Math.floor(Math.random() * 24);
    const randomMin = Math.floor(Math.random() * 60);
    const date = new Date(2024, 0, 1, randomHour, randomMin);
    const start = performance.now();
    let options = [];
    try {
        options = planTrip(origin.id, dest.id, date, schedules, lines, stops);
    }
    catch (e) {
        console.error(`Crash on ${origin.id} -> ${dest.id}:`, e);
        errors++;
        continue;
    }
    const end = performance.now();
    times.push(end - start);
    if (options.length > 0) {
        validRoutes++;
        // Consistency checks
        for (const opt of options) {
            let lastArrival = date;
            for (let j = 0; j < opt.segments.length; j++) {
                const seg = opt.segments[j];
                if (seg.departureAt.getTime() < lastArrival.getTime()) {
                    console.error(`Time travel detected! ${origin.id}->${dest.id}. Seg dep: ${seg.departureAt}, Last arr: ${lastArrival}`);
                    errors++;
                }
                if (seg.arrivalAt.getTime() < seg.departureAt.getTime()) {
                    console.error(`Negative travel time! ${origin.id}->${dest.id}. Dep: ${seg.departureAt}, Arr: ${seg.arrivalAt}`);
                    errors++;
                }
                lastArrival = seg.arrivalAt;
            }
        }
    }
    else {
        noRoutes++;
    }
}
const endMem = process.memoryUsage().heapUsed;
const avg = times.reduce((a, b) => a + b, 0) / times.length;
const max = Math.max(...times);
const min = Math.min(...times);
console.log(`\n--- TEST RESULTS ---`);
console.log(`Total Requests: ${NUM_TESTS}`);
console.log(`Valid Routes Found: ${validRoutes}`);
console.log(`No Routes Found (unreachable/same-stop/too-late): ${noRoutes}`);
console.log(`Errors/Inconsistencies: ${errors}`);
console.log(`\n--- PERFORMANCE ---`);
console.log(`Average Time: ${avg.toFixed(2)} ms`);
console.log(`Max Time: ${max.toFixed(2)} ms`);
console.log(`Min Time: ${min.toFixed(2)} ms`);
console.log(`Memory Used (Heap delta): ${((endMem - startMem) / 1024 / 1024).toFixed(2)} MB`);
