// src/services/api.js
import axios from "axios";

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_API_URL || "/api";

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
