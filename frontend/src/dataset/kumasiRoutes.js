// src/dataset/kumasiRoutes.js

function randomPoint() {
  return {
    lat: 6.6885 + (Math.random() - 0.5) * 0.22,
    lng: -1.6244 + (Math.random() - 0.5) * 0.22,
  };
}

function generateKumasiRoutes(count = 2500) {
  return Array.from({ length: count }, (_, i) => ({
    id: `KUM_ROUTE_${i + 1}`,
    name: `Kumasi Route ${i + 1}`,
    alternatives: [
      {
        route: Array.from({ length: 3 + Math.floor(Math.random() * 5) }, randomPoint),
        distance_km: Number((1.5 + Math.random() * 20).toFixed(2)),
        avg_time_min: Math.floor(8 + Math.random() * 50),
        congestion_score: Math.floor(Math.random() * 100),
      },
    ],
    usage_level: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
  }));
}

export const kumasiRoutes = generateKumasiRoutes();
