// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Common Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  search?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: Date;
  endDate?: Date;
}

// File Upload Types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: ValidationError[] | any;
  };
}

// Dashboard/Analytics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  lowStockItems: number;

  // Period comparisons
  revenueChange: number;
  ordersChange: number;
  customersChange: number;

  // Recent activity
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    customerName?: string;
    createdAt: Date;
  }>;

  // Top products
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    salesCount: number;
    revenue: number;
  }>;

  // Sales chart data
  salesChart: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}
