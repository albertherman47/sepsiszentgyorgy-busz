import fs from 'fs';
let content = fs.readFileSync('src/types/bus.ts', 'utf8');

// We need to add isWalking, walkMeters to TripSegment
content = content.replace(
  'export interface TripSegment {',
  `export interface TripSegment {
  isWalking?: boolean;
  walkMeters?: number;`
);

// We need to make line optional or add a type union? No, line can be optional if isWalking is true.
// Actually, let's just make `line` optional and `schedule` optional.
content = content.replace('  line: Line;', '  line?: Line;');
content = content.replace('  schedule: Schedule;', '  schedule?: Schedule;');

fs.writeFileSync('src/types/bus.ts', content);
