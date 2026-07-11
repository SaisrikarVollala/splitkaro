import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true, // Important for better-auth cookies
});

// We can add interceptors here later if needed for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized globally
    if (error.response?.status === 401) {
      // You could dispatch an event or call a method to clear the auth store
      console.error("Unauthorized request");
    }
    return Promise.reject(error);
  }
);
