import { stops, lines, schedules } from './src/data/busData';
import { Schedule } from './src/types/bus';
import { timeLabelToDate } from './src/utils/timeUtils';

function normalizedDirection(schedule: Schedule): string | null {
  const value = schedule.direction?.ro ?? schedule.direction?.hu;
  return value ? value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() : null;
}

const map = new Map<string, { lineId: string, dir: string, schedules: Schedule[] }>();
for (const s of schedules) {
  const dir = normalizedDirection(s);
  if (!dir) continue;
  const key = `${s.lineId}|${dir}`;
  if (!map.has(key)) map.set(key, { lineId: s.lineId, dir, schedules: [] });
  map.get(key)!.schedules.push(s);
}

for (const { lineId, dir, schedules } of map.values()) {
  const now = new Date();
  
  // Calculate a "score" for each stop based on the median time in minutes from midnight
  const stopScores = schedules.map(s => {
      let times = s.times;
      if (times.length === 0) times = s.weekendTimes ?? [];
      const mins = times.map(t => {
          let [h, m] = t.split(':').map(Number);
          if (h < 3) h += 24; // Handle after midnight
          return h * 60 + m;
      }).sort((a,b) => a - b);
      
      const median = mins[Math.floor(mins.length / 2)] ?? 0;
      return { stopId: s.stopId, median, min: mins[0] };
  });
  
  stopScores.sort((a, b) => a.median - b.median);
  const seq = stopScores.map(s => s.stopId);
  
  console.log(`${lineId} | ${dir} : ${seq.join(' -> ')}`);
}
