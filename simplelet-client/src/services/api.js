
// src/services/api.js
import axios from "axios";

// ============ API URL Configuration ============
// Use environment variable or hardcode for testing
const API_URL = import.meta.env.VITE_API_URL || "https://simplelet-server-production.up.railway.app/api";

console.log("🔍 API URL:", API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============ Request Interceptor ============
API.interceptors.request.use(
  (config) => {
    // Add JWT token if available
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add location if available
    const location = localStorage.getItem("userLocation");
    if (location) {
      try {
        const { latitude, longitude } = JSON.parse(location);
        config.headers["X-User-Latitude"] = latitude;
        config.headers["X-User-Longitude"] = longitude;
      } catch (e) {
        // ignore
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============ Response Interceptor ============
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;