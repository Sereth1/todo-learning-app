// Test the API directly
import api from './client';

// Simple test function you can call from console
export async function testLogin() {
  try {
    console.log('Testing API connection...');
    console.log('API URL:', 'http://localhost:8000/api');
    
    const response = await api.post('/commons/auth/login/', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    console.log('SUCCESS:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('ERROR:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    throw error;
  }
}

// Test health check
export async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await api.get('/commons/health/');
    console.log('Health check:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}
