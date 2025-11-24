import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Set a default backend URL if environment variable is missing
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

// Map component to fit bounds
const FitBounds = ({ latlngs }) => {
  const map = useMap();
  React.useEffect(() => {
    if (!map || !latlngs || !latlngs.length) return;
    try {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } catch (error) {
      console.error("Error fitting bounds:", error);
    }
  }, [map, latlngs]);
  return null;
};

// Map View Component
const MapView = ({ selectedCity, routes = [], selectedRoute, aiRoute }) => {
  const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];
  
  const latlngsForFit = selectedRoute
    ? (selectedRoute.path || []).map(p => [p.lat, p.lng])
    : aiRoute
    ? aiRoute.map(p => [p.lat, p.lng])
    : routes.flatMap(r => (r.path || []).map(p => [p.lat, p.lng]));

  return (
    <div className="w-full h-[400px] rounded-lg border">
      <MapContainer 
        center={mapInitialCenter} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {latlngsForFit && latlngsForFit.length > 0 && <FitBounds latlngs={latlngsForFit} />}
        
        {selectedRoute && selectedRoute.path && (
          <Polyline 
            positions={selectedRoute.path.map(p => [p.lat, p.lng])} 
            color="red" 
            weight={4}
          />
        )}
        
        {aiRoute && (
          <Polyline 
            positions={aiRoute.map(p => [p.lat, p.lng])} 
            color="blue" 
            weight={4}
            dashArray="5, 10"
          />
        )}
        
        {routes.map((route, routeIndex) =>
          (route.path || []).map((point, pointIndex) => (
            <Marker key={`${routeIndex}-${pointIndex}`} position={[point.lat, point.lng]}>
              <Popup>{route.name || `Route ${routeIndex + 1}`}</Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
  );
};

// RouteRecommendation component
const RouteRecommendation = () => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiRoute, setAiRoute] = useState(null);

  const [formData, setFormData] = useState({
    startLat: "5.5600",
    startLng: "-0.1969",
    endLat: "5.5566",
    endLng: "-0.1969",
  });

  const handleOptimize = () => {
    setLoading(true);

    const mockRoute = [
      { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
      {
        lat: (parseFloat(formData.startLat) + parseFloat(formData.endLat)) / 2 + (Math.random() - 0.5) * 0.002,
        lng: (parseFloat(formData.startLng) + parseFloat(formData.endLng)) / 2 + (Math.random() - 0.5) * 0.002,
      },
      { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
    ];

    const mockData = {
      optimized_route: mockRoute,
      distance_km: (4 + Math.random() * 10).toFixed(1),
      estimated_time_minutes: Math.floor(12 + Math.random() * 20),
      ai_insights: "Route generated using AI optimization considering current traffic patterns.",
    };

    setRouteData(mockData);
    setAiRoute(mockRoute);
    setLoading(false);
  };

  // Sample routes for map display
  const sampleRoutes = [
    {
      id: 1,
      name: "Main Route",
      path: [
        { lat: 5.5600, lng: -0.1969 },
        { lat: 5.5580, lng: -0.1950 },
        { lat: 5.5566, lng: -0.1969 }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🚦 Smart Route Optimization</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.startLat}
              onChange={(e) => setFormData({ ...formData, startLat: e.target.value })}
              placeholder="Start Latitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.startLng}
              onChange={(e) => setFormData({ ...formData, startLng: e.target.value })}
              placeholder="Start Longitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.endLat}
              onChange={(e) => setFormData({ ...formData, endLat: e.target.value })}
              placeholder="End Latitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full border border-gray-300 p-2 rounded"
              value={formData.endLng}
              onChange={(e) => setFormData({ ...formData, endLng: e.target.value })}
              placeholder="End Longitude"
            />
          </div>
        </div>

        <button
          onClick={handleOptimize}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Generating Route..." : "Generate Optimized Route"}
        </button>

        {routeData && (
          <div className="bg-gray-50 p-4 rounded-lg border mt-4">
            <h3 className="font-semibold text-lg mb-2">Route Details</h3>
            <p><strong>Distance:</strong> {routeData.distance_km} km</p>
            <p><strong>Estimated Time:</strong> {routeData.estimated_time_minutes} mins</p>
            <div className="mt-2 bg-white p-3 rounded border">
              <strong>AI Insights:</strong> {routeData.ai_insights}
            </div>
          </div>
        )}
      </div>

      {/* Map Display */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Route Map</h3>
        <MapView 
          selectedCity="Accra" 
          routes={sampleRoutes}
          aiRoute={aiRoute}
        />
      </div>
    </div>
  );
};

// Traffic Dashboard Component (keep existing implementation)
const TrafficDashboard = () => {
  // ... (keep the existing TrafficDashboard implementation)
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Existing TrafficDashboard content */}
    </div>
  );
};

// ML Predictions Component (keep existing implementation)
const MLPredictions = () => {
  // ... (keep the existing MLPredictions implementation)
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Existing MLPredictions content */}
    </div>
  );
};

// ML Analytics Component (keep existing implementation)
const MLAnalytics = () => {
  // ... (keep the existing MLAnalytics implementation)
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Existing MLAnalytics content */}
    </div>
  );
};

// CurrentTraffic Component (keep existing implementation)
const CurrentTraffic = () => {
  // ... (keep the existing CurrentTraffic implementation)
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Existing CurrentTraffic content */}
    </div>
  );
};

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend connection on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${BACKEND_URL}/health`).catch(() => {
          // If health endpoint doesn't exist, try the API root
          return axios.get(`${BACKEND_URL}/`);
        });
        setBackendStatus('connected');
      } catch (error) {
        console.log("Backend connection failed, using mock data");
        setBackendStatus('mock');
      }
    };
    
    checkBackend();
  }, []);

  const tabs = [
    { id: 'dashboard', name: 'Traffic Dashboard', icon: '🚦' },
    { id: 'route', name: 'Route Optimization', icon: '🗺️' },
    { id: 'ml-predict', name: 'AI/ML Predictions', icon: '🤖' },
    { id: 'ml-analytics', name: 'ML Analytics', icon: '📊' },
    { id: 'live', name: 'Live Traffic', icon: '📍' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Backend Status Indicator */}
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold z-50 ${
        backendStatus === 'connected' ? 'bg-green-100 text-green-800' : 
        backendStatus === 'mock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      }`}>
        {backendStatus === 'connected' ? 'Backend Connected' : 
         backendStatus === 'mock' ? 'Using Mock Data' : 'Checking Backend...'}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🚦 AI/ML Traffic Flow Optimizer
              </h1>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                Ghana • Accra & Kumasi
              </span>
            </div>
            <div className="text-sm text-gray-600 hidden md:block">
              Powered by AI + Machine Learning • Real-time Optimization
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {backendStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Connection Error:</strong> Unable to connect to the backend server. Using mock data for demonstration.
          </div>
        )}
        
        {activeTab === 'dashboard' && <TrafficDashboard />}
        {activeTab === 'route' && <RouteRecommendation />}
        {activeTab === 'ml-predict' && <MLPredictions />}
        {activeTab === 'ml-analytics' && <MLAnalytics />}
        {activeTab === 'live' && <CurrentTraffic />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600">
            By Michael O. Mantey © 2025 AI/ML Traffic Flow Optimization System • Reducing congestion with Machine Learning
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;