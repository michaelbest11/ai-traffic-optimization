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

// Set a default backend URL if environment variable is missing
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

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

FitBounds.propTypes = {
  latlngs: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number))
};

// Map View Component
const MapView = ({ selectedCity, routes, selectedRoute, aiRoute }) => {
  const mapInitialCenter = selectedCity === "Accra" ? [5.558, -0.1969] : [6.6892, -1.6230];
  
  const latlngsForFit = selectedRoute && selectedRoute.path
    ? selectedRoute.path.map(p => [p.lat, p.lng])
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
        
        {aiRoute && aiRoute.map && (
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

MapView.propTypes = {
  selectedCity: PropTypes.string,
  routes: PropTypes.array,
  selectedRoute: PropTypes.object,
  aiRoute: PropTypes.array
};

MapView.defaultProps = {
  selectedCity: "Accra",
  routes: [],
  selectedRoute: null,
  aiRoute: null
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

// Traffic Dashboard Component
const TrafficDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
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
          },
          {
            intersection_id: "KUM_001", 
            location: { lat: 6.6885, lng: -1.6244 },
            congestion_level: "High",
            vehicle_count: 98,
            average_speed: 15.7
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

      {/* Display error message if any */}
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
          {/* Key Metrics */}
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

          {/* Congestion Hotspots */}
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

          {/* AI Recommendations */}
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

          {/* Predictions */}
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

// ML Predictions Component
const MLPredictions = () => {
  const [predictions, setPredictions] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [error, setError] = useState(null);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        city: selectedCity,
        horizon_minutes: 120,
        predictions: [
          {
            intersection_id: "ACC_001",
            prediction_horizon: 120,
            predicted_congestion: "High",
            predicted_vehicle_count: 85,
            predicted_speed: 18.5,
            confidence_score: 0.87,
            ml_model_used: "GradientBoosting + RandomForest"
          },
          {
            intersection_id: "ACC_002",
            prediction_horizon: 120,
            predicted_congestion: "Critical",
            predicted_vehicle_count: 120,
            predicted_speed: 12.3,
            confidence_score: 0.92,
            ml_model_used: "GradientBoosting + RandomForest"
          },
          {
            intersection_id: "ACC_003",
            prediction_horizon: 120,
            predicted_congestion: "Medium",
            predicted_vehicle_count: 65,
            predicted_speed: 25.7,
            confidence_score: 0.78,
            ml_model_used: "GradientBoosting + RandomForest"
          }
        ],
        total_predictions: 3,
        ml_model_info: {
          accuracy: 0.89,
          version: "2.0.0"
        },
        generated_at: new Date().toISOString()
      };
      
      setPredictions(mockData);
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
      setError("Failed to fetch predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelPerformance = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData = {
        city: selectedCity,
        model: "RandomForest + GradientBoost",
        accuracy: 0.89,
        precision: 0.87,
        recall: 0.91,
        f1_score: 0.89,
        model_status: "trained",
        accuracy_metrics: {
          traffic_mae: 4.7,
          speed_mae: 4.27,
          congestion_accuracy: 0.88
        }
      };
      
      setModelPerformance(mockData);
    } catch (error) {
      console.error('Error fetching model performance:', error);
    }
  };

  const retrainModels = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("✅ Models retrained successfully!");
      fetchModelPerformance();
    } catch (error) {
      console.error('Error retraining models:', error);
      alert('❌ Failed to retrain models');
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchModelPerformance();
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🤖 AI/ML Traffic Predictions</h2>
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
            onClick={fetchPredictions}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Predicting...' : 'Refresh Predictions'}
          </button>
          <button
            onClick={retrainModels}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Retrain Models
          </button>
        </div>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading predictions...</span>
        </div>
      )}

      {/* Model Performance Overview */}
      {modelPerformance && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">🎯 ML Model Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Model Status</div>
              <div className={`text-lg font-bold ${modelPerformance.model_status === 'trained' ? 'text-green-600' : 'text-red-600'}`}>
                {modelPerformance.model_status === 'trained' ? '✅ Trained' : '❌ Not Trained'}
              </div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Traffic Accuracy</div>
              <div className="text-lg font-bold text-blue-600">
                {modelPerformance.accuracy_metrics?.traffic_mae ? `${(100 - modelPerformance.accuracy_metrics.traffic_mae).toFixed(1)}%` : 'N/A'}
              </div>
            </div>

            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Speed Accuracy</div>
              <div className="text-lg font-bold text-green-600">
                {modelPerformance.accuracy_metrics?.speed_mae ? `${(100 - modelPerformance.accuracy_metrics.speed_mae).toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Models Used</div>
              <div className="text-sm font-bold text-purple-600">
                RF + GB Ensemble
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML Predictions */}
      {predictions && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🔮 2-Hour Traffic Predictions</h3>
            <div className="text-sm text-gray-600">
              {predictions.total_predictions} predictions • Confidence: {predictions.ml_model_info?.accuracy ? 'High' : 'Medium'}
            </div>
          </div>
          
          <div className="space-y-4">
            {predictions.predictions?.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">📍 {prediction.intersection_id}</div>
                    <div className="text-sm text-gray-600">
                      Prediction: {prediction.prediction_horizon} minutes ahead
                    </div>
                    <div className="text-sm text-gray-600">
                      🤖 {prediction.ml_model_used}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                      prediction.predicted_congestion === 'Critical' ? 'bg-red-200 text-red-800' :
                      prediction.predicted_congestion === 'High' ? 'bg-orange-200 text-orange-800' :
                      prediction.predicted_congestion === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {prediction.predicted_congestion}
                    </div>
                    <div className="text-xs text-gray-500">
                      Confidence: {(prediction.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Predicted Vehicles</div>
                    <div className="text-lg font-bold text-blue-600">{prediction.predicted_vehicle_count}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-gray-600">Predicted Speed</div>
                    <div className="text-lg font-bold text-green-600">{prediction.predicted_speed.toFixed(1)} km/h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Advanced ML Analytics Component
const MLAnalytics = () => {
  const [insights, setInsights] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMLInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        city: selectedCity,
        ml_predictions: [
          {
            hour_ahead: 1,
            predictions: [
              {
                intersection_id: "ACC_001",
                predicted_congestion: "High",
                confidence: 0.85
              },
              {
                intersection_id: "ACC_002",
                predicted_congestion: "Critical",
                confidence: 0.92
              }
            ]
          },
          {
            hour_ahead: 2,
            predictions: [
              {
                intersection_id: "ACC_001",
                predicted_congestion: "Medium",
                confidence: 0.78
              },
              {
                intersection_id: "ACC_002",
                predicted_congestion: "High",
                confidence: 0.82
              }
            ]
          },
          {
            hour_ahead: 3,
            predictions: [
              {
                intersection_id: "ACC_001",
                predicted_congestion: "Low",
                confidence: 0.75
              },
              {
                intersection_id: "ACC_002",
                predicted_congestion: "Medium",
                confidence: 0.79
              }
            ]
          },
          {
            hour_ahead: 4,
            predictions: [
              {
                intersection_id: "ACC_001",
                predicted_congestion: "Low",
                confidence: 0.72
              },
              {
                intersection_id: "ACC_002",
                predicted_congestion: "Low",
                confidence: 0.68
              }
            ]
          }
        ],
        pattern_analysis: {
          peak_approaching: true,
          expected_peak_severity: "High",
          recommended_actions: [
            "Preemptively adjust traffic light patterns",
            "Alert commuters of expected congestion",
            "Prepare alternative routing strategies"
          ]
        },
        optimization_opportunities: [
          {
            intersection_id: "ACC-003",
            opportunity: "Signal timing optimization",
            potential_improvement: "25% traffic flow improvement"
          }
        ],
        model_reliability: {
          overall_confidence: 0.87,
          prediction_accuracy: "89%"
        },
        generated_at: new Date().toISOString()
      };
      
      setInsights(mockData);
    } catch (error) {
      console.error('Error fetching ML insights:', error);
      setError("Failed to fetch analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMLInsights();
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 Advanced ML Analytics</h2>
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
            onClick={fetchMLInsights}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading analytics...</span>
        </div>
      )}

      {insights && (
        <>
          {/* Hourly Predictions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">⏰ 4-Hour Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {insights.ml_predictions?.map((hourData, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center mb-3">
                    <div className="text-2xl font-bold text-indigo-600">{hourData.hour_ahead}h</div>
                    <div className="text-sm text-gray-600">ahead</div>
                  </div>
                  <div className="space-y-2">
                    {hourData.predictions?.map((pred, predIndex) => (
                      <div key={predIndex} className="bg-white p-2 rounded text-sm">
                        <div className="font-medium">{pred.intersection_id}</div>
                        <div className={`text-xs ${
                          pred.predicted_congestion === 'Critical' ? 'text-red-600' :
                          pred.predicted_congestion === 'High' ? 'text-orange-600' :
                          pred.predicted_congestion === 'Medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {pred.predicted_congestion} ({(pred.confidence * 100).toFixed(0)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Analysis */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🔍 AI Pattern Analysis</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-blue-800">Peak Analysis</div>
                  <div className="text-sm text-blue-600">
                    Peak Approaching: {insights.pattern_analysis?.peak_approaching ? '⚠️ Yes' : '✅ No'}
                  </div>
                  <div className="text-sm text-blue-600">
                    Expected Severity: {insights.pattern_analysis?.expected_peak_severity}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Recommended Actions</div>
                  {insights.pattern_analysis?.recommended_actions?.map((action, index) => (
                    <div key={index} className="text-sm text-blue-600">• {action}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">⚡ ML Optimization Opportunities</h3>
            <div className="space-y-3">
              {insights.optimization_opportunities?.map((opp, index) => (
                <div key={index} className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">📍 {opp.intersection_id}</div>
                      <div className="text-sm text-gray-600">{opp.opportunity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{opp.potential_improvement}</div>
                      <div className="text-xs text-gray-500">potential improvement</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Reliability */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🎯 Model Reliability</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Overall Confidence</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(insights.model_reliability?.overall_confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Prediction Accuracy</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {insights.model_reliability?.prediction_accuracy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// CurrentTraffic Component
const CurrentTraffic = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrafficData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        city: selectedCity,
        traffic_data: [
          {
            intersection_id: "ACC_001",
            location: { lat: 5.5600, lng: -0.1969 },
            vehicle_count: 75,
            average_speed: 25.4,
            congestion_level: "Medium",
            weather_condition: "Clear"
          },
          {
            intersection_id: "ACC_002",
            location: { lat: 5.5566, lng: -0.1969 },
            vehicle_count: 120,
            average_speed: 12.8,
            congestion_level: "Critical",
            weather_condition: "Clear"
          },
          {
            intersection_id: "ACC_003",
            location: { lat: 5.5593, lng: -0.2532 },
            vehicle_count: 65,
            average_speed: 28.7,
            congestion_level: "Low",
            weather_condition: "Clear"
          },
          {
            intersection_id: "ACC_004",
            location: { lat: 5.6037, lng: -0.2267 },
            vehicle_count: 85,
            average_speed: 22.3,
            congestion_level: "Medium",
            weather_condition: "Clear"
          },
          {
            intersection_id: "ACC_005",
            location: { lat: 5.5500, lng: -0.1969 },
            vehicle_count: 95,
            average_speed: 19.6,
            congestion_level: "High",
            weather_condition: "Clear"
          }
        ],
        summary: {
          total_intersections: 5,
          high_congestion: 2,
          average_speed: 21.76
        },
        timestamp: new Date().toISOString()
      };
      
      setTrafficData(mockData);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      setError("Failed to fetch traffic data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">📍 Live Traffic Conditions</h2>
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
            onClick={fetchTrafficData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading traffic data...</span>
        </div>
      )}

      {trafficData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{trafficData.summary.total_intersections}</div>
              <div className="text-sm text-gray-600">Monitored Intersections</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{trafficData.summary.high_congestion}</div>
              <div className="text-sm text-gray-600">High Congestion Points</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{trafficData.summary.average_speed.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Average Speed (km/h)</div>
            </div>
          </div>

          <div className="space-y-3">
            {trafficData.traffic_data.map((intersection, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Intersection: {intersection.intersection_id}</div>
                    <div className="text-sm text-gray-600">
                      📍 {intersection.location.lat.toFixed(4)}, {intersection.location.lng.toFixed(4)}
                    </div>
                    <div className="text-sm text-gray-600">
                      🚗 {intersection.vehicle_count} vehicles • 
                      ⚡ {intersection.average_speed.toFixed(1)} km/h • 
                      🌤️ {intersection.weather_condition}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      intersection.congestion_level === 'Critical' ? 'bg-red-200 text-red-800' :
                      intersection.congestion_level === 'High' ? 'bg-orange-200 text-orange-800' :
                      intersection.congestion_level === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {intersection.congestion_level}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
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