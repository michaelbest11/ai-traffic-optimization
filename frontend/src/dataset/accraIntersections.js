// src/dataset/accraIntersections.js

function generateAccraIntersections(count = 2000) {
  const baseLat = 5.6037;
  const baseLng = -0.1870;

  return Array.from({ length: count }, (_, i) => ({
    id: `ACC_INT_${i + 1}`,
    name: `Accra Intersection ${i + 1}`,
    lat: baseLat + (Math.random() - 0.5) * 0.25,
    lng: baseLng + (Math.random() - 0.5) * 0.25,
    traffic_level: ["Low", "Medium", "High", "Critical"][
      Math.floor(Math.random() * 4)
    ],
    average_speed: Number((10 + Math.random() * 40).toFixed(1)),
    vehicle_count: Math.floor(20 + Math.random() * 500),
    signalized: Math.random() > 0.3,
  }));
}

export const accraIntersections = generateAccraIntersections();
