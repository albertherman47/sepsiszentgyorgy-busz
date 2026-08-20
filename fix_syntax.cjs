const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

code = code.replace(
  '        if ((swapIdx === -1 && this.compare(rightVal, val) < 0) || (swapIdx !== -1 && leftVal && this.compare(rightVal, leftVal) < 0)) {\n             (swapIdx !== -1 && this.compare(rightVal, leftVal) < 0)) {\n          swapIdx = rightIdx;\n        }',
  '        if ((swapIdx === -1 && this.compare(rightVal, val) < 0) || (swapIdx !== -1 && leftVal && this.compare(rightVal, leftVal) < 0)) {\n          swapIdx = rightIdx;\n        }'
);

fs.writeFileSync('src/utils/tripPlanner.ts', code);
