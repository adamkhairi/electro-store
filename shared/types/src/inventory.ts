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
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
}

// Inventory Request/Response Types
export interface StockAdjustmentRequest {
  inventoryId: string;
  quantity: number;
  reason?: string;
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
}

export interface InventoryListRequest {
  locationId?: string;
  productId?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  search?: string;
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
