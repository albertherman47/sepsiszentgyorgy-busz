const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

code = code.replace(
  'while (queue.length > 0 && expandedStates++ < ROUTING_CONFIG.maxSearchStates) {',
  `while (queue.length > 0 && expandedStates++ < ROUTING_CONFIG.maxSearchStates) {
    if (expandedStates % 1000 === 0) console.log('expanded: ', expandedStates, 'queue:', queue.length);`
);

fs.writeFileSync('src/utils/tripPlanner.ts', code);
