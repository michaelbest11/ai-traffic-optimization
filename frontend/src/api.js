
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API_BASE = `${BACKEND_URL}/api`;
const api = {
  getTraffic: async (city = "Accra") => {
    const res = await axios.get(`${API_BASE}/traffic`, { params: { city } });
    return res.data;
  },
  getPredictions: async (city = "Accra") => {
    const res = await axios.get(`${API_BASE}/ml/predict`, { params: { city } });
    return res.data;
  },
  optimizeRoute: async (payload) => {
    const res = await axios.post(`${API_BASE}/optimize-route`, payload);
    return res.data;

  },
  retrainModels: async () => {
    const res = await axios.post(`${API_BASE}/ml/retrain`);
    return res.data;
  },
};

export default api;
