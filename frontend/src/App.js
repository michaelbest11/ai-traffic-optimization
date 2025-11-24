import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";

import { accraRoutes } from "./dataset/accraRoutes";
import { kumasiRoutes } from "./dataset/kumasiRoutes";

import LiveFeed from "./components/LiveFeed";
import TrafficStats from "./components/TrafficStats";
import { RouteList, RouteRecommendation, FitBounds } from "./components/RouteComponents";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
iconRetinaUrl:
"[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png)",
iconUrl:
"[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png)",
shadowUrl:
"[https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png](https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png)",
});

// Helpers
const toLatLngs = (path) => (path || []).map((p) => [p.lat, p.lng]);

const cameraCatalog = {
Accra: [
{ id: "accra_cam_1", title: "Ring Rd HLS", type: "hls", url: "http://localhost:8000/hls/accra_cam_1/index.m3u8", thumbnail: "/videos/thumbs/accra_cam_1.jpg", coords: [5.5600, -0.1969] },
{ id: "accra_cam_2", title: "Kwame Nkrumah MP4", type: "mp4", url: "[https://www.w3schools.com/html/mov_bbb.mp4](https://www.w3schools.com/html/mov_bbb.mp4)", thumbnail: "feeds/Accra/videos/thumbs/accra_cam_2.jpg", coords: [5.5566, -0.1969] },
],
Kumasi: [
{ id: "kumasi_cam_1", title: "Kejetia MP4", type: "mp4", url: "[https://www.w3schools.com/html/mov_bbb.mp4](https://www.w3schools.com/html/mov_bbb.mp4)", thumbnail: "feeds/Kumasi/videos/thumbs/kumasi_cam_1.jpg", coords: [6.6889, -1.6244] },
],
};

function App() {
const [selectedCity, setSelectedCity] = useState("Accra");
const [routes, setRoutes] = useState(accraRoutes);
const [selectedRouteId, setSelectedRouteId] = useState(null);
const [aiRouteCoords, setAiRouteCoords] = useState(null);
const [mapLatLngsForFit, setMapLatLngsForFit] = useState(null);
const [liveSelectedCamera, setLiveSelectedCamera] = useState(null);
const mapRef = useRef(null);
const [activeTab, setActiveTab] = useState("dashboard");

const camerasForCity = cameraCatalog[selectedCity] || [];

// Update city routes
useEffect(() => {
const cityRoutes = selectedCity === "Accra" ? accraRoutes : kumasiRoutes;
setRoutes(cityRoutes);
setSelectedRouteId(null);
setAiRouteCoords(null);
const allCoords = cityRoutes.flatMap((r) => toLatLngs(r.path || []));
setMapLatLngsForFit(allCoords.length ? allCoords : null);
}, [selectedCity]);

// Update map bounds when route or AI route changes
useEffect(() => {
if (aiRouteCoords && aiRouteCoords.length) {
setMapLatLngsForFit(aiRouteCoords.map((p) => [p.lat, p.lng]));
setSelectedRouteId(null);
} else if (selectedRouteId) {
const r = routes.find((x) => x.id === selectedRouteId);
if (r) setMapLatLngsForFit(toLatLngs(r.path || []));
} else {
const allCoords = routes.flatMap((r) => toLatLngs(r.path || []));
setMapLatLngsForFit(allCoords.length ? allCoords : null);
}
}, [selectedRouteId, aiRouteCoords, routes]);

const handleRouteSelect = (id) => {
if (selectedRouteId === id) setSelectedRouteId(null);
else { setSelectedRouteId(id); setAiRouteCoords(null); }
};

const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];

return ( <div className="min-h-screen bg-gray-100"> <header className="bg-white p-4 border-b"> <div className="flex justify-between items-center max-w-7xl mx-auto"> <h1 className="text-xl font-bold">🚦 AI/ML Traffic Flow Optimizer</h1> <div className="flex items-center gap-3"> <label className="text-sm">City</label>
<select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-2 py-1 border rounded"> <option>Accra</option> <option>Kumasi</option> </select> </div> </div> </header>


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
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-2 ${activeTab === t.id ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"}`}>
            {t.icon} {t.name}
          </button>
        ))}
      </div>
    </div>
  </nav>

  <main className="max-w-7xl mx-auto p-4">
    {activeTab === "dashboard" && (
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="font-semibold">Traffic Overview — {selectedCity}</h2>
          <MapContainer center={mapInitialCenter} zoom={13} style={{ height: 400, width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
            <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapLatLngsForFit && <FitBounds latlngs={mapLatLngsForFit} />}
          </MapContainer>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Live Cameras</h3>
          <LiveFeed selectedCity={selectedCity} cameras={camerasForCity} selectedCamera={liveSelectedCamera} onSelectCamera={(cam) => setLiveSelectedCamera(cam)} />
          <div className="mt-4">
            <TrafficStats selectedCity={selectedCity} />
          </div>
        </div>
      </div>
    )}

    {activeTab === "route" && (
      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <RouteRecommendation
            city={selectedCity}
            cameras={camerasForCity}
            onRouteGenerated={(coords) => setAiRouteCoords(coords)}
            onCameraSelect={(cam) => setLiveSelectedCamera(cam)}
          />
          <div className="bg-white p-2 rounded shadow">
            <h4 className="font-semibold">City Routes</h4>
            <RouteList routes={routes} selectedRouteId={selectedRouteId} onSelectRoute={handleRouteSelect} cameras={camerasForCity} onCameraSelect={(cam) => setLiveSelectedCamera(cam)} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="bg-white rounded shadow overflow-hidden" style={{ height: 640 }}>
            <MapContainer center={mapInitialCenter} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={(m) => (mapRef.current = m)}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapLatLngsForFit && <FitBounds latlngs={mapLatLngsForFit} />}
            </MapContainer>
          </div>
        </div>
      </div>
    )}
  </main>
</div>


);
}

export default App;
