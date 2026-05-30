"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types";

type CartState = {
  items: CartItem[];
  coupon?: { code: string; discount: number };
  addItem: (product: Product, quantity?: number, color?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  setCoupon: (coupon?: { code: string; discount: number }) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1, color) =>
        set((state) => {
          const existing = state.items.find((item) => item.product._id === product._id && item.color === color);
          if (existing) {
            return { items: state.items.map((item) => (item === existing ? { ...item, quantity: item.quantity + quantity } : item)) };
          }
          return { items: [...state.items, { product, quantity, color }] };
        }),
      updateQuantity: (productId, quantity) => set((state) => ({ items: state.items.map((item) => (item.product._id === productId ? { ...item, quantity } : item)).filter((item) => item.quantity > 0) })),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((item) => item.product._id !== productId) })),
      clear: () => set({ items: [], coupon: undefined }),
      setCoupon: (coupon) => set({ coupon })
    }),
    { name: "gridstores-cart" }
  )
);
