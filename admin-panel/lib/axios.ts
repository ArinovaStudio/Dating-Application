import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const api = axios.create({
  baseURL: process.env.NEXT_BACKEND_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});