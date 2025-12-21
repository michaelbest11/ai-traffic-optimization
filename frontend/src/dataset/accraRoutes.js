import { accraIntersections } from "./accraIntersections";

// src/dataset/accraRoutes.js

function randomPoint() {
  return {
    lat: 5.6037 + (Math.random() - 0.5) * 0.25,
    lng: -0.1870 + (Math.random() - 0.5) * 0.25,
  };
}

function generateAccraRoutes(count = 3000) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ACC_ROUTE_${i + 1}`,
    name: `Accra Route ${i + 1}`,
    alternatives: [
      {
        route: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, randomPoint),
        distance_km: Number((2 + Math.random() * 25).toFixed(2)),
        avg_time_min: Math.floor(10 + Math.random() * 60),
        congestion_score: Math.floor(Math.random() * 100),
      },
    ],
    usage_level: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
  }));
}

export const accraRoutes = generateAccraRoutes();
