// src/api/index.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Corrected: Use import.meta.env for Vite
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // This is a critical point. A hard redirect might be too disruptive.
      // Ideally, your AuthContext would observe this or have a method called.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Emitting a custom event that AuthContext can listen to is a good pattern.
      window.dispatchEvent(new CustomEvent('auth-error-401'));
      console.error("Unauthorized access - 401. User data cleared. App should redirect to login via AuthContext.");
    }
    return Promise.reject(error);
  }
);

export default api;