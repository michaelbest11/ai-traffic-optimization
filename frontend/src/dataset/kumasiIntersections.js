// src/dataset/kumasiIntersections.js

function generateKumasiIntersections(count = 1500) {
  const baseLat = 6.6885;
  const baseLng = -1.6244;

  return Array.from({ length: count }, (_, i) => ({
    id: `KUM_INT_${i + 1}`,
    name: `Kumasi Intersection ${i + 1}`,
    lat: baseLat + (Math.random() - 0.5) * 0.22,
    lng: baseLng + (Math.random() - 0.5) * 0.22,
    traffic_level: ["Low", "Medium", "High", "Critical"][
      Math.floor(Math.random() * 4)
    ],
    average_speed: Number((12 + Math.random() * 35).toFixed(1)),
    vehicle_count: Math.floor(15 + Math.random() * 400),
    signalized: Math.random() > 0.35,
  }));
}

export const kumasiIntersections = generateKumasiIntersections();
