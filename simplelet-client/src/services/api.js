import axios from "axios";

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    let url = envUrl.replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
    return url;
  }
  
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
        // ignore invalid JSON
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor handles status codes without forcing window location redirects for guests
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token quietly if expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default API;
