// src/lib/api.js
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

console.log("API Base URL:", API);

// Helper: centralized error handler
const handleError = (error) => {
  if (error.response) {
    console.error("API Response Error:", error.response.data);
    throw error.response.data;
  } else if (error.request) {
    console.error("API No Response:", error.request);
    throw { message: "No response from server" };
  } else {
    console.error("API Error:", error.message);
    throw { message: error.message };
  }
};

// API wrapper
const api = {
  // 1. Live Traffic Data
  getTraffic: async (city) => {
    try {
      const res = await axios.get(`${API}/traffic?city=${city}`);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 2. Congestion Prediction
  predictCongestion: async (city) => {
    try {
      const res = await axios.get(`${API}/predict/congestion?city=${city}`);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 3. Travel Time Prediction
  predictTravelTime: async (data) => {
    try {
      const res = await axios.post(`${API}/predict/travel-time`, data);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 4. Optimize Route
  optimizeRoute: async (data) => {
    try {
      const res = await axios.post(`${API}/optimize-route`, data);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 5. ML Predictions
  mlPredict: async (city) => {
    try {
      const res = await axios.get(`${API}/ml/predict?city=${city}`);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 6. Retrain Models
  retrainModels: async () => {
    try {
      const res = await axios.post(`${API}/ml/retrain`);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  },

  // 7. Streaming Training Logs (SSE)
  streamTrainingLogs: (onMessage, onError) => {
    try {
      const eventSource = new EventSource(`${API}/ml/training-logs`);
      eventSource.onmessage = (e) => {
        if (onMessage) onMessage(JSON.parse(e.data));
      };
      eventSource.onerror = (e) => {
        if (onError) onError(e);
        eventSource.close();
      };
      return eventSource; // caller can close when needed
    } catch (e) {
      console.error("SSE Error:", e);
    }
  },

  // 8. Leads Submission
  submitLead: async (leadData) => {
    try {
      const res = await axios.post(`${API}/leads`, leadData);
      return res.data;
    } catch (e) {
      handleError(e);
    }
  }
};

export default api;
