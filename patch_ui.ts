import fs from 'fs';

let content = fs.readFileSync('src/components/TripPlanner.tsx', 'utf8');

const target = `return <div key={\`\${segment.line.id}-\${segment.departureAt.getTime()}-\${index}\`} className="space-y-2">`;
const replace = `return <div key={\`\${segment.line?.id ?? 'walk'}-\${segment.departureAt.getTime()}-\${index}\`} className="space-y-2">`;
content = content.replace(target, replace);

const target2 = `<div className="flex min-w-0 items-center gap-2"><span className="flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-xs font-bold text-white" style={{ backgroundColor: segment.line.color }}>{segment.line.number}</span><Bus className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" /><span className="truncate font-semibold text-[var(--text-h)]">{stopName(segment.fromStop)} → {stopName(segment.toStop)}</span></div>`;
const replace2 = `
<div className="flex min-w-0 items-center gap-2">
  {segment.isWalking ? (
    <>
      <Footprints className="h-4 w-4 shrink-0 text-amber-500" />
      <span className="truncate font-semibold text-[var(--text-h)]">Séta: {stopName(segment.fromStop)} → {stopName(segment.toStop)}</span>
    </>
  ) : (
    <>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-xs font-bold text-white" style={{ backgroundColor: segment.line?.color }}>{segment.line?.number}</span>
      <Bus className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
      <span className="truncate font-semibold text-[var(--text-h)]">{stopName(segment.fromStop)} → {stopName(segment.toStop)}</span>
    </>
  )}
</div>
`.trim();
content = content.replace(target2, replace2);

const target3 = `<p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]"><strong>{segment.viaStops.length} {t.stops}:</strong> {segment.viaStops.map(stopName).join(' · ')}</p>`;
const replace3 = `{segment.isWalking ? (
  <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]"><strong>Távolság:</strong> {segment.walkMeters} m ({segment.durationMinutes} perc)</p>
) : (
  <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]"><strong>{segment.viaStops.length} {t.stops}:</strong> {segment.viaStops.map(stopName).join(' · ')}</p>
)}`;
content = content.replace(target3, replace3);

fs.writeFileSync('src/components/TripPlanner.tsx', content);
