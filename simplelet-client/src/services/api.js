// src/services/api.js
import axios from "axios";

// TEMPORARY: Hardcode the correct backend URL
const API_URL = "https://simplelet-server-production.up.railway.app/api";

console.log("🔍 API URL (hardcoded):", API_URL);

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

  const location = localStorage.getItem("userLocation");
  if (location) {
    try {
      const { latitude, longitude } = JSON.parse(location);
      config.headers["X-User-Latitude"] = latitude;
      config.headers["X-User-Longitude"] = longitude;
    } catch (e) {}
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default API;
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
