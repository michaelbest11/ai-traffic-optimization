// frontend/src/data/accraData.js
export const accraIntersections = [
  { id: "A1", name: "Kotoka Airport", lat: 5.6051, lng: -0.1660, feed: "https://placeimg.com/640/480/traffic?A1" },
  { id: "A2", name: "Circle", lat: 5.5560, lng: -0.1969, feed: "https://placeimg.com/640/480/traffic?A2" },
  { id: "A3", name: "Osu", lat: 5.5566, lng: -0.1740, feed: "https://placeimg.com/640/480/traffic?A3" },
  { id: "A4", name: "East Legon", lat: 5.6149, lng: -0.1600, feed: "https://placeimg.com/640/480/traffic?A4" },
  { id: "A5", name: "Spintex Road", lat: 5.5976, lng: -0.1346, feed: "https://placeimg.com/640/480/traffic?A5" },
  { id: "A6", name: "Tema Motorway", lat: 5.6589, lng: -0.1495, feed: "https://placeimg.com/640/480/traffic?A6" },
  { id: "A7", name: "Adabraka", lat: 5.5569, lng: -0.2012, feed: "https://placeimg.com/640/480/traffic?A7" },
  { id: "A8", name: "Achimota", lat: 5.6008, lng: -0.2240, feed: "https://placeimg.com/640/480/traffic?A8" },
  { id: "A9", name: "Lapaz", lat: 5.5769, lng: -0.2261, feed: "https://placeimg.com/640/480/traffic?A9" },
  { id: "A10", name: "North Ridge", lat: 5.5649, lng: -0.1976, feed: "https://placeimg.com/640/480/traffic?A10" },
  { id: "A11", name: "Labone", lat: 5.5567, lng: -0.1821, feed: "https://placeimg.com/640/480/traffic?A11" },
  { id: "A12", name: "Kaneshie", lat: 5.5544, lng: -0.1979, feed: "https://placeimg.com/640/480/traffic?A12" },
  { id: "A13", name: "Dansoman", lat: 5.5562, lng: -0.2581, feed: "https://placeimg.com/640/480/traffic?A13" },
  { id: "A14", name: "Abeka", lat: 5.5524, lng: -0.1887, feed: "https://placeimg.com/640/480/traffic?A14" },
  { id: "A15", name: "Teshie", lat: 5.5721, lng: -0.0800, feed: "https://placeimg.com/640/480/traffic?A15" },
  { id: "A16", name: "Madina", lat: 5.6496, lng: -0.0131, feed: "https://placeimg.com/640/480/traffic?A16" },
  { id: "A17", name: "Osu Oxford Street", lat: 5.5566, lng: -0.1752, feed: "https://placeimg.com/640/480/traffic?A17" },
  { id: "A18", name: "Accra Central", lat: 5.5570, lng: -0.2050, feed: "https://placeimg.com/640/480/traffic?A18" },
  { id: "A19", name: "Circle Mall", lat: 5.5561, lng: -0.1989, feed: "https://placeimg.com/640/480/traffic?A19" },
  { id: "A20", name: "Kwame Nkrumah Ave", lat: 5.5577, lng: -0.2011, feed: "https://placeimg.com/640/480/traffic?A20" },
];

// helper
function generateMockRoute(start, end, numAlternatives = 2) {
  const colors = ["blue", "green", "red"];
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
