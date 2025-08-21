import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Route Recommendation Component
const RouteRecommendation = () => {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startLat: '5.5600',
    startLng: '-0.1969',
    endLat: '5.5566',
    endLng: '-0.1969',
    city: 'Accra'
  });

  const handleOptimizeRoute = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/route/optimize`, {
        start_location: { lat: parseFloat(formData.startLat), lng: parseFloat(formData.startLng) },
        end_location: { lat: parseFloat(formData.endLat), lng: parseFloat(formData.endLng) },
        city: formData.city,
        vehicle_type: "car"
      });
      setRouteData(response.data);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🗺️ Smart Route Optimization</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Location (Lat, Lng)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.0001"
              value={formData.startLat}
              onChange={(e) => setFormData({...formData, startLat: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              value={formData.startLng}
              onChange={(e) => setFormData({...formData, startLng: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Longitude"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Location (Lat, Lng)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.0001"
              value={formData.endLat}
              onChange={(e) => setFormData({...formData, endLat: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              value={formData.endLng}
              onChange={(e) => setFormData({...formData, endLng: e.target.value})}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Longitude"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <select
          value={formData.city}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="Accra">Accra</option>
          <option value="Kumasi">Kumasi</option>
        </select>
        
        <button
          onClick={handleOptimizeRoute}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Optimizing...' : 'Get AI Route Recommendation'}
        </button>
      </div>

      {routeData && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">🤖 AI Route Recommendation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-xl font-bold text-blue-600">{routeData.estimated_duration} min</div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-xl font-bold text-green-600">{routeData.estimated_distance} km</div>
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

// Traffic Dashboard Component
const TrafficDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/dashboard/overview/${selectedCity}`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.metrics.active_intersections}</div>
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

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/ml/batch-predict/${selectedCity}?horizon=120`);
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching ML predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModelPerformance = async () => {
    try {
      const response = await axios.get(`${API}/ml/model-performance/${selectedCity}`);
      setModelPerformance(response.data);
    } catch (error) {
      console.error('Error fetching model performance:', error);
    }
  };

  const retrainModels = async () => {
    try {
      const response = await axios.post(`${API}/ml/retrain/${selectedCity}`);
      alert(`✅ ${response.data.message}`);
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

  const fetchMLInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/ml-insights/${selectedCity}`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching ML insights:', error);
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
const CurrentTraffic = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [selectedCity, setSelectedCity] = useState('Accra');
  const [loading, setLoading] = useState(false);

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/traffic/current/${selectedCity}`);
      setTrafficData(response.data);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
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
              <div className="text-2xl font-bold text-green-600">{trafficData.summary.average_speed}</div>
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

  const tabs = [
    { id: 'dashboard', name: 'Traffic Dashboard', icon: '🚦' },
    { id: 'route', name: 'Route Optimization', icon: '🗺️' },
    { id: 'ml-predict', name: 'AI/ML Predictions', icon: '🤖' },
    { id: 'ml-analytics', name: 'ML Analytics', icon: '📊' },
    { id: 'live', name: 'Live Traffic', icon: '📍' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
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
            <div className="text-sm text-gray-600">
              Powered by Google AI + Machine Learning • Real-time Optimization
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
        {activeTab === 'dashboard' && <TrafficDashboard />}
        {activeTab === 'route' && <RouteRecommendation />}
        {activeTab === 'ml-predict' && <MLPredictions />}
        {activeTab === 'ml-analytics' && <MLAnalytics />}
        {activeTab === 'live' && <CurrentTraffic />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>© 2025 AI/ML Traffic Flow Optimization System • Reducing congestion in Ghana with Machine Learning 🇬🇭</p>
        </div>
      </footer>
    </div>
  );
}

export default App;