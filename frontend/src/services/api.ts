import {
  ApiResponse,
  AuthResponse,
  BarcodeValidationRequest,
  BarcodeValidationResponse,
  Category,
  CategoryListRequest,
  CategoryListResponse,
  CategoryTreeNode,
  CreateCategoryRequest,
  CreateCustomerRequest,
  CreateLocationRequest,
  CreateOrderRequest,
  CreateProductRequest,
  Customer,
  DashboardStats,
  Inventory,
  InventoryAlert,
  InventoryDashboardStats,
  InventoryListRequest,
  InventoryListResponse,
  Location,
  LoginRequest,
  Order,
  OrderListRequest,
  OrderListResponse,
  ProcessPaymentRequest,
  Product,
  ProductListRequest,
  ProductListResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  SkuGenerationRequest,
  SkuGenerationResponse,
  StockAdjustmentRequest,
  StockMovementListRequest,
  StockMovementListResponse,
  StockTransferRequest,
  UpdateCategoryRequest,
  UpdateCustomerRequest,
  UpdateLocationRequest,
  UpdateOrderRequest,
  UpdateProductRequest,
  User,
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
        } catch (err) {
          // Log to diagnostics (optional)
          if (import.meta?.env?.DEV) {
            console.warn('Refresh token request failed', err);
          }
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

  getProfile: (): Promise<AxiosResponse<ApiResponse<User>>> => api.get('/auth/profile'),

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
  getProducts: (
    params?: ProductListRequest
  ): Promise<AxiosResponse<ApiResponse<ProductListResponse>>> => api.get('/products', { params }),

  getProduct: (id: string): Promise<AxiosResponse<ApiResponse<Product>>> =>
    api.get(`/products/${id}`),

  createProduct: (data: CreateProductRequest): Promise<AxiosResponse<ApiResponse<Product>>> =>
    api.post('/products', data),

  updateProduct: (
    id: string,
    data: UpdateProductRequest
  ): Promise<AxiosResponse<ApiResponse<Product>>> => api.put(`/products/${id}`, data),

  deleteProduct: (id: string): Promise<AxiosResponse<ApiResponse>> => api.delete(`/products/${id}`),

  getProductStats: (): Promise<
    AxiosResponse<
      ApiResponse<{ totalProducts: number; activeProducts: number; lowStockProducts: number }>
    >
  > => api.get('/products/stats'),

  generateSku: (
    data: SkuGenerationRequest
  ): Promise<AxiosResponse<ApiResponse<SkuGenerationResponse>>> =>
    api.post('/products/generate-sku', data),

  validateBarcode: (
    data: BarcodeValidationRequest
  ): Promise<AxiosResponse<ApiResponse<BarcodeValidationResponse>>> =>
    api.post('/products/validate-barcode', data),
};

// Category API endpoints
export const categoryAPI = {
  getCategories: (
    params?: CategoryListRequest
  ): Promise<AxiosResponse<ApiResponse<CategoryListResponse>>> =>
    api.get('/categories', { params }),

  getCategory: (id: string): Promise<AxiosResponse<ApiResponse<Category>>> =>
    api.get(`/categories/${id}`),

  createCategory: (data: CreateCategoryRequest): Promise<AxiosResponse<ApiResponse<Category>>> =>
    api.post('/categories', data),

  updateCategory: (
    id: string,
    data: UpdateCategoryRequest
  ): Promise<AxiosResponse<ApiResponse<Category>>> => api.put(`/categories/${id}`, data),

  deleteCategory: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/categories/${id}`),

  getCategoryTree: (): Promise<AxiosResponse<ApiResponse<CategoryTreeNode[]>>> =>
    api.get('/categories/tree'),

  reorderCategories: (
    data: { categoryId: string; newSortOrder: number }[]
  ): Promise<AxiosResponse<ApiResponse<Category[]>>> => api.post('/categories/reorder', data),
};

// Inventory API endpoints
export const inventoryAPI = {
  getInventory: (
    params?: InventoryListRequest
  ): Promise<AxiosResponse<ApiResponse<InventoryListResponse>>> =>
    api.get('/inventory', { params }),

  adjustStock: (data: StockAdjustmentRequest): Promise<AxiosResponse<ApiResponse<Inventory>>> =>
    api.post('/inventory/adjust', data),

  transferStock: (
    data: StockTransferRequest
  ): Promise<AxiosResponse<ApiResponse<{ success: boolean; transferredItems: number }>>> =>
    api.post('/inventory/transfer', data),

  getAlerts: (): Promise<AxiosResponse<ApiResponse<InventoryAlert[]>>> =>
    api.get('/inventory/alerts'),

  getMovements: (
    params?: StockMovementListRequest
  ): Promise<AxiosResponse<ApiResponse<StockMovementListResponse>>> =>
    api.get('/inventory/movements', { params }),

  getStats: (): Promise<AxiosResponse<ApiResponse<InventoryDashboardStats>>> =>
    api.get('/inventory/stats'),
};

// Location API endpoints
export const locationAPI = {
  getLocations: (params?: {
    search?: string;
    includeInactive?: boolean;
  }): Promise<AxiosResponse<ApiResponse<Location[]>>> => api.get('/locations', { params }),

  getLocation: (id: string): Promise<AxiosResponse<ApiResponse<Location>>> =>
    api.get(`/locations/${id}`),

  createLocation: (data: CreateLocationRequest): Promise<AxiosResponse<ApiResponse<Location>>> =>
    api.post('/locations', data),

  updateLocation: (
    id: string,
    data: UpdateLocationRequest
  ): Promise<AxiosResponse<ApiResponse<Location>>> => api.put(`/locations/${id}`, data),

  deleteLocation: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/locations/${id}`),

  setDefaultLocation: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.patch(`/locations/${id}/set-default`),

  getLocationStats: (): Promise<
    AxiosResponse<
      ApiResponse<{ totalLocations: number; activeLocations: number; totalProducts: number }>
    >
  > => api.get('/locations/stats'),
};

