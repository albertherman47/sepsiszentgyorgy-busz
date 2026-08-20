const fs = require('fs');
let code = fs.readFileSync('src/utils/__tests__/geoUtils.test.ts', 'utf8');

code = code.replace(
  "Object.defineProperty(global, 'navigator', { value: {}, writable: true });",
  "Object.defineProperty(global, 'window', { value: {}, writable: true });\n      Object.defineProperty(global, 'navigator', { value: {}, writable: true });"
);

fs.writeFileSync('src/utils/__tests__/geoUtils.test.ts', code);
