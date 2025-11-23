// src/App.js
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import api from "./lib/api";
import Hls from "hls.js";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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

// adjust to where your backend is running
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";
const API = BACKEND_URL + "/api";

// Simple camera catalog (can load from dataset files or cams.json)
const cameraCatalog = {
  Accra: [
    { id: "accra_cam_1", title: "Ring Rd HLS", type: "hls", url: `${BACKEND_URL}/hls_streams/accra_cam_1/index.m3u8`, thumbnail: "/feed/accra/videos/thumbs/accra_cam_1.jpg", coords: [5.5600, -0.1969], source_rtsp: "rtsp://..." },
    { id: "accra_local_1", title: "Osu Local MP4", type: "mp4", url: "/feed/accra/videos/accra_osu_incident.mp4", thumbnail: "/feed/accra/videos/thumbs/accra_osu_incident.jpg", coords: [5.5522, -0.1965] }
  ],
  Kumasi: [
    { id: "kumasi_cam_2", title: "Tech Junction HLS", type: "hls", url: `${BACKEND_URL}/hls_streams/kumasi_cam_2/index.m3u8`, thumbnail: "/feed/kumasi/videos/thumbs/kumasi_cam_2.jpg", coords: [6.6745, -1.5716] }
  ]
};

// helper to fit bounds from latlng arrays
const FitBounds = ({ latlngs }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !latlngs || latlngs.length === 0) return;
    try {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) {
      // ignore
    }
  }, [map, latlngs]);
  return null;
};

