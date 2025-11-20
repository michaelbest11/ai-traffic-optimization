import { accraIntersections } from "./accraIntersections";

// helper
function generateMockRoute(start, end, numAlternatives = 2) {
  const colors = ["#1976d2", "#2e7d32", "#d32f2f"];
  const levels = ["light", "moderate", "heavy"];
  const routes = [];
  for (let i = 0; i < numAlternatives; i++) {
    routes.push({
      id: `${start.id}_${end.id}_alt${i + 1}`,
      route: [
        { lat: start.lat, lng: start.lng },
        {
          lat: (start.lat + end.lat) / 2 + (Math.random() - 0.5) * 0.01,
          lng: (start.lng + end.lng) / 2 + (Math.random() - 0.5) * 0.01,
        },
        { lat: end.lat, lng: end.lng },
      ],
      color: colors[i % colors.length],
      trafficLevel: levels[Math.floor(Math.random() * levels.length)],
      liveImage: `${process.env.PUBLIC_URL}/feed/accra/accra_route_${start.id}_${end.id}_${i + 1}.jpg`,
    });
  }
  return routes;
}

export const accraRoutes = [];
accraIntersections.forEach((start) => {
  accraIntersections.forEach((end) => {
    if (start.id !== end.id) {
      accraRoutes.push({
        start: start.name,
        end: end.name,
        alternatives: generateMockRoute(start, end, 2),
      });
    }
  });
});
