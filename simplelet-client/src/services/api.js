// src/services/api.js
import axios from "axios";

// ============ SMART API URL CONFIG ============
// This ensures /api is always included, no matter what
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If environment variable is set, use it but ensure it ends with /api
  if (envUrl) {
    let url = envUrl.replace(/\/+$/, ''); // Remove trailing slash
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  
  // Default for local development (proxy)
  return '/api';
};

const API_URL = getApiUrl();
console.log('🔍 API URL:', API_URL);

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and location to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const location = localStorage.getItem('userLocation');
    if (location) {
      try {
        const { latitude, longitude } = JSON.parse(location);
        config.headers['X-User-Latitude'] = latitude;
        config.headers['X-User-Longitude'] = longitude;
      } catch (e) {
        // ignore
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;