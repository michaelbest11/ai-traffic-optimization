export const accraRoutes = [];
export const kumasiRoutes = [];

// Helper to generate dummy alternatives
function generateAlternatives(intersections) {
  const routes = [];
  for (let start = 1; start <= intersections.length; start++) {
    for (let end = 1; end <= intersections.length; end++) {
      if (start !== end) {
        routes.push({
          start,
          end,
          alternatives: [
            { id: `R${start}_${end}_1`, route: [start, ((start + end) % intersections.length) + 1, end], color: "blue" },
            { id: `R${start}_${end}_2`, route: [start, ((start + end + 1) % intersections.length) + 1, end], color: "green" },
            { id: `R${start}_${end}_3`, route: [start, ((start + end + 2) % intersections.length) + 1, end], color: "red" },
          ],
        });
      }
    }
  }
  return routes;
}

import { accraIntersections } from "./accraIntersections";
import { kumasiIntersections } from "./kumasiIntersections";

export const accraRoutesFull = generateAlternatives(accraIntersections);
export const kumasiRoutesFull = generateAlternatives(kumasiIntersections);
