// Inventory Management Types
export interface Inventory {
  id: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;

  // Batch/lot tracking
  batchNumber?: string;
  expirationDate?: Date;

  // Serial number tracking
  serialNumbers: string[];

  // Reorder settings
  reorderPoint?: number;
  reorderQuantity?: number;
  maxStockLevel?: number;

  // Pricing at location level
  locationCostPrice?: number;

  // Relationships
  productId?: string;
  variantId?: string;
  locationId: string;

  // Timestamps
  lastCountDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  notes?: string;
  beforeQuantity?: number;
  afterQuantity?: number;
  inventoryId: string;
  userId?: string;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  isDefault: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum StockMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  RETURN = 'return',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
}

// Enhanced Inventory Request/Response Types
export interface StockAdjustmentRequest {
  inventoryId: string;
  quantity: number;
  type: 'adjustment' | 'damaged' | 'expired';
  reason: string;
  notes?: string;
}

export interface StockTransferRequest {
  fromLocationId: string;
  toLocationId: string;
  items: {
    productId?: string;
    variantId?: string;
    quantity: number;
  }[];
  notes?: string;
  reference?: string;
}

export interface InventoryListRequest {
  locationId?: string;
  productId?: string;
  categoryId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'productName' | 'quantity' | 'lastUpdate';
  sortOrder?: 'asc' | 'desc';
}

export interface InventoryListResponse {
  inventory: (Inventory & {
    product?: {
      id: string;
      name: string;
      sku: string;
      brand?: string;
    };
    variant?: {
      id: string;
      name: string;
      sku: string;
    };
    location: {
      id: string;
      name: string;
    };
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateLocationRequest {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  id: string;
}

// Stock Movement Tracking
export interface StockMovementListRequest {
  inventoryId?: string;
  productId?: string;
  locationId?: string;
  type?: StockMovementType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface StockMovementListResponse {
  movements: (StockMovement & {
    inventory: {
      product?: {
        id: string;
        name: string;
        sku: string;
      };
      variant?: {
        id: string;
        name: string;
        sku: string;
      };
      location: {
        id: string;
        name: string;
      };
    };
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Inventory Dashboard Types
export interface InventoryDashboardStats {
  totalProducts: number;
  totalLocations: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  recentMovements: StockMovement[];
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock';
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  threshold?: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}
