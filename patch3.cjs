const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

code = code.replace(
  'if (expandedStates % 1000 === 0) console.log(\'expanded: \', expandedStates, \'queue:\', queue.length);',
  ''
);

code = code.replace(
  'return finalOptions.slice(0, 5);',
  'console.log("Total expanded states:", expandedStates);\n  return finalOptions.slice(0, 5);'
);

fs.writeFileSync('src/utils/tripPlanner.ts', code);
