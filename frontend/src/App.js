// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import api from "./lib/api";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// dataset & component imports (assumed present)
import { accraIntersections } from "./dataset/accraIntersections";
import { accraRoutes } from "./dataset/accraRoutes";
import { kumasiIntersections } from "./dataset/kumasiIntersections";
import { kumasiRoutes } from "./dataset/kumasiRoutes";

import MapView from "./components/MapView";
import LiveFeed from "./components/LiveFeed";
import RouteList from "./components/RouteList";
import TrafficStats from "./components/TrafficStats";

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Example camera catalog (combine local & remote). Replace URLs with yours.
const cameraCatalog = {
  Accra: [
    { id: "accra_cam_1", title: "Ring Rd HLS", type: "hls", url: "http://localhost:8000/hls/accra_cam_1/index.m3u8", thumbnail: "/videos/thumbs/accra_cam_1.jpg", coords: [5.5600, -0.1969], source_rtsp: "rtsp://user:pass@10.0.0.10:554/stream" },
    { id: "accra_cam_2", title: "Kwame Nkrumah MP4", type: "mp4", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnail: "/videos/thumbs/accra_cam_2.jpg", coords: [5.5566, -0.1969] },
    { id: "accra_cam_local_1", title: "Local Osu Clip", type: "mp4", url: "/videos/accra_osu_incident.mp4", thumbnail: "/videos/thumbs/accra_osu_incident.jpg", coords: [5.5522, -0.1965] },
  ],
  Kumasi: [
    { id: "kumasi_cam_1", title: "Kejetia MP4", type: "mp4", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumbnail: "/videos/thumbs/kumasi_cam_1.jpg", coords: [6.6889, -1.6244] },
    { id: "kumasi_local_1", title: "Kumasi Local Clip", type: "mp4", url: "/videos/kumasi_clip.mp4", thumbnail: "/videos/thumbs/kumasi_clip.jpg", coords: [6.6895, -1.6220] },
  ],
};

const toLatLngs = (path) => (path || []).map((p) => [p.lat, p.lng]);

const FitBounds = ({ latlngs }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !latlngs || !latlngs.length) return;
    try {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {}
  }, [map, latlngs]);
  return null;
};

