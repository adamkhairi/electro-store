// Order Management Types
export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;

  // Dates
  orderDate: Date;
  completedAt?: Date;

  // Customer information
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Addresses
  billToName?: string;
  billToAddress?: string;
  billToCity?: string;
  billToState?: string;
  billToZip?: string;
  billToCountry?: string;

  shipToName?: string;
  shipToAddress?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  shipToCountry?: string;

  // Financial
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;

  // Payment
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;

  // Shipping
  shippingMethod?: string;
  trackingNumber?: string;
  shippedAt?: Date;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Relationships
  tenantId: string;
  salesPersonId?: string;

  // Order items
  items?: OrderItem[];
  payments?: Payment[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitCost?: number;
  totalCost?: number;
  discountAmount: number;
  serialNumbers: string[];

  // Relationships
  orderId: string;
  productId?: string;
  variantId?: string;

  // Product details (for display)
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

  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;

  // Payment processor info
  processorTransactionId?: string;
  processorResponse?: Record<string, any>;

  // Check info
  checkNumber?: string;

  // Card info (last 4 digits only)
  cardLast4?: string;
  cardType?: string;

  // Reference
  reference?: string;
  notes?: string;

  // Relationships
  orderId: string;

  // Timestamps
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  customerNumber: string;
  type: CustomerType;

  // Personal info
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;

  // Address
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Business info
  taxId?: string;

  // Preferences
  preferredContact?: ContactMethod;
  marketingOptIn: boolean;

  // Loyalty
  loyaltyPoints: number;
  loyaltyTier?: LoyaltyTier;

  // Status
  status: CustomerStatus;

  // Relationships
  tenantId: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderType {
  SALE = 'sale',
  RETURN = 'return',
  EXCHANGE = 'exchange',
  QUOTE = 'quote',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CHECK = 'check',
  STORE_CREDIT = 'store_credit',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum ContactMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  SMS = 'sms',
}

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

// Order Request/Response Types
export interface CreateOrderRequest {
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  type?: OrderType;

  // Billing address
  billToName?: string;
  billToAddress?: string;
  billToCity?: string;
  billToState?: string;
  billToZip?: string;
  billToCountry?: string;

  // Shipping address
  shipToName?: string;
  shipToAddress?: string;
  shipToCity?: string;
  shipToState?: string;
  shipToZip?: string;
  shipToCountry?: string;

  // Items
  items: {
    productId?: string;
    variantId?: string;
    quantity: number;
    unitPrice?: number;
    discountAmount?: number;
    serialNumbers?: string[];
  }[];

  // Payment
  paymentMethod?: PaymentMethod;
  paidAmount?: number;

  // Shipping
  shippingMethod?: string;
  shippingAmount?: number;

  // Discounts
  discountAmount?: number;

  // Notes
  notes?: string;
  internalNotes?: string;
}

export interface UpdateOrderRequest {
  id: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
  internalNotes?: string;
}

export interface OrderListRequest {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'orderNumber' | 'orderDate' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  orders: (Order & {
    customer?: {
      id: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      email?: string;
    };
    salesPerson?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateCustomerRequest {
  type?: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  preferredContact?: ContactMethod;
  marketingOptIn?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

export interface ProcessPaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;

  // Card payment specific
  cardToken?: string;
  cardLast4?: string;
  cardType?: string;

  // Check payment specific
  checkNumber?: string;

  // Reference and notes
  reference?: string;
  notes?: string;
}
