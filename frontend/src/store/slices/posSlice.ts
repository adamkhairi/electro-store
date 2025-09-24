import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PosCartItem {
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
}

export interface PosPayment {
  method: 'cash' | 'card' | 'check' | 'store_credit' | 'gift_card' | 'split';
  amount: number;
  cardLast4?: string;
  cardType?: string;
  cardBrand?: string;
  checkNumber?: string;
  giftCardNumber?: string;
}

export interface PosState {
  locationId: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  items: PosCartItem[];
  payments: PosPayment[];
  taxAmount: number;
  discountAmount: number;
  notes?: string | null;
}

const initialState: PosState = {
  locationId: null,
  customerId: null,
  customerEmail: null,
  customerPhone: null,
  customerName: null,
  items: [],
  payments: [],
  taxAmount: 0,
  discountAmount: 0,
  notes: null,
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<string | null>) {
      state.locationId = action.payload;
    },
    setCustomer(
      state,
      action: PayloadAction<{
        customerId?: string | null;
        customerEmail?: string | null;
        customerPhone?: string | null;
        customerName?: string | null;
      }>
    ) {
      state.customerId = action.payload.customerId ?? null;
      state.customerEmail = action.payload.customerEmail ?? null;
      state.customerPhone = action.payload.customerPhone ?? null;
      state.customerName = action.payload.customerName ?? null;
    },
    clearCustomer(state) {
      state.customerId = null;
      state.customerEmail = null;
      state.customerPhone = null;
      state.customerName = null;
    },
    addItem(state, action: PayloadAction<PosCartItem>) {
      const incoming = action.payload;
      const existing = state.items.find(
        i => i.productId === incoming.productId && i.variantId === incoming.variantId
      );
      if (existing) {
        existing.quantity += incoming.quantity;
        existing.unitPrice = incoming.unitPrice; // latest price wins
        existing.discountAmount = incoming.discountAmount ?? existing.discountAmount;
      } else {
        state.items.push(incoming);
      }
    },
    updateItem(
      state,
      action: PayloadAction<{
        productId: string;
        variantId?: string;
        quantity?: number;
        unitPrice?: number;
        discountAmount?: number;
      }>
    ) {
      const { productId, variantId } = action.payload;
      const existing = state.items.find(
        i => i.productId === productId && i.variantId === variantId
      );
      if (existing) {
        if (typeof action.payload.quantity === 'number')
          existing.quantity = action.payload.quantity;
        if (typeof action.payload.unitPrice === 'number')
          existing.unitPrice = action.payload.unitPrice;
        if (typeof action.payload.discountAmount === 'number')
          existing.discountAmount = action.payload.discountAmount;
      }
    },
    removeItem(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      state.items = state.items.filter(
        i => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
      );
    },
    clearCart(state) {
      state.items = [];
      state.payments = [];
      state.taxAmount = 0;
      state.discountAmount = 0;
      state.notes = null;
    },
    setTaxAmount(state, action: PayloadAction<number>) {
      state.taxAmount = action.payload;
    },
    setDiscountAmount(state, action: PayloadAction<number>) {
      state.discountAmount = action.payload;
    },
    addPayment(state, action: PayloadAction<PosPayment>) {
      state.payments.push(action.payload);
    },
    removePayment(state, action: PayloadAction<number>) {
      state.payments.splice(action.payload, 1);
    },
    clearPayments(state) {
      state.payments = [];
    },
    setNotes(state, action: PayloadAction<string | null | undefined>) {
      state.notes = action.payload ?? null;
    },
  },
});

export const {
  setLocation,
  setCustomer,
  clearCustomer,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  setTaxAmount,
  setDiscountAmount,
  addPayment,
  removePayment,
  clearPayments,
  setNotes,
} = posSlice.actions;

export default posSlice.reducer;
