import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("lms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authorization expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");
      
      // If not on login page, redirect
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
