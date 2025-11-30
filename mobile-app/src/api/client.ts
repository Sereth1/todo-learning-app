import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - localhost for web browser and iOS simulator
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401) {
      // Token expired, clear storage
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;
