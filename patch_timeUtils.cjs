const fs = require('fs');
let code = fs.readFileSync('src/utils/timeUtils.ts', 'utf8');

code = code.replace(
  'const { hours, minutes } = parseTimeLabel(time);',
  `
  let cacheKey = time;
  let cached = parseCache.get(cacheKey);
  if (!cached) {
    cached = parseTimeLabel(time);
    parseCache.set(cacheKey, cached);
  }
  const { hours, minutes } = cached;`
);

code = `const parseCache = new Map<string, { hours: number, minutes: number }>();\n` + code;

fs.writeFileSync('src/utils/timeUtils.ts', code);