const RouteRecommendation = ({ city, onRouteGenerated }) => {
  // same route optimization implementation you already have
  // (use your existing RouteRecommendation here or copy previous version)
  // For brevity keep a compact version:
  const [formData, setFormData] = useState({
    startLat: "5.5600",
    startLng: "-0.1969",
    endLat: "5.5566",
    endLng: "-0.1969",
    city,
  });
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);

  useEffect(() => setFormData((f) => ({ ...f, city })), [city]);

  const handleOptimizeRoute = async () => {
    setLoading(true);
    try {
      const payload = {
        start: { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
        end: { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
        city: formData.city,
      };
      let resp;
      try {
        resp = await api.optimizeRoute(payload);
      } catch (e) {
        resp = { data: null };
      }
      let final;
      if (resp && resp.data && resp.data.optimized_route) final = resp.data;
      else {
        await new Promise((r) => setTimeout(r, 400));
        final = {
          optimized_route: [
            payload.start,
            { lat: (payload.start.lat + payload.end.lat) / 2, lng: (payload.start.lng + payload.end.lng) / 2 },
            payload.end,
          ],
          estimated_time_minutes: 15,
          distance_km: 3.2,
          traffic_conditions: "Moderate",
          ai_insights: "Mock: avoids hotspots",
        };
      }
      setRouteData(final);
      if (onRouteGenerated) onRouteGenerated(final.optimized_route);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <h3 className="font-semibold mb-2">AI Route Optimization</h3>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input value={formData.startLat} onChange={(e) => setFormData({ ...formData, startLat: e.target.value })} className="px-2 py-1 border rounded" />
        <input value={formData.startLng} onChange={(e) => setFormData({ ...formData, startLng: e.target.value })} className="px-2 py-1 border rounded" />
        <input value={formData.endLat} onChange={(e) => setFormData({ ...formData, endLat: e.target.value })} className="px-2 py-1 border rounded" />
        <input value={formData.endLng} onChange={(e) => setFormData({ ...formData, endLng: e.target.value })} className="px-2 py-1 border rounded" />
      </div>
      <div className="flex gap-2">
        <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="px-2 py-1 border rounded">
          <option>Accra</option>
          <option>Kumasi</option>
        </select>
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleOptimizeRoute} disabled={loading}>
          {loading ? "Optimizing..." : "Get AI Route"}
        </button>
      </div>
      {routeData && (
        <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
          <div>ETA: {routeData.estimated_time_minutes} min • {routeData.distance_km} km</div>
          <div className="mt-1">Insight: {routeData.ai_insights}</div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [selectedCity, setSelectedCity] = useState("Accra");
  const [routes, setRoutes] = useState(accraRoutes);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [aiRouteCoords, setAiRouteCoords] = useState(null);
  const [mapLatLngsForFit, setMapLatLngsForFit] = useState(null);
  const [liveSelectedCamera, setLiveSelectedCamera] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // initial load and when city changes
    if (selectedCity === "Accra") setRoutes(accraRoutes);
    else setRoutes(kumasiRoutes);
    setSelectedRouteId(null);
    setAiRouteCoords(null);

    // combine all route coordinates
    const allCoords = (selectedCity === "Accra" ? accraRoutes : kumasiRoutes).flatMap((r) => toLatLngs(r.path || []));
    if (allCoords.length) setMapLatLngsForFit(allCoords);
  }, [selectedCity]);

  useEffect(() => {
    if (!selectedRouteId) {
      // fit to all routes
      const all = routes.flatMap((r) => toLatLngs(r.path || []));
      if (all.length) setMapLatLngsForFit(all);
      return;
    }
    const r = routes.find((x) => x.id === selectedRouteId);
    if (r) setMapLatLngsForFit(toLatLngs(r.path || []));
  }, [selectedRouteId, routes]);

  useEffect(() => {
    if (aiRouteCoords && aiRouteCoords.length) {
      setMapLatLngsForFit(aiRouteCoords.map((p) => [p.lat, p.lng]));
      setSelectedRouteId(null);
    }
  }, [aiRouteCoords]);

  const handleRouteSelect = (id) => {
    if (selectedRouteId === id) setSelectedRouteId(null);
    else { setSelectedRouteId(id); setAiRouteCoords(null); }
  };

  // cameras for map markers / live feed
  const camerasForCity = cameraCatalog[selectedCity] || [];

  // click marker handler: open camera in live feed
  const onMarkerClickOpenCamera = (camId) => {
    const cam = camerasForCity.find((c) => c.id === camId);
    if (cam) {
      setLiveSelectedCamera(cam);
      setAiRouteCoords(null);
      setSelectedRouteId(null);
      // also switch to Live tab
      // (we want to keep activeTab in state; simple approach: use hash or navigate)
      // For simplicity, toggle to route "live" by setting a small piece of state:
      setActiveTab("live");
    }
  };

  // Active tab state moved here (used in nav)
  const [activeTab, setActiveTab] = useState("dashboard");

  // initial center
  const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 border-b">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">🚦 AI/ML Traffic Flow Optimizer</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm">City</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-2 py-1 border rounded">
              <option>Accra</option>
              <option>Kumasi</option>
            </select>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: "dashboard", name: "Dashboard", icon: "🚦" },
              { id: "route", name: "Route Optimization", icon: "🗺️" },
              { id: "ml-predict", name: "Predictions", icon: "🤖" },
              { id: "ml-analytics", name: "Analytics", icon: "📊" },
              { id: "live", name: "Live Traffic", icon: "📍" },
            ].map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-2 ${activeTab === t.id ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}>{t.icon} {t.name}</button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white p-4 rounded shadow">
              <h2 className="font-semibold">Traffic Overview — {selectedCity}</h2>
              <MapView selectedCity={selectedCity} routes={routes} />
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Live Cameras</h3>
              <div className="space-y-2 mt-2">
                {camerasForCity.map((c) => (
                  <button key={c.id} onClick={() => setLiveSelectedCamera(c)} className="w-full text-left p-2 border rounded">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.type.toUpperCase()}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <TrafficStats selectedCity={selectedCity} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "route" && (
          <div className="grid lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <RouteRecommendation city={selectedCity} onRouteGenerated={(coords) => setAiRouteCoords(coords)} />
              <div className="bg-white p-2 rounded shadow">
                <h4 className="font-semibold">City Routes</h4>
                <RouteList routes={routes} selectedRouteId={selectedRouteId} onSelectRoute={handleRouteSelect} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded shadow overflow-hidden" style={{ height: 640 }}>
                <MapContainer center={mapInitialCenter} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
                  <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {mapLatLngsForFit && <FitBounds latlngs={mapLatLngsForFit} />}
                  {/* draw routes */}
                  {routes.map((r) => {
                    const latlngs = toLatLngs(r.path || []);
                    const isSelected = selectedRouteId === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <Polyline positions={latlngs} pathOptions={{ color: isSelected ? "#0ea5e9" : "#3b82f6", weight: isSelected ? 6 : 4, opacity: isSelected ? 0.95 : 0.6, dashArray: isSelected ? null : "6,6" }} eventHandlers={{ click: () => handleRouteSelect(r.id) }} />
                        {isSelected && latlngs.length > 0 && (
                          <>
                            <Marker position={latlngs[0]}><Popup>Start</Popup></Marker>
                            <Marker position={latlngs[latlngs.length - 1]}><Popup>End</Popup></Marker>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* draw camera markers */}
                  {camerasForCity.map((cam) => (
                    <Marker key={cam.id} position={cam.coords} eventHandlers={{ click: () => { setLiveSelectedCamera(cam); setActiveTab("live"); } }}>
                      <Popup>
                        <div>
                          <strong>{cam.title}</strong>
                          <div className="text-xs text-gray-600">{cam.type.toUpperCase()}</div>
                          <div className="mt-1"><button onClick={(e) => { e.stopPropagation(); setLiveSelectedCamera(cam); setActiveTab("live"); }} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Open Feed</button></div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* AI route */}
                  {aiRouteCoords && aiRouteCoords.length > 0 && (
                    <>
                      <Polyline positions={aiRouteCoords.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#ef4444", weight: 6 }} />
                      <Marker position={[aiRouteCoords[0].lat, aiRouteCoords[0].lng]}><Popup>AI Start</Popup></Marker>
                      <Marker position={[aiRouteCoords[aiRouteCoords.length - 1].lat, aiRouteCoords[aiRouteCoords.length - 1].lng]}><Popup>AI End</Popup></Marker>
                    </>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "live" && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Live Traffic — {selectedCity}</h2>
            <LiveFeed selectedCity={selectedCity} cameras={camerasForCity} selectedCamera={liveSelectedCamera} onSelectCamera={(cam) => setLiveSelectedCamera(cam)} />
          </div>
        )}

        {activeTab === "ml-predict" && (
          <div>
            <h2 className="font-semibold">AI/ML Predictions — {selectedCity}</h2>
            <MapView selectedCity={selectedCity} routes={routes} />
          </div>
        )}

        {activeTab === "ml-analytics" && (
          <div>
            <h2 className="font-semibold">ML Analytics — {selectedCity}</h2>
            <TrafficStats selectedCity={selectedCity} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
