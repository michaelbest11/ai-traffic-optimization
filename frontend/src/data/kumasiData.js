// frontend/src/data/kumasiData.js
export const kumasiIntersections = [
  { id: "K1", name: "Kejetia", lat: 6.6929, lng: -1.6244, feed: "https://placeimg.com/640/480/traffic?K1" },
  { id: "K2", name: "Asokwa", lat: 6.7031, lng: -1.5997, feed: "https://placeimg.com/640/480/traffic?K2" },
  { id: "K3", name: "Kumasi Central", lat: 6.6885, lng: -1.6244, feed: "https://placeimg.com/640/480/traffic?K3" },
  { id: "K4", name: "Manhyia", lat: 6.6700, lng: -1.6168, feed: "https://placeimg.com/640/480/traffic?K4" },
  { id: "K5", name: "Tafo", lat: 6.7400, lng: -1.5670, feed: "https://placeimg.com/640/480/traffic?K5" },
  { id: "K6", name: "Asafo", lat: 6.6844, lng: -1.6206, feed: "https://placeimg.com/640/480/traffic?K6" },
  { id: "K7", name: "Suame", lat: 6.7080, lng: -1.6244, feed: "https://placeimg.com/640/480/traffic?K7" },
  { id: "K8", name: "KNUST Junction", lat: 6.6784, lng: -1.5711, feed: "https://placeimg.com/640/480/traffic?K8" },
  { id: "K9", name: "Adum", lat: 6.6900, lng: -1.6240, feed: "https://placeimg.com/640/480/traffic?K9" },
  { id: "K10", name: "Okomfo Anokye", lat: 6.6901, lng: -1.6272, feed: "https://placeimg.com/640/480/traffic?K10" },
  { id: "K11", name: "Tafo Nhyiaso", lat: 6.7374, lng: -1.5491, feed: "https://placeimg.com/640/480/traffic?K11" },
  { id: "K12", name: "Santasi", lat: 6.6754, lng: -1.6251, feed: "https://placeimg.com/640/480/traffic?K12" },
  { id: "K13", name: "Bekwai Road", lat: 6.6450, lng: -1.6170, feed: "https://placeimg.com/640/480/traffic?K13" },
  { id: "K14", name: "Atonsu", lat: 6.7150, lng: -1.5880, feed: "https://placeimg.com/640/480/traffic?K14" },
  { id: "K15", name: "Asafo Market", lat: 6.6849, lng: -1.6229, feed: "https://placeimg.com/640/480/traffic?K15" },
  { id: "K16", name: "Fante New Town", lat: 6.7100, lng: -1.6010, feed: "https://placeimg.com/640/480/traffic?K16" },
  { id: "K17", name: "Kotei", lat: 6.6840, lng: -1.5700, feed: "https://placeimg.com/640/480/traffic?K17" },
  { id: "K18", name: "Suame Magazine", lat: 6.7060, lng: -1.6120, feed: "https://placeimg.com/640/480/traffic?K18" },
  { id: "K19", name: "Odwomase", lat: 6.7000, lng: -1.6200, feed: "https://placeimg.com/640/480/traffic?K19" },
  { id: "K20", name: "Bodwesango", lat: 6.7200, lng: -1.6400, feed: "https://placeimg.com/640/480/traffic?K20" },
];

function generateMockRoute(start, end, numAlternatives = 2) {
  const colors = ["green", "orange", "blue"];
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
      liveImage: `https://placeimg.com/640/480/traffic?${start.id}${end.id}${i}`,
    });
  }
  return routes;
}

export const kumasiRoutes = [];
kumasiIntersections.forEach((start) => {
  kumasiIntersections.forEach((end) => {
    if (start.id !== end.id) {
      kumasiRoutes.push({
        start: start.name,
        end: end.name,
        alternatives: generateMockRoute(start, end, 2),
      });
    }
  });
});
