const fs = require('fs');
let code = fs.readFileSync('src/utils/tripPlanner.ts', 'utf8');

// Find the line where routes are built.
code = code.replace(
  'const scheduleLookup = new Map<string, Schedule>(); // key: lineId|dir|stopId',
  `const scheduleLookup = new Map<string, Schedule>(); // key: lineId|dir|stopId
  const routesByStop = new Map<string, { route: RouteData; stopIdx: number }[]>();`
);

code = code.replace(
  'stopScores.map(s => s.stopId)\n      });',
  `stopScores.map(s => s.stopId)\n      });
      const lastRoute = routes[routes.length - 1];
      for (let i = 0; i < lastRoute.stops.length; i++) {
          const stopId = lastRoute.stops[i];
          if (!routesByStop.has(stopId)) routesByStop.set(stopId, []);
          routesByStop.get(stopId).push({ route: lastRoute, stopIdx: i });
      }`
);

// Replace the loop
code = code.replace(
  'for (const route of routes) {\n          const stopIdx = route.stops.indexOf(state.stopId);\n          if (stopIdx === -1 || stopIdx === route.stops.length - 1) continue;',
  `const activeRoutes = routesByStop.get(state.stopId) || [];
      for (const { route, stopIdx } of activeRoutes) {
          if (stopIdx === route.stops.length - 1) continue;`
);

fs.writeFileSync('src/utils/tripPlanner.ts', code);
