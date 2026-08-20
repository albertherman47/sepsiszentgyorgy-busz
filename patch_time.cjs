const fs = require('fs');
let code = fs.readFileSync('src/utils/timeUtils.ts', 'utf8');

code = code.replace(
  'const { hours, minutes } = cached;\n  const d = new Date(now);\n  d.setHours(hours, minutes, 0, 0);\n  return d;',
  `const { hours, minutes } = cached;
  const d = new Date(now.getTime());
  d.setHours(hours, minutes, 0, 0);
  return d;`
);

fs.writeFileSync('src/utils/timeUtils.ts', code);