// Order API endpoints
export const orderAPI = {
  getOrders: (params?: OrderListRequest): Promise<AxiosResponse<ApiResponse<OrderListResponse>>> =>
    api.get('/orders', { params }),

  getOrder: (id: string): Promise<AxiosResponse<ApiResponse<Order>>> => api.get(`/orders/${id}`),

  createOrder: (data: CreateOrderRequest): Promise<AxiosResponse<ApiResponse<Order>>> =>
    api.post('/orders', data),

  updateOrder: (id: string, data: UpdateOrderRequest): Promise<AxiosResponse<ApiResponse<Order>>> =>
    api.put(`/orders/${id}`, data),

  processPayment: (
    data: ProcessPaymentRequest
  ): Promise<AxiosResponse<ApiResponse<{ paymentId: string; status: string }>>> =>
    api.post('/orders/payment', data),
};

// Sales API endpoints
export const salesAPI = {
  createSale: (data: CreateOrderRequest): Promise<AxiosResponse<ApiResponse<Order>>> =>
    api.post('/sales', data),
  getSales: (params?: OrderListRequest): Promise<AxiosResponse<ApiResponse<OrderListResponse>>> =>
    api.get('/sales', { params }),
  getSale: (id: string): Promise<AxiosResponse<ApiResponse<Order>>> => api.get(`/sales/${id}`),
  getReceipt: (
    id: string
  ): Promise<AxiosResponse<ApiResponse<{ receiptData: string; printUrl?: string }>>> =>
    api.get(`/sales/${id}/receipt`),
  getDashboardSummary: (params?: {
    period?: 'today' | 'week' | 'month' | 'year';
  }): Promise<AxiosResponse<ApiResponse<DashboardStats>>> =>
    api.get('/sales/dashboard/summary', { params }),
  voidSale: (
    id: string,
    data: { reason: string }
  ): Promise<AxiosResponse<ApiResponse<{ voidedSaleId: string; refundAmount: number }>>> =>
    api.post(`/sales/${id}/void`, data),
};

// Customer API endpoints
export const customerAPI = {
  getCustomers: (params?: {
    search?: string;
    type?: 'individual' | 'business';
    status?: 'active' | 'inactive' | 'blocked';
    page?: number;
    limit?: number;
  }): Promise<
    AxiosResponse<
      ApiResponse<{
        customers: Customer[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>
    >
  > => api.get('/customers', { params }),

  getCustomer: (id: string): Promise<AxiosResponse<ApiResponse<Customer>>> =>
    api.get(`/customers/${id}`),

  createCustomer: (data: CreateCustomerRequest): Promise<AxiosResponse<ApiResponse<Customer>>> =>
    api.post('/customers', data),

  updateCustomer: (
    id: string,
    data: UpdateCustomerRequest
  ): Promise<AxiosResponse<ApiResponse<Customer>>> => api.put(`/customers/${id}`, data),
};

// Export the configured axios instance
export default api;
