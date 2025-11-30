import api from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, LoginCredentials, RegisterData, AuthTokens } from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('Attempting login with:', credentials.email);
    const response = await api.post('/commons/auth/login/', credentials);
    console.log('Login response:', response.data);
    const { user, access, refresh } = response.data;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { user, tokens: { access, refresh } };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('Attempting registration');
    const response = await api.post('/commons/auth/register/', data);
    const { user, access, refresh } = response.data;
    
    // Store tokens
    await AsyncStorage.setItem('auth_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return { user, tokens: { access, refresh } };
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch {
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  },
};
