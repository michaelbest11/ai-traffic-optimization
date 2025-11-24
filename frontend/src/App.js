import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { accraRoutes } from "./dataset/accraRoutes";
import { kumasiRoutes } from "./dataset/kumasiRoutes";

import LiveFeed from "./components/LiveFeed";
import TrafficStats from "./components/TrafficStats";
import { RouteList, RouteRecommendation, FitBounds, toLatLngs } from "./components/RouteComponents";

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

// Camera catalog
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

const camerasForCity = cameraCatalog[selectedCity] || [];

// Update routes safely when city changes
useEffect(() => {
const cityRoutes = selectedCity === "Accra" ? accraRoutes : kumasiRoutes;
setRoutes(cityRoutes || []);
setSelectedRouteId(null);
setAiRouteCoords(null);
const allCoords = cityRoutes.flatMap((r) => toLatLngs(r.path));
setMapLatLngsForFit(allCoords.length ? allCoords : null);
}, [selectedCity]);

// Update map bounds safely when route or AI route changes
useEffect(() => {
const latlngs = aiRouteCoords?.length
? toLatLngs(aiRouteCoords)
: selectedRouteId
? toLatLngs(routes.find((r) => r.id === selectedRouteId)?.path)
: routes.flatMap((r) => toLatLngs(r.path));
setMapLatLngsForFit(latlngs.length ? latlngs : null);
}, [selectedRouteId, aiRouteCoords, routes]);

const handleRouteSelect = (id) => {
if (selectedRouteId === id) setSelectedRouteId(null);
else { setSelectedRouteId(id); setAiRouteCoords(null); }
};

const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];

return ( <div className="min-h-screen bg-gray-100"> <header className="bg-white p-4 border-b"> <div className="flex justify-between items-center max-w-7xl mx-auto"> <h1 className="text-xl font-bold">🚦 AI/ML Traffic Flow Optimizer</h1> <div className="flex items-center gap-3"> <label className="text-sm">City</label>
<select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-2 py-1 border rounded"> <option>Accra</option> <option>Kumasi</option> </select> </div> </div> </header>


  <main className="max-w-7xl mx-auto p-4 grid grid-cols-3 gap-4">
    {/* Left panel: routes and AI recommendations */}
    <div className="col-span-1 space-y-4">
      <RouteRecommendation
        city={selectedCity}
        cameras={camerasForCity}
        onRouteGenerated={setAiRouteCoords}
        onCameraSelect={setLiveSelectedCamera}
      />
      <RouteList
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={handleRouteSelect}
        cameras={camerasForCity}
        onCameraSelect={setLiveSelectedCamera}
      />
    </div>

    {/* Map panel */}
    <div className="col-span-2 bg-white rounded shadow p-2">
      <MapContainer
        center={mapInitialCenter}
        zoom={13}
        style={{ height: "600px", width: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {mapLatLngsForFit && <FitBounds latlngs={mapLatLngsForFit} mapRef={mapRef} />}

        {/* Draw AI route */}
        {aiRouteCoords?.length > 0 && (
          <Polyline positions={toLatLngs(aiRouteCoords)} pathOptions={{ color: "red", weight: 4 }} />
        )}

        {/* Show city cameras */}
        {camerasForCity.map((cam) => (
          <Marker key={cam.id} position={cam.coords}>
            <Popup>
              <strong>{cam.title}</strong>
              <br />
              {cam.type === "mp4" && (
                <video width="200" controls>
                  <source src={cam.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
              {cam.type === "hls" && (
                <div>
                  <button onClick={() => setLiveSelectedCamera(cam)}>View HLS Feed</button>
                </div>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>

    {/* Live feed panel */}
    {liveSelectedCamera && (
      <div className="col-span-3 mt-4">
        <LiveFeed camera={liveSelectedCamera} />
      </div>
    )}

    {/* Traffic stats panel */}
    <div className="col-span-3 mt-4">
      <TrafficStats />
    </div>
  </main>
</div>


);
}

export default App;
