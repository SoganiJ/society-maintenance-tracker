import axios from 'axios';

// In dev, VITE_API_URL is unset and Vite's proxy (vite.config.js) forwards
// /api to localhost:5000. In production this points straight at Render.
let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.startsWith('http') && !baseURL.endsWith('/api')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smt-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smt-token');
      // Full auth/routing wiring lands in the Authentication step;
      // for now this just clears the stale token.
    }
    return Promise.reject(error);
  }
);

export default api;