// LiveFeed component (HLS + MP4 + YouTube support)
function LiveFeed({ selectedCity, cameras = [], selectedCamera, onSelectCamera }) {
  const [activeCam, setActiveCam] = useState(selectedCamera || (cameras && cameras[0]) || null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);
  const [clipStart, setClipStart] = useState("00:00:00");
  const [clipDuration, setClipDuration] = useState(15);
  const [clips, setClips] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selectedCamera) setActiveCam(selectedCamera);
  }, [selectedCamera]);

  useEffect(() => {
    if (!activeCam && cameras && cameras.length) setActiveCam(cameras[0]);
    // eslint-disable-next-line
  }, [cameras]);

  useEffect(() => {
    setError(null);
    let hls;
    const v = videoRef.current;
    if (!activeCam) return;

    if (activeCam.type === "youtube") {
      if (iframeRef.current) iframeRef.current.src = activeCam.url;
      if (v) {
        v.pause();
        v.src = "";
      }
      return () => { if (iframeRef.current) iframeRef.current.src = ""; };
    }

    if (activeCam.type === "mp4") {
      if (v) {
        v.src = activeCam.url;
        v.play().catch(()=>{});
      }
      return () => { if (v) { v.pause(); v.src = ""; } };
    }

    if (activeCam.type === "hls") {
      if (!v) return;
      const url = activeCam.url;
      if (v.canPlayType("application/vnd.apple.mpegurl")) {
        v.src = url;
        v.play().catch(()=>{});
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          v.play().catch(()=>{});
        });
        hls.on(Hls.Events.ERROR, (ev, data) => {
          console.error("HLS error", data);
          setError("Stream error");
        });
      } else {
        setError("HLS not supported");
      }
    }

    return () => {
      if (hls) hls.destroy();
      if (v) { v.pause(); v.src = ""; }
    };
  }, [activeCam]);

  useEffect(() => {
    // load clip list
    (async () => {
      try {
        const res = await axios.get(`${API}/clip/list`);
        setClips(res.data || []);
      } catch (e) {}
    })();
  }, []);

  const requestClip = async () => {
    if (!activeCam) return alert("Select camera");
    const payload = {
      source: activeCam.source_rtsp || activeCam.url,
      start: clipStart,
      duration: Number(clipDuration),
      camId: activeCam.id
    };
    setCreating(true);
    try {
      await axios.post(`${API}/clip`, payload);
      alert("Clip request queued (server will process in background)");
    } catch (e) {
      console.error(e);
      alert("Clip request failed");
    } finally {
      setCreating(false);
    }
  };

  const downloadClip = (f) => window.open(`${BACKEND_URL}/clips/${f}`, "_blank");

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-black rounded overflow-hidden" style={{ height: 360 }}>
          {activeCam && activeCam.type === "youtube" ? (
            <iframe ref={iframeRef} title="youtube" src={activeCam.url} width="100%" height="100%" frameBorder="0" allow="autoplay; encrypted-media" />
          ) : (
            <video ref={videoRef} width="100%" height="100%" controls muted autoPlay playsInline style={{ objectFit: "cover", backgroundColor:"#000" }} />
          )}
        </div>

        <aside>
          <div className="bg-white p-3 rounded shadow mb-3">
            <div className="font-semibold">Cameras — {selectedCity}</div>
            <div className="space-y-2 max-h-60 overflow-auto mt-2">
              {cameras.map((c) => (
                <button key={c.id} onClick={() => { setActiveCam(c); if (onSelectCamera) onSelectCamera(c); }} className={`w-full text-left p-2 border rounded ${activeCam && activeCam.id === c.id ? "bg-blue-50" : "bg-white"}`}>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-gray-600">{c.type.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm font-semibold mb-2">Create Clip</div>
            <input value={clipStart} onChange={(e)=>setClipStart(e.target.value)} className="w-full px-2 py-1 border rounded mb-2" />
            <input type="number" value={clipDuration} onChange={(e)=>setClipDuration(e.target.value)} className="w-full px-2 py-1 border rounded mb-2" />
            <button onClick={requestClip} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={creating}>{creating ? "Queued..." : "Create Clip"}</button>
          </div>
        </aside>
      </div>

      <div className="mt-4 bg-white p-3 rounded shadow">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">Stored Clips</div>
          <button onClick={async ()=>{ const r = await axios.get(`${API}/clip/list`); setClips(r.data||[]); }} className="px-2 py-1 bg-gray-200 rounded text-sm">Refresh</button>
        </div>
        <div className="space-y-2">
          {clips.length === 0 && <div className="text-sm text-gray-600">No clips yet.</div>}
          {clips.map((cl) => (
            <div key={cl.filename} className="flex items-center justify-between border-b py-2">
              <div>
                <div className="font-medium">{cl.filename}</div>
                <div className="text-xs text-gray-500">{cl.created_at}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>downloadClip(cl.filename)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}

// main App
function App() {
  const [selectedCity, setSelectedCity] = useState("Accra");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [routes, setRoutes] = useState([]);
  const [aiRoute, setAiRoute] = useState(null);
  const [liveSelectedCamera, setLiveSelectedCamera] = useState(null);
  const mapRef = useRef(null);
  const [mapLatLngs, setMapLatLngs] = useState(null);

  useEffect(() => {
    // load initial city routes - here we try to fetch from a dataset endpoint or local dataset
    // for demo: create example route(s)
    const exampleRoutes = [
      {
        id: "r1",
        start: "Airport",
        end: "Circle",
        path: [{lat:5.601, lng:-0.166}, {lat:5.583, lng:-0.181}, {lat:5.561, lng:-0.196}],
        alternatives: [{id:"a1", route:[{lat:5.601,lng:-0.166},{lat:5.580,lng:-0.175},{lat:5.561,lng:-0.196}], color:"#1976d2", trafficLevel:"Moderate", liveImage: null}]
      }
    ];
    setRoutes(exampleRoutes);
    setMapLatLngs(exampleRoutes.flatMap(r => r.path.map(p => [p.lat, p.lng])));
  }, []);

  const camerasForCity = cameraCatalog[selectedCity] || [];

  const onGetAiRoute = async (start, end) => {
    try {
      const resp = await axios.post(`${API}/route/optimize`, { start, end, city: selectedCity });
      const route = resp.data.optimized_route || resp.data.optimizedRoute || [];
      setAiRoute(route);
      if (route && route.length) {
        setMapLatLngs(route.map(p => [p.lat, p.lng]));
        setActiveTab("route");
      }
    } catch (e) {
      console.error(e);
      // fallback mock
      const mock = [start, {lat:(start.lat+end.lat)/2, lng:(start.lng+end.lng)/2}, end];
      setAiRoute(mock);
      setMapLatLngs(mock.map(p=>[p.lat,p.lng]));
      setActiveTab("route");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 border-b">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">🚦 AI/ML Traffic Flow Optimizer</h1>
          <div className="flex items-center gap-3">
            <select value={selectedCity} onChange={(e)=>setSelectedCity(e.target.value)} className="px-2 py-1 border rounded">
              <option>Accra</option>
              <option>Kumasi</option>
            </select>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex gap-4">
          {[
            {id:"dashboard", name:"Dashboard"},
            {id:"route", name:"Route Optimization"},
            {id:"live", name:"Live Traffic"},
            {id:"ml-predict", name:"Predictions"},
            {id:"ml-analytics", name:"Analytics"}
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`py-2 px-3 ${activeTab===t.id ? "border-b-2 border-blue-500 text-blue-600": "text-gray-600"}`}>{t.name}</button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Traffic Overview — {selectedCity}</h2>

              <MapContainer center={mapLatLngs && mapLatLngs.length ? mapLatLngs[0] : [5.5566, -0.1969]} zoom={13} style={{height:420}}>
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapLatLngs && mapLatLngs.length && <FitBounds latlngs={mapLatLngs} />}
                {/* show example routes */}
                {routes.map(r => <Polyline key={r.id} positions={r.path.map(p=>[p.lat,p.lng])} pathOptions={{color:"#3b82f6"}} />)}
                {/* show camera markers */}
                {camerasForCity.map(c => <Marker key={c.id} position={c.coords} eventHandlers={{click: ()=>{ setLiveSelectedCamera(c); setActiveTab("live"); }}}><Popup>{c.title}<br/><small>{c.type}</small></Popup></Marker>)}
                {/* show ai route if present */}
                {aiRoute && aiRoute.length>0 && (
                  <>
                    <Polyline positions={aiRoute.map(p=>[p.lat,p.lng])} pathOptions={{color:"#ef4444", weight:5}} />
                    <Marker position={[aiRoute[0].lat, aiRoute[0].lng]}><Popup>AI Start</Popup></Marker>
                    <Marker position={[aiRoute[aiRoute.length-1].lat, aiRoute[aiRoute.length-1].lng]}><Popup>AI End</Popup></Marker>
                  </>
                )}
              </MapContainer>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold">Live Cameras</h3>
              <div className="space-y-2 mt-2">
                {camerasForCity.map(c=>(
                  <button key={c.id} onClick={()=>{ setLiveSelectedCamera(c); setActiveTab("live"); }} className="w-full text-left p-2 border rounded">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-gray-600">{c.type}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="font-semibold">Quick AI Route</h4>
                <QuickAiRouteForm onGetAiRoute={onGetAiRoute} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "route" && (
          <div className="grid lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <RouteForm onGetAiRoute={onGetAiRoute} city={selectedCity} />
              <div className="bg-white p-2 rounded shadow mt-3">
                <h4 className="font-semibold">Routes</h4>
                <div className="mt-2 space-y-2">
                  {routes.map(r=>(
                    <div key={r.id} className="p-2 border rounded">
                      <strong>{r.start} → {r.end}</strong>
                      <div className="text-xs text-gray-500">Alts: {r.alternatives.length}</div>
                      <button onClick={()=>{ setMapLatLngs(r.path.map(p=>[p.lat,p.lng])); setAiRoute(null); }} className="mt-2 px-2 py-1 bg-gray-200 rounded text-sm">Show</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded shadow overflow-hidden" style={{height:640}}>
                <MapContainer center={mapLatLngs && mapLatLngs.length ? mapLatLngs[0] : [5.5566,-0.1969]} zoom={13} style={{height:"100%", width:"100%"}}>
                  <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {mapLatLngs && <FitBounds latlngs={mapLatLngs} />}
                  {aiRoute && aiRoute.length>0 && <Polyline positions={aiRoute.map(p=>[p.lat,p.lng])} pathOptions={{color:"#ef4444", weight:6}} />}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "live" && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold">Live Traffic — {selectedCity}</h2>
            <LiveFeed selectedCity={selectedCity} cameras={camerasForCity} selectedCamera={liveSelectedCamera} onSelectCamera={c=>setLiveSelectedCamera(c)} />
          </div>
        )}

        {activeTab === "ml-predict" && (
          <div>
            <h2 className="font-semibold">AI/ML Predictions — {selectedCity}</h2>
            <p>Use API: <code>{API}/ml/...</code> to fetch predictions and render charts here.</p>
          </div>
        )}

        {activeTab === "ml-analytics" && (
          <div>
            <h2 className="font-semibold">ML Analytics — {selectedCity}</h2>
            <p>Render Recharts/Charts here based on API responses.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// small helper components
function RouteForm({ onGetAiRoute, city }) {
  const [startLat, setStartLat] = useState("5.5600");
  const [startLng, setStartLng] = useState("-0.1969");
  const [endLat, setEndLat] = useState("5.5566");
  const [endLng, setEndLng] = useState("-0.1969");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onGetAiRoute({lat: parseFloat(startLat), lng: parseFloat(startLng)}, {lat: parseFloat(endLat), lng: parseFloat(endLng)});
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-3 rounded shadow">
      <h4 className="font-semibold">Get AI Route</h4>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <input value={startLat} onChange={(e)=>setStartLat(e.target.value)} className="px-2 py-1 border rounded" />
        <input value={startLng} onChange={(e)=>setStartLng(e.target.value)} className="px-2 py-1 border rounded" />
        <input value={endLat} onChange={(e)=>setEndLat(e.target.value)} className="px-2 py-1 border rounded" />
        <input value={endLng} onChange={(e)=>setEndLng(e.target.value)} className="px-2 py-1 border rounded" />
      </div>
      <div className="mt-2">
        <button onClick={submit} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Thinking..." : "Optimize Route"}</button>
      </div>
    </div>
  );
}

function QuickAiRouteForm({ onGetAiRoute }) {
  // small quick selects for demo
  return (
    <div className="mt-2 space-y-2">
      <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>onGetAiRoute({lat:5.601,lng:-0.166},{lat:5.561,lng:-0.196})}>Airport → Circle</button>
      <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>onGetAiRoute({lat:5.561,lng:-0.196},{lat:5.601,lng:-0.166})}>Circle → Airport</button>
    </div>
  );
}

export default App;
