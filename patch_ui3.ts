import fs from 'fs';

let content = fs.readFileSync('src/components/TripPlanner.tsx', 'utf8');
content = content.replace(/\{hu \? /g, '{language === "hu" ? ');
fs.writeFileSync('src/components/TripPlanner.tsx', content);

let planner = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');
planner = planner.replace(
  'transferWaitMinutes: waits[1] || 0',
  'transferWaitMinutes: waits[1] || 0,\n          minutesUntilFirstDeparture: Math.max(0, Math.ceil((firstDep.getTime() - departureAfter.getTime()) / 60000))'
);
fs.writeFileSync('src/utils/tripPlanner.ts', planner);

