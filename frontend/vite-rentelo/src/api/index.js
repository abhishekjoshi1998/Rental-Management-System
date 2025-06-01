
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.error(
    "FATAL ERROR: VITE_API_URL is not defined. " +
    "Please ensure it's set in your .env file in the project root (e.g., VITE_API_URL=http://localhost:5000/api) " +
    "and that you have RESTARTED your Vite development server after creating/modifying the .env file."
  );
}

const api = axios.create({
  // Use the loaded apiUrl. Fallback is less ideal but can prevent outright crashes if configured.
  baseURL: apiUrl || 'http://default-if-not-set.com/api', 
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
    
      if (error.config.headers && error.config.headers.Authorization) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth-error-401')); // AuthContext should listen to this
        console.warn("Unauthorized (401) request with existing token. User data cleared. App should redirect to login via AuthContext.");
      } else {
        console.warn("Unauthorized (401) request, but no existing token was sent (e.g., login attempt).");
      }
    }
    return Promise.reject(error);
  }
);

export default api;