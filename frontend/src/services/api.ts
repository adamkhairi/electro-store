import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
} from '@electrostock/types';
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/login', credentials),

  register: (userData: RegisterRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> =>
    api.post('/auth/register', userData),

  refreshToken: (
    data: RefreshTokenRequest
  ): Promise<AxiosResponse<ApiResponse<RefreshTokenResponse>>> => api.post('/auth/refresh', data),

  logout: (): Promise<AxiosResponse<ApiResponse>> => api.post('/auth/logout'),

  getProfile: (): Promise<AxiosResponse<ApiResponse<any>>> => api.get('/auth/profile'),

  forgotPassword: (email: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (resetToken: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/reset-password', { resetToken, newPassword }),

  changePassword: (
    currentPassword: string,
    newPassword: string
  ): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

// Product API endpoints
export const productAPI = {
  getProducts: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/products', { params }),

  getProduct: (id: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get(`/products/${id}`),

  createProduct: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/products', data),

  updateProduct: (id: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/products/${id}`, data),

  deleteProduct: (id: string): Promise<AxiosResponse<ApiResponse>> => api.delete(`/products/${id}`),
};

// Inventory API endpoints
export const inventoryAPI = {
  getInventory: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/inventory', { params }),

  adjustStock: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/inventory/adjust', data),

  transferStock: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/inventory/transfer', data),

  getAlerts: (): Promise<AxiosResponse<ApiResponse<any>>> => api.get('/inventory/alerts'),
};

// Order API endpoints
export const orderAPI = {
  getOrders: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/orders', { params }),

  getOrder: (id: string): Promise<AxiosResponse<ApiResponse<any>>> => api.get(`/orders/${id}`),

  createOrder: (data: any): Promise<AxiosResponse<ApiResponse<any>>> => api.post('/orders', data),

  updateOrder: (id: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/orders/${id}`, data),

  processPayment: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/orders/payment', data),
};

// Customer API endpoints
export const customerAPI = {
  getCustomers: (params?: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/customers', { params }),

  getCustomer: (id: string): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get(`/customers/${id}`),

  createCustomer: (data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.post('/customers', data),

  updateCustomer: (id: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.put(`/customers/${id}`, data),
};

// Export the configured axios instance
export default api;
