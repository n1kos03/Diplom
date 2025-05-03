import axios from 'axios';

const API_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth toke
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiry
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login/';
    }
    return Promise.reject(error);
  }
);

export default api;