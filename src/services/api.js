// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 
    'Content-Type': 'application/json',
  },
});  

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('goldchain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('goldchain_token');
      localStorage.removeItem('goldchain_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;



