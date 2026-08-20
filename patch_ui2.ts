import fs from 'fs';

let content = fs.readFileSync('src/components/TripPlanner.tsx', 'utf8');

content = content.replace(
  'Séta: {stopName(segment.fromStop)}',
  '{hu ? "Séta" : "Pe jos"}: {stopName(segment.fromStop)}'
);

content = content.replace(
  '<strong>Távolság:</strong> {segment.walkMeters} m ({segment.durationMinutes} perc)',
  '<strong>{hu ? "Távolság" : "Distanță"}:</strong> {segment.walkMeters} m ({segment.durationMinutes} {hu ? "perc" : "min"})'
);

fs.writeFileSync('src/components/TripPlanner.tsx', content);
