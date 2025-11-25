import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PropTypes from 'prop-types';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Import datasets
import { accraIntersections } from './dataset/accraIntersections';
import { kumasiIntersections } from './dataset/kumasiIntersections';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

// =============================================
// Utility Functions
// =============================================

// Route smoothing algorithm
const smoothRoute = (points, smoothing = 0.3) => {
  if (!points || points.length < 3) return points;
  
  const smoothed = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    
    // Calculate smoothed point
    const smoothedPoint = {
      lat: (prev.lat + current.lat * 2 + next.lat) / 4,
      lng: (prev.lng + current.lng * 2 + next.lng) / 4
    };
    
    smoothed.push(smoothedPoint);
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

// Find nearby cameras to route
const findNearbyCameras = (route, cameras, maxDistance = 0.01) => {
  if (!route || !cameras) return [];
  
  return cameras.filter(camera => {
    return route.some(point => {
      const latDiff = Math.abs(point.lat - camera.lat);
      const lngDiff = Math.abs(point.lng - camera.lng);
      return latDiff < maxDistance && lngDiff < maxDistance;
    });
  });
};

// =============================================
// Map Components
// =============================================

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

FitBounds.propTypes = {
  latlngs: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
};

const MapView = ({ selectedCity, routes, selectedRoute, aiRoute, nearbyCameras, onCameraSelect }) => {
  const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];
  const mapInitialZoom = 13;
  
  const latlngsForFit = selectedRoute && selectedRoute.path
    ? selectedRoute.path.map(p => [p.lat, p.lng])
    : aiRoute
    ? aiRoute.map(p => [p.lat, p.lng])
    : routes.flatMap(r => (r.path || []).map(p => [p.lat, p.lng]));

  return (
    <div className="w-full h-[500px] rounded-lg border-2 border-gray-300 shadow-lg relative">
      <MapContainer 
        center={mapInitialCenter} 
        zoom={mapInitialZoom} 
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg"
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        easeLinearity={0.35}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          minZoom={10}
        />
        
        {latlngsForFit && latlngsForFit.length > 0 && <FitBounds latlngs={latlngsForFit} />}
        
        {/* Selected Route */}
        {selectedRoute && selectedRoute.path && (
          <Polyline 
            positions={selectedRoute.path.map(p => [p.lat, p.lng])} 
            color="#ef4444" 
            weight={6}
            opacity={0.8}
            smoothFactor={1}
          />
        )}
        
        {/* AI Optimized Route */}
        {aiRoute && aiRoute.map && (
          <Polyline 
            positions={aiRoute.map(p => [p.lat, p.lng])} 
            color="#3b82f6" 
            weight={6}
            opacity={0.8}
            dashArray="10, 10"
            smoothFactor={1}
          />
        )}
        
        {/* Start and End Markers */}
        {aiRoute && aiRoute.length > 0 && (
          <>
            <Marker position={[aiRoute[0].lat, aiRoute[0].lng]}>
              <Popup>
                <div className="text-center">
                  <strong>🚦 Start Point</strong>
                  <br />
                  <span className="text-sm">
                    {aiRoute[0].lat.toFixed(4)}, {aiRoute[0].lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
            <Marker position={[aiRoute[aiRoute.length - 1].lat, aiRoute[aiRoute.length - 1].lng]}>
              <Popup>
                <div className="text-center">
                  <strong>🏁 End Point</strong>
                  <br />
                  <span className="text-sm">
                    {aiRoute[aiRoute.length - 1].lat.toFixed(4)}, {aiRoute[aiRoute.length - 1].lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {/* Camera markers */}
        {nearbyCameras && nearbyCameras.map((camera) => (
          <Marker 
            key={camera.id} 
            position={[camera.lat, camera.lng]}
            icon={L.divIcon({
              className: 'camera-marker',
              html: `<div class="camera-marker-inner">📸</div>`,
              iconSize: [30, 30],
            })}
          >
            <Popup>
              <div className="text-center min-w-[200px]">
                <strong className="text-lg">{camera.name}</strong>
                <br />
                <span className="text-sm text-gray-600">Traffic Camera</span>
                <br />
                <div className="mt-2 text-xs text-gray-500">
                  Lat: {camera.lat.toFixed(4)}<br />
                  Lng: {camera.lng.toFixed(4)}
                </div>
                <button 
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  onClick={() => onCameraSelect && onCameraSelect(camera)}
                >
                  View Live Feed
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route waypoints */}
        {routes.map((route, routeIndex) =>
          (route.path || []).map((point, pointIndex) => (
            <Marker 
              key={`${routeIndex}-${pointIndex}`} 
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                className: 'waypoint-marker',
                html: `<div class="waypoint-marker-inner">${pointIndex + 1}</div>`,
                iconSize: [25, 25],
              })}
            >
              <Popup>
                <div className="text-center">
                  <strong>{route.name || `Route ${routeIndex + 1}`}</strong>
                  <br />
                  <span className="text-sm">Point {pointIndex + 1}</span>
                  <br />
                  <span className="text-xs text-gray-600">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
      
      {/* Map Controls Legend */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-3 text-sm">
        <div className="font-semibold mb-2">Map Legend</div>
        <div className="space-y-1">
          <div className="flex items-center">
            <div className="w-4 h-2 bg-blue-500 mr-2"></div>
            <span>AI Optimized Route</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-2 bg-red-500 mr-2"></div>
            <span>Selected Route</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 flex items-center justify-center mr-2">
              <div className="camera-marker-inner-small">📸</div>
            </div>
            <span>Traffic Camera</span>
          </div>
        </div>
      </div>
    </div>
  );
};

MapView.propTypes = {
  selectedCity: PropTypes.string,
  routes: PropTypes.array,
  selectedRoute: PropTypes.object,
  aiRoute: PropTypes.array,
  nearbyCameras: PropTypes.array,
  onCameraSelect: PropTypes.func
};

MapView.defaultProps = {
  selectedCity: "Accra",
  routes: [],
  selectedRoute: null,
  aiRoute: null,
  nearbyCameras: []
};

// =============================================
// Camera Feed Component
// =============================================

const CameraFeed = ({ camera, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (camera) {
      setLoading(true);
      setError(null);
      // Simulate loading
      const timer = setTimeout(() => {
        setLoading(false);
        // Simulate occasional error
        if (Math.random() > 0.8) {
          setError("Camera feed temporarily unavailable");
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [camera]);

  if (!camera) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Live Camera: {camera.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="loader-spinner mb-4"></div>
              <p>Loading camera feed...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-600">
              <div className="text-4xl mb-4">❌</div>
              <p>{error}</p>
            </div>
          ) : (
            <div className="relative">
              <img 
                src={`https://picsum.photos/800/450?random=${camera.id}`}
                alt={`Live feed from ${camera.name}`}
                className="w-full h-auto rounded"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/800x450/374151/FFFFFF?text=Live+Feed+${camera.name}`;
                }}
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                🔴 LIVE
              </div>
            </div>
          )}
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <strong>Location:</strong> {camera.name}
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Coordinates:</strong> {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CameraFeed.propTypes = {
  camera: PropTypes.object,
  onClose: PropTypes.func
};

// =============================================
// Enhanced Route Recommendation Component
// =============================================

const RouteRecommendation = () => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiRoute, setAiRoute] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [nearbyCameras, setNearbyCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [smoothRouting, setSmoothRouting] = useState(true);

  const [formData, setFormData] = useState({
    startLat: "5.6051",
    startLng: "-0.1660",
    endLat: "5.5560", 
    endLng: "-0.1969",
  });

  const cities = {
    'Accra': accraIntersections,
    'Kumasi': kumasiIntersections
  };

  const handleOptimize = () => {
    setLoading(true);
    setRouteData(null);
    setNearbyCameras([]);

    // Generate base route points
    const baseRoute = [
      { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
      {
        lat: (parseFloat(formData.startLat) + parseFloat(formData.endLat)) / 2 + (Math.random() - 0.5) * 0.002,
        lng: (parseFloat(formData.startLng) + parseFloat(formData.endLng)) / 2 + (Math.random() - 0.5) * 0.002,
      },
      { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
    ];

    // Apply smoothing if enabled
    const finalRoute = smoothRouting ? smoothRoute(baseRoute) : baseRoute;

    const mockData = {
      optimized_route: finalRoute,
      distance_km: (4 + Math.random() * 10).toFixed(1),
      estimated_time_minutes: Math.floor(12 + Math.random() * 20),
      ai_insights: "AI-optimized route considering real-time traffic patterns, road conditions, and historical data.",
      traffic_conditions: ["Low congestion on major roads", "Moderate traffic expected at Circle", "Clear path to destination"],
      alternative_routes: [
        { name: "Fastest", time: "15 mins", distance: "8.2 km" },
        { name: "Eco-Friendly", time: "18 mins", distance: "7.8 km" },
        { name: "Scenic", time: "22 mins", distance: "9.1 km" }
      ]
    };

    // Find nearby cameras
    const cameras = findNearbyCameras(finalRoute, cities[selectedCity]);
    setNearbyCameras(cameras);

    setTimeout(() => {
      setRouteData(mockData);
      setAiRoute(finalRoute);
      setLoading(false);
    }, 2000);
  };

  const quickRoutes = [
    { name: "Airport → Circle", start: [5.6051, -0.1660], end: [5.5560, -0.1969] },
    { name: "Osu → East Legon", start: [5.5566, -0.1740], end: [5.6149, -0.1600] },
    { name: "Spintex → Airport", start: [5.5976, -0.1346], end: [5.6051, -0.1660] }
  ];

  const sampleRoutes = [
    {
      id: 1,
      name: "Airport to Circle Express",
      path: [
        { lat: 5.6051, lng: -0.1660 },
        { lat: 5.5900, lng: -0.1800 },
        { lat: 5.5750, lng: -0.1900 },
        { lat: 5.5560, lng: -0.1969 }
      ]
    }
  ];

  const handleQuickRoute = (route) => {
    setFormData({
      startLat: route.start[0].toString(),
      startLng: route.start[1].toString(),
      endLat: route.end[0].toString(),
      endLng: route.end[1].toString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Routes Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🚀 Quick Routes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickRoutes.map((route, index) => (
            <button
              key={index}
              onClick={() => handleQuickRoute(route)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-4 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="font-semibold">{route.name}</div>
              <div className="text-sm opacity-80">Tap to set route</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">🗺️ Route Planner</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Accra">Accra</option>
                  <option value="Kumasi">Kumasi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.startLat}
                    onChange={(e) => setFormData({ ...formData, startLat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.startLng}
                    onChange={(e) => setFormData({ ...formData, startLng: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endLat}
                    onChange={(e) => setFormData({ ...formData, endLat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endLng}
                    onChange={(e) => setFormData({ ...formData, endLng: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="smoothRouting"
                  checked={smoothRouting}
                  onChange={(e) => setSmoothRouting(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="smoothRouting" className="text-sm font-medium text-gray-700">
                  Enable Route Smoothing
                </label>
              </div>

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="loader-spinner-small mr-2"></div>
                    Optimizing Route...
                  </div>
                ) : (
                  "🚀 Generate Optimized Route"
                )}
              </button>
            </div>
          </div>

          {/* Nearby Cameras Panel */}
          {nearbyCameras.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📸 Nearby Traffic Cameras</h3>
              <div className="space-y-3">
                {nearbyCameras.map((camera) => (
                  <div 
                    key={camera.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCamera(camera)}
                  >
                    <div>
                      <div className="font-medium">{camera.name}</div>
                      <div className="text-sm text-gray-600">
                        {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      View Feed →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📍 Route Map</h3>
            <MapView 
              selectedCity={selectedCity} 
              routes={sampleRoutes}
              aiRoute={aiRoute}
              nearbyCameras={nearbyCameras}
              onCameraSelect={setSelectedCamera}
            />
          </div>

          {/* Route Details */}
          {routeData && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">📊 Route Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{routeData.distance_km} km</div>
                  <div className="text-sm text-gray-600">Distance</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{routeData.estimated_time_minutes} mins</div>
                  <div className="text-sm text-gray-600">Estimated Time</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{nearbyCameras.length}</div>
                  <div className="text-sm text-gray-600">Cameras on Route</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">🚦 Traffic Conditions</h4>
                  <ul className="space-y-2">
                    {routeData.traffic_conditions.map((condition, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">🔄 Alternative Routes</h4>
                  <div className="space-y-2">
                    {routeData.alternative_routes.map((route, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{route.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{route.time}</div>
                          <div className="text-xs text-gray-600">{route.distance}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold mb-2">🤖 AI Insights</h4>
                <p className="text-gray-700">{routeData.ai_insights}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Feed Modal */}
      {selectedCamera && (
        <CameraFeed 
          camera={selectedCamera} 
          onClose={() => setSelectedCamera(null)} 
        />
      )}
    </div>
  );
};

// =============================================
// Other Components (Placeholders - Keep your existing implementations)
// =============================================

const TrafficDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        city: selectedCity,
        metrics: {
          total_vehicles: 1245,
          average_speed: 28.4,
          total_intersections: 152,
          congested: 38,
          smooth: 90,
          moderate: 24,
          critical_intersections: 5,
          congestion_level: "Moderate"
        },
        hotspots: [
          {
            intersection_id: "ACC_002",
            location: { lat: 5.5566, lng: -0.1969 },
            congestion_level: "Critical",
            vehicle_count: 125,
            average_speed: 12.3
          }
        ],
        ai_recommendations: [
          "🚨 Deploy traffic controllers to Kwame Nkrumah Circle immediately",
          "📢 Issue traffic alerts via radio and mobile apps",
          "🚦 Implement dynamic signal timing optimization"
        ],
        predictions: {
          next_hour: "Traffic expected to increase by 15% during evening rush",
          rush_hour_impact: "High impact expected during 17:00-19:00", 
          weather_impact: "No significant weather-related delays expected"
        },
        updated_at: new Date().toISOString()
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError("Failed to fetch dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🚦 Traffic Authorities Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      )}

      {dashboardData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{dashboardData.metrics.total_vehicles}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{dashboardData.metrics.average_speed}</div>
              <div className="text-sm text-gray-600">Avg Speed (km/h)</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.total_intersections}</div>
              <div className="text-sm text-gray-600">Active Intersections</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{dashboardData.metrics.critical_intersections}</div>
              <div className="text-sm text-gray-600">Critical Points</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{dashboardData.metrics.congestion_level}</div>
              <div className="text-sm text-gray-600">Overall Status</div>
            </div>
          </div>

          {dashboardData.hotspots && dashboardData.hotspots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">🔥 Congestion Hotspots</h3>
              <div className="space-y-2">
                {dashboardData.hotspots.map((hotspot, index) => (
                  <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Intersection: {hotspot.intersection_id}</div>
                        <div className="text-sm text-gray-600">
                          Vehicles: {hotspot.vehicle_count} • Speed: {hotspot.average_speed.toFixed(1)} km/h
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-sm font-medium ${
                          hotspot.congestion_level === 'Critical' ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'
                        }`}>
                          {hotspot.congestion_level}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🤖 AI Traffic Recommendations</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="space-y-2">
                {dashboardData.ai_recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">📊 AI Traffic Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Next Hour</div>
                <div className="text-sm text-gray-600">{dashboardData.predictions.next_hour}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Rush Hour Impact</div>
                <div className="text-sm text-gray-600">{dashboardData.predictions.rush_hour_impact}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-medium text-gray-700">Weather Impact</div>
                <div className="text-sm text-gray-600">{dashboardData.predictions.weather_impact}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MLPredictions = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI/ML Traffic Predictions</h2>
      <p className="text-gray-600">Machine learning predictions component - use your existing implementation here.</p>
    </div>
  );
};

const MLAnalytics = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Advanced ML Analytics</h2>
      <p className="text-gray-600">ML analytics component - use your existing implementation here.</p>
    </div>
  );
};

const CurrentTraffic = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Live Traffic Conditions</h2>
      <p className="text-gray-600">Current traffic component - use your existing implementation here.</p>
    </div>
  );
};

// =============================================
// Main App Component
// =============================================

function App() {
  const [activeTab, setActiveTab] = useState('route'); // Default to route tab
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${BACKEND_URL}/health`).catch(() => {
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
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold z-50 ${
        backendStatus === 'connected' ? 'bg-green-100 text-green-800' : 
        backendStatus === 'mock' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      }`}>
        {backendStatus === 'connected' ? 'Backend Connected' : 
         backendStatus === 'mock' ? 'Using Mock Data' : 'Checking Backend...'}
      </div>

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                🚦 AI Traffic Flow Optimizer
              </h1>
              <span className="ml-3 px-2 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 text-sm font-medium rounded">
                Ghana • Real-time Optimization
              </span>
            </div>
            <div className="text-sm text-gray-600 hidden md:block">
              Powered by AI + Machine Learning
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {backendStatus === 'error' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Connection Error:</strong> Unable to connect to backend server. Using mock data for demonstration.
          </div>
        )}
        
        {activeTab === 'dashboard' && <TrafficDashboard />}
        {activeTab === 'route' && <RouteRecommendation />}
        {activeTab === 'ml-predict' && <MLPredictions />}
        {activeTab === 'ml-analytics' && <MLAnalytics />}
        {activeTab === 'live' && <CurrentTraffic />}
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600">
            By Michael O. Mantey © 2025 AI/ML Traffic Flow Optimization System
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;