// src/services/api.js
import axios from "axios";

// ============ FIX: Ensure API_URL includes /api ============
let API_URL = import.meta.env.VITE_API_URL || "/api";

// If API_URL is a full URL without /api, add it
if (API_URL && API_URL.startsWith("http")) {
  // Remove trailing slash if exists
  if (API_URL.endsWith("/")) {
    API_URL = API_URL.slice(0, -1);
  }
  // Add /api if not present
  if (!API_URL.includes("/api") && !API_URL.endsWith("/api")) {
    API_URL = `${API_URL}/api`;
  }
}

console.log("🔍 API URL:", API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token and location to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add location to headers if available
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
});

// Handle response errors globally
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
  },
);

export default API;
