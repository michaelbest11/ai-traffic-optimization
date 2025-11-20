import React, { useState, useEffect } from "react";
import "./App.css";
import api from "./api";

// datasets & components
import { accraIntersections } from "./dataset/accraIntersections";
import { accraRoutes } from "./dataset/accraRoutes";
import { kumasiIntersections } from "./dataset/kumasiIntersections";
import { kumasiRoutes } from "./dataset/kumasiRoutes";

import MapView from "./components/MapView";
import LiveFeed from "./components/LiveFeed";
import RouteList from "./components/RouteList";
import TrafficStats from "./components/TrafficStats";

const DEFAULT_CITY = "Accra";

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [trafficData, setTrafficData] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const intersections = city === "Accra" ? accraIntersections : kumasiIntersections;
  const routes = city === "Accra" ? accraRoutes : kumasiRoutes;

  useEffect(() => {
    // fetch traffic summary from backend (falls back to local mock if API 404)
    const loadTraffic = async () => {
      try {
        const res = await api.getTraffic(city);
        setTrafficData(res);
      } catch (err) {
        console.warn("Failed to fetch backend traffic; using client mock summary.");
        // derive a simple summary from intersections for UI continuity
        setTrafficData({
          city,
          summary: {
            total_intersections: intersections.length,
            high_congestion: Math.floor(intersections.length * 0.2),
            average_speed: 22.5,
          },
          timestamp: new Date().toISOString(),
        });
      }
    };
    loadTraffic();
  }, [city, intersections.length]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>🚦 AI/ML Traffic Flow Optimizer</h1>
          <div className="subtitle">Ghana • Accra & Kumasi — Google Maps edition</div>
        </div>

        <div className="controls">
          <label>
            City:
            <select value={city} onChange={(e) => { setCity(e.target.value); setSelectedRoute(null); }}>
              <option value="Accra">Accra</option>
              <option value="Kumasi">Kumasi</option>
            </select>
          </label>
        </div>
      </header>

      <main className="main-grid">
        <section className="left-col">
          <MapView
            apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            intersections={intersections}
            routes={routes}
            onSelectRoute={(r) => setSelectedRoute(r)}
            selectedRoute={selectedRoute}
          />

          <TrafficStats trafficData={trafficData} />
        </section>

        <aside className="right-col">
          <LiveFeed intersections={intersections} />
          <RouteList
            routes={routes}
            selectedRoute={selectedRoute}
            onSelectRoute={(r) => setSelectedRoute(r)}
          />
        </aside>
      </main>

      <footer className="app-footer">
        By Michael O. Mantey © 2025 • Put real backend URL in `.env` as REACT_APP_BACKEND_URL
      </footer>
    </div>
  );
}