const fs = require('fs');

// 1. Fix TripPlanner issues
let tp = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

// erasableSyntaxOnly issue
tp = tp.replace('constructor(public compare: (a: T, b: T) => number) {}', 'compare: (a: T, b: T) => number;\n  constructor(compare: (a: T, b: T) => number) { this.compare = compare; }');

// ts2532 issue around 151
tp = tp.replace('const wEdges = walkEdges.get(state.stopId) || [];', 'const wEdges = walkEdges.get(state.stopId!) || [];');
tp = tp.replace('if (state.segments.length > 0 && !state.segments[state.segments.length-1].isWalking) {', 'if (state.stopId && state.segments.length > 0 && !state.segments[state.segments.length-1].isWalking) {');

fs.writeFileSync('src/utils/tripPlanner.ts', tp);

// 2. Fix Test issues
let tests = fs.readFileSync('src/utils/__tests__/geoUtils.test.ts', 'utf8');
tests = tests.replace(/global\./g, 'globalThis.');
tests = tests.replace(/originalNavigator/g, '_originalNavigator');
tests = tests.replace(/originalWindow/g, '_originalWindow');
tests = tests.replace(/\(success, err\)/g, '(success: any, err: any)');
tests = tests.replace(/\(success, err, options\)/g, '(success: any, err: any, options: any)');
fs.writeFileSync('src/utils/__tests__/geoUtils.test.ts', tests);

