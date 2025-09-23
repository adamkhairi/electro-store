// Product Management Types
export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;

  // Electronics specific
  brand?: string;
  model?: string;
  specifications?: ProductSpecifications;
  warranty?: string;

  // Pricing
  costPrice: number;
  sellingPrice: number;
  msrp?: number;

  // Physical attributes
  weight?: number;
  dimensions?: ProductDimensions;

  // Inventory settings
  trackInventory: boolean;
  lowStockThreshold?: number;

  // Media
  images: string[];
  documents: string[];

  // SEO and metadata
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];

  // Status
  status: ProductStatus;
  isActive: boolean;

  // Relationships
  categoryId?: string;
  category?: Category;
  tenantId: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSpecifications {
  [key: string]: string | number | boolean | undefined;
  // Common electronics specs
  processor?: string;
  memory?: string;
  storage?: string;
  display?: string;
  graphics?: string;
  battery?: string;
  connectivity?: string;
  operatingSystem?: string;
  color?: string;
  size?: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'mm' | 'cm' | 'in';
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  attributes: Record<string, string>;
  priceAdjustment: number;
  costAdjustment: number;
  image?: string;
  isActive: boolean;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

// Product Request/Response Types
export interface CreateProductRequest {
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  brand?: string;
  model?: string;
  specifications?: ProductSpecifications;
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
  status?: ProductStatus;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductListRequest {
  page?: number;
  limit?: number;
  search?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  status?: ProductStatus;
  brand?: string;
  sortBy?: 'name' | 'sku' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface CategoryListRequest {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  includeInactive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryListResponse {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  productCount?: number;
}

// SKU Generation Types
export interface SkuGenerationRequest {
  productName: string;
  brand?: string;
  categoryId?: string;
  customPrefix?: string;
}

export interface SkuGenerationResponse {
  sku: string;
  pattern: string;
}

// Barcode Types
export interface BarcodeValidationRequest {
  barcode: string;
  type?: BarcodeType;
}

export interface BarcodeValidationResponse {
  isValid: boolean;
  type?: BarcodeType;
  checksum?: boolean;
  message?: string;
}

export enum BarcodeType {
  UPC_A = 'UPC-A',
  UPC_E = 'UPC-E',
  EAN_13 = 'EAN-13',
  EAN_8 = 'EAN-8',
  CODE_128 = 'CODE-128',
  CODE_39 = 'CODE-39',
  ITF = 'ITF',
  MSI = 'MSI',
}
