export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, string | number | boolean>;
  warranty?: string;
  costPrice: number;
  sellingPrice: number;
  msrp?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  trackInventory: boolean;
  lowStockThreshold?: number;
  images: string[];
  documents: string[];
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'discontinued';
  isActive: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  inventory?: Array<{
    quantity: number;
    availableQuantity: number;
    location: {
      id: string;
      name: string;
    };
  }>;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    attributes: Record<string, string>;
    priceAdjustment: number;
    isActive: boolean;
  }>;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: 'mm' | 'cm' | 'in';
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  model?: string;
  specifications?: Record<string, string | number | boolean>;
  warranty?: string;
  costPrice: number;
  sellingPrice: number;
  msrp?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  images?: string[];
  documents?: string[];
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  categoryId?: string;
  status?: 'active' | 'inactive' | 'discontinued';
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  image?: string;
  isActive: boolean;
  sortOrder: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStats {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
  byCategory: Array<{ categoryId: string; _count: number }>;
  byBrand: Array<{ brand: string; _count: number }>;
}
