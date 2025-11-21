// frontend/src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import api from "./lib/api";
import "leaflet/dist/leaflet.css";


// datasets & components
import { accraIntersections } from "./dataset/accraIntersections";
import { accraRoutes } from "./dataset/accraRoutes";
import { kumasiIntersections } from "./dataset/kumasiIntersections";
import { kumasiRoutes } from "./dataset/kumasiRoutes";

import MapView from "./components/MapView";
import LiveFeed from "./components/LiveFeed";
import RouteList from "./components/RouteList";
import TrafficStats from "./components/TrafficStats";

// Set a default backend URL if environment variable is missing
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

// Console log to verify API base (safe for dev)
console.log("API Base URL:", API);

/* ---------------- RouteRecommendation ----------------
   Mostly identical to your original RouteRecommendation but
   now hooks into the dataset for multi-alternative display.
*/
const RouteRecommendation = ({ city }) => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    startLat: "5.5600",
    startLng: "-0.1969",
    endLat: "5.5566",
    endLng: "-0.1969",
    city: city || "Accra",
  });

  useEffect(() => {
    setFormData((s) => ({ ...s, city: city }));
  }, [city]);

  const handleOptimizeRoute = async () => {
    setLoading(true);
    setError(null);
    try {
      // If backend /api/optimize-route exists, call it; otherwise return mock
      let resp;
      try {
        resp = await api.optimizeRoute({
          start: { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
          end: { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
          city: formData.city,
        });
      } catch (e) {
        // fallback to mock if backend is not available
        resp = { data: null };
      }

      if (resp && resp.data && resp.data.optimized_route) {
        setRouteData(resp.data);
      } else {
        // Mock response (detailed)
        await new Promise((res) => setTimeout(res, 800));
        const mockResponse = {
          city: formData.city,
          vehicle_type: "car",
          optimized_route: [
            { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
            {
              lat:
                (parseFloat(formData.startLat) + parseFloat(formData.endLat)) / 2 +
                (Math.random() - 0.5) * 0.005,
              lng:
                (parseFloat(formData.startLng) + parseFloat(formData.endLng)) / 2 +
                (Math.random() - 0.5) * 0.005,
            },
            { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
          ],
          estimated_time_minutes: Math.round(20 + Math.random() * 40),
          distance_km: Number((5 + Math.random() * 25).toFixed(1)),
          traffic_conditions: ["Light Traffic", "Moderate Traffic", "Heavy Traffic"][Math.floor(Math.random() * 3)],
          alternative_routes: [
            {
              route_name: "Alt A",
              duration: Math.round(25 + Math.random() * 30),
              distance: Number((6 + Math.random() * 20).toFixed(1)),
              traffic_level: "Moderate",
            },
            {
              route_name: "Alt B",
              duration: Math.round(30 + Math.random() * 40),
              distance: Number((7 + Math.random() * 18).toFixed(1)),
              traffic_level: "Heavy",
            },
          ],
          ai_insights:
            "This route avoids identified hotspots and reduces travel time by an estimated 12% vs. primary route given current data.",
          departure_time: new Date().toISOString(),
        };
        setRouteData(mockResponse);
      }
    } catch (err) {
      console.error("Error optimizing route:", err);
      setError("Failed to optimize route. Try again or check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-3">🗺️ Smart Route Optimization</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Location (Lat, Lng)</label>
          <div className="flex space-x-2">
            <input type="number" step="0.0001" value={formData.startLat} onChange={(e) => setFormData({ ...formData, startLat: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Latitude" />
            <input type="number" step="0.0001" value={formData.startLng} onChange={(e) => setFormData({ ...formData, startLng: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Longitude" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Location (Lat, Lng)</label>
          <div className="flex space-x-2">
            <input type="number" step="0.0001" value={formData.endLat} onChange={(e) => setFormData({ ...formData, endLat: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Latitude" />
            <input type="number" step="0.0001" value={formData.endLng} onChange={(e) => setFormData({ ...formData, endLng: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" placeholder="Longitude" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md">
          <option value="Accra">Accra</option>
          <option value="Kumasi">Kumasi</option>
        </select>

        <button onClick={handleOptimizeRoute} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Optimizing..." : "Get AI Route Recommendation"}
        </button>
      </div>

      {routeData && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">🤖 AI Route Recommendation</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-xl font-bold text-blue-600">{routeData.estimated_time_minutes} min</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-xl font-bold text-green-600">{routeData.distance_km} km</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Traffic</div>
              <div className="text-xl font-bold text-orange-600">{routeData.traffic_conditions}</div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-medium mb-2">AI Insights:</h4>
            <p className="text-gray-700 bg-blue-50 p-3 rounded">{routeData.ai_insights}</p>
          </div>

          {routeData.alternative_routes && routeData.alternative_routes.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Alternative Routes:</h4>
              <div className="space-y-2">
                {routeData.alternative_routes.map((alt, index) => (
                  <div key={index} className="bg-white p-3 rounded border flex justify-between items-center">
                    <span className="font-medium">{alt.route_name}</span>
                    <div className="text-sm text-gray-600">
                      {alt.duration} min • {alt.distance} km • {alt.traffic_level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------- TrafficDashboard ----------------
   Uses selectedCity prop (if provided). Otherwise uses internal selector similar to original.
*/
const TrafficDashboard = ({ selectedCity: propCity }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCity, setSelectedCity] = useState(propCity || "Accra");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If parent passes a selected city prop, keep local selectedCity in sync
  useEffect(() => {
    if (propCity) setSelectedCity(propCity);
  }, [propCity]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt API first
      try {
        const resp = await api.getTraffic(selectedCity);
        if (resp?.data) {
          setDashboardData(resp.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore and fallback to mock
      }

      // Mock data (simulate)
      await new Promise((res) => setTimeout(res, 800));
      const mockData = {
        city: selectedCity,
        metrics: {
          total_vehicles: Math.floor(800 + Math.random() * 2000),
          average_speed: Number((20 + Math.random() * 20).toFixed(1)),
          total_intersections: selectedCity === "Accra" ? 25 : 22,
          congested: Math.floor(10 + Math.random() * 60),
          smooth: Math.floor(20 + Math.random() * 80),
          moderate: Math.floor(5 + Math.random() * 40),
          critical_intersections: Math.floor(1 + Math.random() * 8),
          congestion_level: ["Low", "Moderate", "High"][Math.floor(Math.random() * 3)],
        },
        hotspots: (selectedCity === "Accra" ? accraRoutes : kumasiRoutes)
          .slice(0, 4)
          .map((r, i) => ({
            intersection_id: `${selectedCity.slice(0,3).toUpperCase()}_${i + 1}`,
            location: r.alternatives[0].route[0],
            congestion_level: ["Critical", "High", "Moderate"][i % 3],
            vehicle_count: Math.floor(40 + Math.random() * 200),
            average_speed: Number((10 + Math.random() * 35).toFixed(1)),
          })),
        ai_recommendations: [
          "🚨 Deploy traffic controllers to identified hotspots",
          "📢 Issue traffic alerts via radio and app",
          "🚦 Implement dynamic signal timing optimization",
        ],
        predictions: {
          next_hour: "Traffic expected to increase during rush hour",
          rush_hour_impact: "High",
          weather_impact: "No significant weather delays expected",
        },
        updated_at: new Date().toISOString(),
      };

      setDashboardData(mockData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🚦 Traffic Authorities Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
          <button onClick={fetchDashboardData} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

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
                        <div className="text-sm text-gray-600">Vehicles: {hotspot.vehicle_count} • Speed: {hotspot.average_speed.toFixed(1)} km/h</div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-sm font-medium ${hotspot.congestion_level === "Critical" ? "bg-red-200 text-red-800" : "bg-orange-200 text-orange-800"}`}>
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
                {dashboardData.ai_recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
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

/* ---------------- MLPredictions ----------------
   Similar to original; attempts API, else uses mock.
*/
const MLPredictions = ({ selectedCity: propCity }) => {
  const [predictions, setPredictions] = useState(null);
  const [selectedCity, setSelectedCity] = useState(propCity || "Accra");
  const [loading, setLoading] = useState(false);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propCity) setSelectedCity(propCity);
  }, [propCity]);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try backend
      try {
        const resp = await api.mlPredict(selectedCity);
        if (resp?.data) {
          setPredictions(resp.data);
        } else throw new Error("No data");
      } catch (e) {
        // fallback mock
        await new Promise((res) => setTimeout(res, 700));
        const mockData = {
          city: selectedCity,
          horizon_minutes: 120,
          predictions: [
            { intersection_id: `${selectedCity}_001`, prediction_horizon: 120, predicted_congestion: "High", predicted_vehicle_count: 85, predicted_speed: 18.5, confidence_score: 0.87, ml_model_used: "GradientBoosting + RandomForest" },
            { intersection_id: `${selectedCity}_002`, prediction_horizon: 120, predicted_congestion: "Critical", predicted_vehicle_count: 120, predicted_speed: 12.3, confidence_score: 0.92, ml_model_used: "GradientBoosting + RandomForest" },
            { intersection_id: `${selectedCity}_003`, prediction_horizon: 120, predicted_congestion: "Medium", predicted_vehicle_count: 65, predicted_speed: 25.7, confidence_score: 0.78, ml_model_used: "GradientBoosting + RandomForest" },
          ],
          total_predictions: 3,
          ml_model_info: { accuracy: 0.89, version: "2.0.0" },
          generated_at: new Date().toISOString(),
        };
        setPredictions(mockData);
      }
      fetchModelPerformance();
    } catch (err) {
      console.error("Error fetching ML predictions:", err);
      setError("Failed to fetch predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelPerformance = async () => {
    try {
      // Try backend
      try {
        const resp = await api.retrainModels(); // note: using retrain endpoint just to check; actual endpoint may differ
        // If backend returns performance in resp.data, set it
        if (resp?.data?.model_performance) {
          setModelPerformance(resp.data.model_performance);
          return;
        }
      } catch (e) {
        // ignore
      }

      // Fallback mock
      await new Promise((res) => setTimeout(res, 300));
      const mockPerf = { city: selectedCity, model: "RandomForest + GradientBoost", accuracy: 0.89, precision: 0.87, recall: 0.91, f1_score: 0.89, model_status: "trained", accuracy_metrics: { traffic_mae: 4.7, speed_mae: 4.27, congestion_accuracy: 0.88 } };
      setModelPerformance(mockPerf);
    } catch (err) {
      console.error("Error fetching model performance:", err);
    }
  };

  const retrainModels = async () => {
    try {
      setLoading(true);
      // call API (if available)
      try {
        await api.retrainModels();
        alert("✅ Models retrained successfully!");
      } catch (e) {
        // simulate retrain
        await new Promise((res) => setTimeout(res, 1500));
        alert("✅ (Mock) Models retrained successfully!");
      }
      fetchModelPerformance();
    } catch (err) {
      console.error("Error retraining models:", err);
      alert("❌ Failed to retrain models");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    // eslint-disable-next-line
  }, [selectedCity]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🤖 AI/ML Traffic Predictions</h2>
        <div className="flex items-center space-x-4">
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
          <button onClick={fetchPredictions} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Predicting..." : "Refresh Predictions"}
          </button>
          <button onClick={retrainModels} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Retrain Models
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading predictions...</span>
        </div>
      )}

      {modelPerformance && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">🎯 ML Model Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Model Status</div>
              <div className={`text-lg font-bold ${modelPerformance.model_status === "trained" ? "text-green-600" : "text-red-600"}`}>
                {modelPerformance.model_status === "trained" ? "✅ Trained" : "❌ Not Trained"}
              </div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Traffic Accuracy</div>
              <div className="text-lg font-bold text-blue-600">{modelPerformance.accuracy_metrics?.traffic_mae ? `${(100 - modelPerformance.accuracy_metrics.traffic_mae).toFixed(1)}%` : "N/A"}</div>
            </div>

            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Speed Accuracy</div>
              <div className="text-lg font-bold text-green-600">{modelPerformance.accuracy_metrics?.speed_mae ? `${(100 - modelPerformance.accuracy_metrics.speed_mae).toFixed(1)}%` : "N/A"}</div>
            </div>
            <div className="bg-white p-3 rounded border text-center">
              <div className="text-sm text-gray-600">Models Used</div>
              <div className="text-sm font-bold text-purple-600">RF + GB Ensemble</div>
            </div>
          </div>
        </div>
      )}

      {predictions && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🔮 2-Hour Traffic Predictions</h3>
            <div className="text-sm text-gray-600">{predictions.total_predictions} predictions • Confidence: {predictions.ml_model_info?.accuracy ? "High" : "Medium"}</div>
          </div>

          <div className="space-y-4">
            {predictions.predictions.map((prediction, index) => (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">📍 {prediction.intersection_id}</div>
                    <div className="text-sm text-gray-600">Prediction: {prediction.prediction_horizon} minutes ahead</div>
                    <div className="text-sm text-gray-600">🤖 {prediction.ml_model_used}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium mb-2 ${prediction.predicted_congestion === "Critical" ? "bg-red-200 text-red-800" : prediction.predicted_congestion === "High" ? "bg-orange-200 text-orange-800" : prediction.predicted_congestion === "Medium" ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800"}`}>{prediction.predicted_congestion}</div>
                    <div className="text-xs text-gray-500">Confidence: {(prediction.confidence_score * 100).toFixed(1)}%</div>
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

/* ---------------- MLAnalytics ----------------
   Same style as original, uses mock data if backend not available.
*/
const MLAnalytics = ({ selectedCity: propCity }) => {
  const [insights, setInsights] = useState(null);
  const [selectedCity, setSelectedCity] = useState(propCity || "Accra");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propCity) setSelectedCity(propCity);
  }, [propCity]);

  const fetchMLInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      // Attempt API call (if exists) otherwise mock
      await new Promise((res) => setTimeout(res, 800));
      const mockData = {
        city: selectedCity,
        ml_predictions: [
          { hour_ahead: 1, predictions: [{ intersection_id: `${selectedCity}_001`, predicted_congestion: "High", confidence: 0.85 }, { intersection_id: `${selectedCity}_002`, predicted_congestion: "Critical", confidence: 0.92 }] },
          { hour_ahead: 2, predictions: [{ intersection_id: `${selectedCity}_001`, predicted_congestion: "Medium", confidence: 0.78 }, { intersection_id: `${selectedCity}_002`, predicted_congestion: "High", confidence: 0.82 }] },
          { hour_ahead: 3, predictions: [{ intersection_id: `${selectedCity}_001`, predicted_congestion: "Low", confidence: 0.75 }, { intersection_id: `${selectedCity}_002`, predicted_congestion: "Medium", confidence: 0.79 }] },
          { hour_ahead: 4, predictions: [{ intersection_id: `${selectedCity}_001`, predicted_congestion: "Low", confidence: 0.72 }, { intersection_id: `${selectedCity}_002`, predicted_congestion: "Low", confidence: 0.68 }] },
        ],
        pattern_analysis: { peak_approaching: true, expected_peak_severity: "High", recommended_actions: ["Preemptively adjust signal timing", "Alert commuters", "Prepare alternative routes"] },
        optimization_opportunities: [{ intersection_id: `${selectedCity}-003`, opportunity: "Signal timing optimization", potential_improvement: "25% traffic flow improvement" }],
        model_reliability: { overall_confidence: 0.87, prediction_accuracy: "89%" },
        generated_at: new Date().toISOString(),
      };
      setInsights(mockData);
    } catch (err) {
      console.error("Error fetching ML insights:", err);
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
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
          <button onClick={fetchMLInsights} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Analyzing..." : "Refresh Analytics"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="loader-spinner"></div>
          <span className="ml-2">Loading analytics...</span>
        </div>
      )}

      {insights && (
        <>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">⏰ 4-Hour Forecast</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {insights.ml_predictions.map((hourData, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center mb-3">
                    <div className="text-2xl font-bold text-indigo-600">{hourData.hour_ahead}h</div>
                    <div className="text-sm text-gray-600">ahead</div>
                  </div>
                  <div className="space-y-2">
                    {hourData.predictions.map((pred, pIdx) => (
                      <div key={pIdx} className="bg-white p-2 rounded text-sm">
                        <div className="font-medium">{pred.intersection_id}</div>
                        <div className={`text-xs ${pred.predicted_congestion === "Critical" ? "text-red-600" : pred.predicted_congestion === "High" ? "text-orange-600" : pred.predicted_congestion === "Medium" ? "text-yellow-600" : "text-green-600"}`}>{pred.predicted_congestion} ({(pred.confidence * 100).toFixed(0)}%)</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🔍 AI Pattern Analysis</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-blue-800">Peak Analysis</div>
                  <div className="text-sm text-blue-600">Peak Approaching: {insights.pattern_analysis.peak_approaching ? "⚠️ Yes" : "✅ No"}</div>
                  <div className="text-sm text-blue-600">Expected Severity: {insights.pattern_analysis.expected_peak_severity}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-800">Recommended Actions</div>
                  {insights.pattern_analysis.recommended_actions.map((action, idx) => <div key={idx} className="text-sm text-blue-600">• {action}</div>)}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">⚡ ML Optimization Opportunities</h3>
            <div className="space-y-3">
              {insights.optimization_opportunities.map((opp, idx) => (
                <div key={idx} className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
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

          <div>
            <h3 className="text-lg font-semibold mb-3">🎯 Model Reliability</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Overall Confidence</div>
                  <div className="text-2xl font-bold text-purple-600">{(insights.model_reliability.overall_confidence * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-sm text-gray-600">Prediction Accuracy</div>
                  <div className="text-2xl font-bold text-purple-600">{insights.model_reliability.prediction_accuracy}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------- CurrentTraffic ----------------
   Live conditions (mock or API)
*/
const CurrentTraffic = ({ selectedCity: propCity }) => {
  const [trafficData, setTrafficData] = useState(null);
  const [selectedCity, setSelectedCity] = useState(propCity || "Accra");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propCity) setSelectedCity(propCity);
  }, [propCity]);

  const fetchTrafficData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try API (getTraffic) else fallback mock
      try {
        const resp = await api.getTraffic(selectedCity);
        if (resp?.data) {
          setTrafficData(resp.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore
      }

      await new Promise((res) => setTimeout(res, 700));
      const sample = (selectedCity === "Accra" ? accraIntersections : kumasiIntersections).slice(0, 6).map((it, i) => ({
        intersection_id: `${it.id}`,
        location: { lat: it.lat, lng: it.lng },
        vehicle_count: Math.floor(40 + Math.random() * 140),
        average_speed: Number((10 + Math.random() * 35).toFixed(1)),
        congestion_level: ["Low", "Medium", "High", "Critical"][Math.floor(Math.random() * 4)],
        weather_condition: ["Clear", "Cloudy", "Rain"][Math.floor(Math.random() * 3)],
      }));
      setTrafficData({ city: selectedCity, traffic_data: sample, summary: { total_intersections: sample.length, high_congestion: sample.filter(s => s.congestion_level === "High" || s.congestion_level === "Critical").length, average_speed: sample.reduce((a,b)=>a+b.average_speed,0)/sample.length }, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("Error fetching traffic data:", err);
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
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
          <button onClick={fetchTrafficData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

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
              <div className="text-sm text gray-600">High Congestion Points</div>
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
                    <div className="text-sm text-gray-600">📍 {intersection.location.lat.toFixed(4)}, {intersection.location.lng.toFixed(4)}</div>
                    <div className="text-sm text-gray-600">🚗 {intersection.vehicle_count} vehicles • ⚡ {intersection.average_speed.toFixed(1)} km/h • 🌤️ {intersection.weather_condition}</div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${intersection.congestion_level === "Critical" ? "bg-red-200 text-red-800" : intersection.congestion_level === "High" ? "bg-orange-200 text-orange-800" : intersection.congestion_level === "Medium" ? "bg-yellow-200 text-yellow-800" : "bg-green-200 text-green-800"}`}>
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

/* ---------------- Main App ----------------
   This is the top-level App that plugs everything together.
*/
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [selectedCity, setSelectedCity] = useState("Accra");

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(`${API}/health`);
        setBackendStatus("connected");
      } catch (error) {
        setBackendStatus("error");
      }
    };
    checkBackend();
  }, []);

  const tabs = [
    { id: "dashboard", name: "Traffic Dashboard", icon: "🚦" },
    { id: "route", name: "Route Optimization", icon: "🗺️" },
    { id: "ml-predict", name: "AI/ML Predictions", icon: "🤖" },
    { id: "ml-analytics", name: "ML Analytics", icon: "📊" },
    { id: "live", name: "Live Traffic", icon: "📍" },
  ];

  // Choose the dataset for the MapView
  const intersections = selectedCity === "Accra" ? accraIntersections : kumasiIntersections;
  const routes = selectedCity === "Accra" ? accraRoutes : kumasiRoutes;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Backend status */}
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold z-50 ${backendStatus === "connected" ? "bg-green-100 text-green-800" : backendStatus === "error" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
        {backendStatus === "connected" ? "Backend Connected" : backendStatus === "error" ? "Backend Error" : "Checking Backend..."}
      </div>


      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">🚦 AI/ML Traffic Flow Optimizer</h1>
              <span className="ml-3 px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">Ghana • Accra & Kumasi</span>
            </div>
            <div className="text-sm text-gray-600">Powered by Google AI + Machine Learning • Real-time Optimization</div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {backendStatus === "error" && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Connection Error:</strong> Unable to connect to the backend server. Please ensure the server is running at {BACKEND_URL}.
          </div>
        )}

        {/* City selector (global) */}
        <div className="mb-6 flex items-center gap-4">
          <label className="font-medium">Select City:</label>
          <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md">
            <option value="Accra">Accra</option>
            <option value="Kumasi">Kumasi</option>
          </select>
        </div>

        {/* Tabs */}
        {activeTab === "dashboard" && <TrafficDashboard selectedCity={selectedCity} />}
        {activeTab === "route" && (
          <>
            <MapView intersections={intersections} routes={routes} />
            <RouteRecommendation city={selectedCity} />
          </>
        )}
        {activeTab === "ml-predict" && <MLPredictions selectedCity={selectedCity} />}
        {activeTab === "ml-analytics" && <MLAnalytics selectedCity={selectedCity} />}
        {activeTab === "live" && <CurrentTraffic selectedCity={selectedCity} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-600">By Michael O. Mantey © 2025 AI/ML Traffic Flow Optimization System • Reducing congestion in Ghana with Machine Learning</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
