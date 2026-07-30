import { create } from 'zustand';
import { Item, Customer, CartItem, PaymentMethod, Bill } from '../types';
import api from '../services/api';

interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  rawGrandTotal: number;
  roundOff: number;
  grandTotal: number;
}

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  paymentMethod: PaymentMethod;
  splitDetails: { cashAmount?: number; cardAmount?: number; upiAmount?: number };
  billDiscountType: 'FLAT' | 'PERCENTAGE' | null;
  billDiscountValue: number;
  notes: string;
  isSubmitting: boolean;

  addItem: (item: Item, quantity?: number) => void;
  addCustomItem: (name: string, price: number, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setItemDiscount: (itemId: string, discountPercentage: number) => void;
  setBillDiscount: (type: 'FLAT' | 'PERCENTAGE' | null, value: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setSplitDetails: (details: { cashAmount?: number; cardAmount?: number; upiAmount?: number }) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotals: () => CartTotals;
  checkout: () => Promise<Bill>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  paymentMethod: PaymentMethod.CASH,
  splitDetails: { cashAmount: 0, cardAmount: 0, upiAmount: 0 },
  billDiscountType: null,
  billDiscountValue: 0,
  notes: '',
  isSubmitting: false,

  addItem: (item: Item, quantity = 1) => {
    const { items } = get();
    const existingIndex = items.findIndex((i) => i.item._id === item._id);

    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + quantity;
      if (newQty <= item.currentStock) {
        updated[existingIndex].quantity = newQty;
        set({ items: updated });
      }
    } else {
      if (quantity <= item.currentStock) {
        const newItem: CartItem = {
          item,
          quantity,
          discountPercentage: item.discountPercentage || 0,
          discountAmount: 0,
          gstPercentage: item.gstPercentage || 0,
          taxAmount: 0,
          totalAmount: item.sellingPrice * quantity,
        };
        set({ items: [...items, newItem] });
      }
    }
  },

  addCustomItem: (name: string, price: number, quantity = 1) => {
    const customId = `custom-${Date.now()}`;
    const customItem: Item = {
      _id: customId,
      name: name.trim() || 'Custom Item',
      categoryId: 'general',
      sku: `CUSTOM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      sellingPrice: price,
      costPrice: price,
      mrp: price,
      discountPercentage: 0,
      gstPercentage: 0,
      currentStock: 9999,
      minimumStock: 0,
      status: 'ACTIVE',
    };
    get().addItem(customItem, quantity);
  },

  removeItem: (itemId: string) => {
    set({ items: get().items.filter((i) => i.item._id !== itemId) });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const { items } = get();
    const updated = items.map((cartItem) => {
      if (cartItem.item._id === itemId) {
        const validQty = Math.min(quantity, cartItem.item.currentStock);
        return { ...cartItem, quantity: validQty };
      }
      return cartItem;
    });
    set({ items: updated });
  },

  setItemDiscount: (itemId: string, discountPercentage: number) => {
    const { items } = get();
    const updated = items.map((cartItem) => {
      if (cartItem.item._id === itemId) {
        return { ...cartItem, discountPercentage };
      }
      return cartItem;
    });
    set({ items: updated });
  },

  setBillDiscount: (type, value) => {
    set({ billDiscountType: type, billDiscountValue: Math.max(0, value) });
  },

  setCustomer: (customer) => set({ customer }),

  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

  setSplitDetails: (splitDetails) => set({ splitDetails }),

  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      items: [],
      customer: null,
      paymentMethod: PaymentMethod.CASH,
      splitDetails: { cashAmount: 0, cardAmount: 0, upiAmount: 0 },
      billDiscountType: null,
      billDiscountValue: 0,
      notes: '',
    }),

  getTotals: () => {
    const { items, billDiscountType, billDiscountValue } = get();

    let subtotal = 0;
    let itemDiscountTotal = 0;
    let taxTotal = 0;

    items.forEach((cartItem) => {
      const rawPrice = cartItem.item.sellingPrice * cartItem.quantity;
      const discount = (rawPrice * (cartItem.discountPercentage || 0)) / 100;
      const discountedPrice = rawPrice - discount;
      const tax = (discountedPrice * (cartItem.gstPercentage || 0)) / 100;

      subtotal += rawPrice;
      itemDiscountTotal += discount;
      taxTotal += tax;
    });

    let overallDiscount = 0;
    if (billDiscountType && billDiscountValue > 0) {
      if (billDiscountType === 'FLAT') {
        overallDiscount = billDiscountValue;
      } else if (billDiscountType === 'PERCENTAGE') {
        overallDiscount = ((subtotal - itemDiscountTotal) * billDiscountValue) / 100;
      }
    }

    const discountTotal = itemDiscountTotal + overallDiscount;
    const rawGrandTotal = subtotal - discountTotal + taxTotal;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

    return {
      subtotal,
      discountTotal,
      taxTotal,
      rawGrandTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
    };
  },

  checkout: async () => {
    const { items, customer, paymentMethod, splitDetails, billDiscountType, billDiscountValue, notes } = get();

    if (items.length === 0) {
      throw new Error('Cart is empty.');
    }

    set({ isSubmitting: true });

    try {
      // Resolve custom unlisted items to real DB records before checkout
      const finalBillItems = [];
      for (const i of items) {
        let itemId = i.item._id;
        if (itemId.startsWith('custom-')) {
          const res = await api.post('/items', {
            name: i.item.name,
            sellingPrice: i.item.sellingPrice,
            currentStock: 9999,
          });
          if (res.data.success && res.data.data) {
            itemId = res.data.data._id;
          }
        }
        finalBillItems.push({
          itemId,
          quantity: i.quantity,
          discountPercentage: i.discountPercentage,
        });
      }

      const payload = {
        items: finalBillItems,
        paymentMethod,
        splitDetails: paymentMethod === PaymentMethod.SPLIT ? splitDetails : undefined,
        billDiscountType: billDiscountType || undefined,
        billDiscountValue: billDiscountValue || undefined,
        customerId: customer ? customer._id : undefined,
        notes,
      };

      const res = await api.post('/bills', payload);
      if (res.data.success) {
        const createdBill: Bill = res.data.data;
        get().clearCart();
        set({ isSubmitting: false });
        return createdBill;
      }
      throw new Error(res.data.message || 'Checkout failed.');
    } catch (err: any) {
      set({ isSubmitting: false });
      throw new Error(err.response?.data?.message || err.message || 'Checkout failed.');
    }
  },
}));
